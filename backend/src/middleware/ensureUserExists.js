/**
 * Middleware to ensure user exists in our database
 * Creates user record if it doesn't exist (syncs from Clerk)
 */

const { getAuth } = require('@clerk/express');
const { createClerkClient } = require('@clerk/backend');
const userModel = require('../models/userModel');
const logger = require('../utils/logger');

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

/**
 * Ensure user exists in database, create if not
 * This syncs Clerk users with our local database
 */
const ensureUserExists = async (req, res, next) => {
  try {
    // Get auth from Clerk Express middleware
    const auth = getAuth(req);
    
    if (!auth?.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const clerkUserId = auth.userId;

    // Get or create user in our database
    let user = await userModel.getUserByClerkId(clerkUserId);

    if (!user) {
      // Fetch user details from Clerk
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        
        const email = clerkUser.primaryEmailAddress?.emailAddress || 
                      clerkUser.emailAddresses?.[0]?.emailAddress || 
                      `${clerkUserId}@unknown.com`;
        
        const firstName = clerkUser.firstName || 'User';
        const lastName = clerkUser.lastName || '';

        logger.info(`[ensureUserExists] Creating new user: ${email} (${clerkUserId})`);

        // Create user in our database
        user = await userModel.createUser({
          clerkUserId,
          email,
          firstName,
          lastName
        });

        logger.info(`[ensureUserExists] User created successfully: ${email}`);
      } catch (clerkError) {
        logger.error('[ensureUserExists] Error fetching from Clerk:', clerkError);
        
        // Create with minimal info if Clerk fetch fails
        user = await userModel.createUser({
          clerkUserId,
          email: `${clerkUserId}@unknown.com`,
          firstName: 'User',
          lastName: ''
        });
      }
    } else {
      // Update last active timestamp
      await userModel.updateLastActive(user.user_id);
    }

    // Attach user ID to request object for downstream use
    req.userId = user.user_id;
    req.clerkUserId = clerkUserId;

    // Continue to next middleware/route
    next();

  } catch (error) {
    logger.error('[ensureUserExists] Error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to sync user data'
    });
  }
};

module.exports = ensureUserExists;

