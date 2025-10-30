const { verifyToken } = require('@clerk/backend');

/**
 * Clerk authentication middleware
 * Verifies JWT tokens from Clerk
 */
const authenticateClerk = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verify the token with Clerk
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });

      // Extract user information from Clerk payload
      req.user = {
        id: payload.sub, // Clerk user ID
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name
      };

      next();
    } catch (verifyError) {
      // In development mode, handle expired tokens gracefully
      if (verifyError.message && verifyError.message.includes('expired') && process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ [DEV MODE] Token expired but continuing anyway for development');
        console.warn('⚠️ This should be fixed with proper token refresh in production!');
        
        // Decode token without verification (DEV ONLY!)
        try {
          const base64Payload = token.split('.')[1];
          const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
          
          req.user = {
            id: payload.sub,
            email: payload.email,
            firstName: payload.given_name,
            lastName: payload.family_name
          };
          
          console.log('⚠️ [DEV MODE] Using expired token for user:', payload.sub);
          return next();
        } catch (decodeErr) {
          console.error('❌ Failed to decode expired token:', decodeErr.message);
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
          });
        }
      }
      
      // If not an expiry error or in production, reject
      throw verifyError;
    }
  } catch (error) {
    console.error('Clerk authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * Optional authentication middleware
 * Continues even if no token is provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });

    req.user = {
      id: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name
    };

    next();
  } catch (error) {
    // If token is invalid, continue without user
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateClerk,
  optionalAuth
};
