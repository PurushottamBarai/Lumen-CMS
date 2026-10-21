const jwt = require('jsonwebtoken');
const userStore = require('../models/userStore');

/**
 * Reusable JWT Authentication Middleware for the entire Lumen project.
 */
const authenticateUser = async (req, res, next) => {
  let token;

  // 1. Extract Bearer token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No authorization token provided.',
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'lumen_super_secret_jwt_key_2026_cms_platform';

  try {
    // 2. Verify JWT signature & expiration using environment secret
    const decoded = jwt.verify(token, jwtSecret);

    // 3. Find user by ID via userStore
    const currentUser = await userStore.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // 4. Attach authenticated user to request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please sign in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token. Access denied.',
    });
  }
};

/**
 * Optional Authentication: Attaches user if valid token present, continues normally if not.
 */
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    const token = req.headers.authorization.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'lumen_super_secret_jwt_key_2026_cms_platform';
    if (token) {
      try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = await userStore.findById(decoded.id);
      } catch (err) {
        // Silently proceed for optional auth
      }
    }
  }
  next();
};

/**
 * Reusable Role-Based Authorization Middleware.
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to perform this action. Required: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  optionalAuth,
  authorizeRole,
  protect: authenticateUser,
  restrictTo: authorizeRole,
};
