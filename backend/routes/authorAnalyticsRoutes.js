const express = require('express');
const {
  getMyAuthorAnalytics,
  getAuthorAnalyticsById,
} = require('../controllers/authorAnalyticsController');
const { shareArticle } = require('../controllers/articleController');
const { authenticateUser, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET logged-in author's full performance analytics
router.get('/me', authenticateUser, getMyAuthorAnalytics);

// GET analytics for any author by ID (for public author profile or admin review)
router.get('/author/:authorId', optionalAuth, getAuthorAnalyticsById);

// POST record article share & increment share metric
router.post('/articles/:id/share', optionalAuth, shareArticle);
router.patch('/articles/:id/share', optionalAuth, shareArticle);

module.exports = router;
