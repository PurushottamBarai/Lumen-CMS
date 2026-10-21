const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
} = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

// Public authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected session route
router.get('/me', authenticateUser, getMe);

module.exports = router;
