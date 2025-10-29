const { verifyToken } = require('@clerk/backend');
const { createClerkClient } = require('@clerk/backend');
const userModel = require('../models/userModel');
const logger = require('../utils/logger');

/**
 * Optional authentication middleware
 * Uses Clerk if configured, otherwise allows development without auth
 */

// Check if Clerk is properly configured
const hasClerkConfig = process.env.CLERK_SECRET_KEY && 
                       process.env.CLERK_SECRET_KEY.startsWith('sk_');

const clerkClient = hasClerkConfig ? createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
}) : null;

let warnedOnce = false;

const optionalAuth = async (req, res, next) => {
  console.log(`[optionalAuth] ${req.method} ${req.path} - hasClerkConfig: ${hasClerkConfig}`);
  
  if (!hasClerkConfig) {
    // Development mode without Clerk - create/get dev user
    if (!warnedOnce) {
      console.warn('⚠️ Running without Clerk authentication (development mode)');
      warnedOnce = true;
    }
    
    // Get or create dev user
    try {
      let devUser = await userModel.getUserByClerkId('dev-user-123');
      if (!devUser) {
        devUser = await userModel.createUser({
          clerkUserId: 'dev-user-123',
          email: 'dev@localhost.com',
          firstName: 'Dev',
          lastName: 'User'
        });
        console.log('[optionalAuth] ✅ Created dev user');
      }
      
      req.userId = devUser.user_id;
      req.clerkUserId = 'dev-user-123';
      req.auth = { userId: 'dev-user-123' };
      
      console.log('[optionalAuth] Using dev user (no Clerk config)');
      return next();
    } catch (devUserError) {
      console.error('[optionalAuth] Failed to create dev user:', devUserError);
      // Fallback to mock ID
      req.userId = 'dev-user-123';
      req.clerkUserId = 'dev-user-123';
      req.auth = { userId: 'dev-user-123' };
      return next();
    }
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    console.log('[optionalAuth] Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[optionalAuth] ⚠️ No token provided - using dev mode');
      // In dev mode, allow without auth - get or create dev user
      try {
        let devUser = await userModel.getUserByClerkId('dev-user-123');
        if (!devUser) {
          devUser = await userModel.createUser({
            clerkUserId: 'dev-user-123',
            email: 'dev@localhost.com',
            firstName: 'Dev',
            lastName: 'User'
          });
          console.log('[optionalAuth] ✅ Created dev user');
        }
        
        req.userId = devUser.user_id;
        req.clerkUserId = 'dev-user-123';
        req.auth = { userId: 'dev-user-123' };
        
        return next();
      } catch (devUserError) {
        console.error('[optionalAuth] Failed to create dev user:', devUserError);
        // Fallback to mock ID
        req.userId = 'dev-user-123';
        req.clerkUserId = 'dev-user-123';
        req.auth = { userId: 'dev-user-123' };
        return next();
      }
    }

    const token = authHeader.split(' ')[1];
    console.log('[optionalAuth] Token received (first 20 chars):', token.substring(0, 20) + '...');
    
    // Verify the token with Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });

    const clerkUserId = payload.sub;
    console.log('[optionalAuth] ✅ Token verified, Clerk user ID:', clerkUserId);
    
    // Set auth context (similar to what clerkMiddleware would do)
    req.auth = { userId: clerkUserId };
    req.clerkUserId = clerkUserId;

    // Get or create user in our database
    let user = await userModel.getUserByClerkId(clerkUserId);
    console.log('[optionalAuth] User in DB:', user ? `Found (${user.user_id})` : 'Not found, will create');

    if (!user) {
      // Fetch user details from Clerk and create
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        
        const email = clerkUser.primaryEmailAddress?.emailAddress || 
                      clerkUser.emailAddresses?.[0]?.emailAddress || 
                      `${clerkUserId}@unknown.com`;
        
        const firstName = clerkUser.firstName || 'User';
        const lastName = clerkUser.lastName || '';

        logger.info(`[optionalAuth] Creating new user: ${email} (${clerkUserId})`);

        user = await userModel.createUser({
          clerkUserId,
          email,
          firstName,
          lastName
        });

        logger.info(`[optionalAuth] User created successfully: ${email}`);
      } catch (clerkError) {
        logger.error('[optionalAuth] Error fetching from Clerk:', clerkError);
        
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

    // Attach user ID to request object
    req.userId = user.user_id;
    console.log('[optionalAuth] ✅ Authentication successful, userId:', req.userId);
    
    next();

  } catch (error) {
    console.error('[optionalAuth] ❌ Authentication error:', error.message);
    logger.error('[optionalAuth] Authentication error:', error);
    
    // In development, allow fallback to dev user instead of rejecting
    console.warn('[optionalAuth] ⚠️ Auth failed, falling back to dev mode');
    
    // Get or create dev user
    try {
      let devUser = await userModel.getUserByClerkId('dev-user-123');
      if (!devUser) {
        devUser = await userModel.createUser({
          clerkUserId: 'dev-user-123',
          email: 'dev@localhost.com',
          firstName: 'Dev',
          lastName: 'User'
        });
        console.log('[optionalAuth] ✅ Created dev user');
      }
      
      req.userId = devUser.user_id;
      req.clerkUserId = 'dev-user-123';
      req.auth = { userId: 'dev-user-123' };
      
      return next();
    } catch (devUserError) {
      console.error('[optionalAuth] Failed to create dev user:', devUserError);
      // Fallback to mock ID
      req.userId = 'dev-user-123';
      req.clerkUserId = 'dev-user-123';
      req.auth = { userId: 'dev-user-123' };
      return next();
    }
  }
};

module.exports = optionalAuth;

