const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');
const { optionalAuth, authenticateUser } = require('../middleware/auth');

/**
 * Common handler for personalized feed
 */
const handleRecommendations = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const limit = parseInt(req.query.limit, 10) || 8;
    const page = parseInt(req.query.page, 10) || 1;

    const result = await recommendationService.getPersonalizedFeed(userId, { limit, page });

    return res.status(200).json({
      success: true,
      data: result.articles,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (error) {
    console.error('Error in recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message,
    });
  }
};

// Handles both /api/recommendations/ and /api/recommendations/for-you
router.get('/', optionalAuth, handleRecommendations);
router.get('/for-you', optionalAuth, handleRecommendations);

/**
 * @route   POST /api/recommendations/track-view
 * @desc    Records that a user viewed an article
 * @access  Private
 */
router.post('/track-view', authenticateUser, async (req, res) => {
  try {
    const { articleId } = req.body;
    if (!articleId) {
      return res.status(400).json({
        success: false,
        message: 'articleId is required',
      });
    }

    await recommendationService.trackArticleView(req.user._id, articleId);

    return res.status(200).json({
      success: true,
      message: 'View tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking article view:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record view',
      error: error.message,
    });
  }
});

module.exports = router;