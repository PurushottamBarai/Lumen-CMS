/**
 * Lumen CMS — User Trust & Reputation Routes
 * Phase 3: Sadanand Module
 */

const express = require('express');
const router = express.Router();
const {
  getMyTrustProfile,
  getUserTrustProfile,
  getUserTrustHistory,
  adjustUserTrustScore,
  getPlatformTrustStats,
  getTrustLeaderboard,
  getAllReputationLogs,
} = require('../controllers/trustController');
const { authenticateUser, optionalAuth, authorizeRole } = require('../middleware/auth');

// Public & Contributor endpoints
router.get('/my-score', authenticateUser, getMyTrustProfile);
router.get('/leaderboard', optionalAuth, getTrustLeaderboard);
router.get('/users/:id', optionalAuth, getUserTrustProfile);

// Admin moderation & analytics endpoints
router.get('/stats', authenticateUser, authorizeRole('admin'), getPlatformTrustStats);
router.get('/logs', authenticateUser, authorizeRole('admin'), getAllReputationLogs);
router.get('/users/:id/history', authenticateUser, authorizeRole('admin'), getUserTrustHistory);
router.post('/users/:id/adjust', authenticateUser, authorizeRole('admin'), adjustUserTrustScore);

module.exports = router;
