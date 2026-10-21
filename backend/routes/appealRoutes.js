const express = require('express');

const router = express.Router();

const {
  createAppeal,
  getMyAppeals,
  getAppeals,
  reviewAppeal,
} = require('../controllers/appealController');

const {
  authenticateUser,
  authorizeRole,
} = require('../middleware/auth');

// User submits an appeal
router.post('/', authenticateUser, createAppeal);

// User views their own appeals
router.get('/my', authenticateUser, getMyAppeals);

// Admin views all appeals
router.get(
  '/',
  authenticateUser,
  authorizeRole('admin'),
  getAppeals
);

// Admin reviews an appeal
router.patch(
  '/:id/review',
  authenticateUser,
  authorizeRole('admin'),
  reviewAppeal
);

module.exports = router;