const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
} = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');
const { requireDatabase } = require('../middleware/requireDatabase');
const { getJwtSecret } = require('../config/jwt');

const requireAuthConfiguration = (req, res, next) => {
  if (getJwtSecret()) return next();
  return res.status(503).json({
    success: false,
    code: 'AUTH_CONFIGURATION_MISSING',
    message: 'Authentication is not configured. Ask the administrator to check the server configuration.',
  });
};

// Public authentication routes
router.post('/register', requireAuthConfiguration, requireDatabase, register);
router.post('/login', requireAuthConfiguration, requireDatabase, login);
router.post('/logout', logout);

// Protected session route
router.get('/me', requireAuthConfiguration, requireDatabase, authenticateUser, getMe);

module.exports = router;
