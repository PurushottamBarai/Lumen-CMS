const express = require('express');

const {
  createArticle,
  getArticles,
  getArticleById,
  getRecommendedArticles,
  getTopicTrends,
  updateArticle,
  submitArticle,

  getMyArticles,
  getMyArticleById,
  getPublishedArticlesByAuthor,
  likeArticle,
  incrementViews,
  deleteArticle,
  reviewArticle,
  getAllArticlesForAdmin,
  approveArticle,
  rejectArticle,
  requestChanges,
  publishArticle,
} = require('../controllers/articleController');

const {
  authenticateUser,
  authorizeRole,
  optionalAuth,
} = require('../middleware/auth');
const { requireDatabase } = require('../middleware/requireDatabase');

const {
  getAuthorFreshnessAlerts,
  auditDraftHandler,
  getExplanationHandler,
} = require('../controllers/freshnessController');

const router = express.Router();

// =====================================================
// PUBLIC ROUTES
// =====================================================

// Get all articles
router.get('/', optionalAuth, getArticles);

// Topic trend analysis (must be registered before the generic /:id route)
router.get('/topics/trends', requireDatabase, getTopicTrends);

// Get published articles by a specific author
router.get(
  '/author/:id',
  getPublishedArticlesByAuthor
);

// Increment article views
router.patch(
  '/:id/view',
  incrementViews
);

// =====================================================
// LOGGED-IN USER / AUTHOR ROUTES
// =====================================================

// Get logged-in author's articles
router.get(
  '/mine',
  authenticateUser,
  getMyArticles
);

// Get logged-in author's specific article by ID
router.get(
  '/mine/:id',
  authenticateUser,
  authorizeRole('author', 'admin'),
  getMyArticleById
);

// Like an article
router.patch(
  '/:id/like',
  authenticateUser,
  likeArticle
);

// Create article
router.post(
  '/',
  authenticateUser,
  authorizeRole('author', 'admin'),
  createArticle
);

// Submit article for review
router.patch(
  '/:id/submit',
  authenticateUser,
  authorizeRole('author', 'admin'),
  submitArticle
);

// Update article
router.put(
  '/:id',
  authenticateUser,
  authorizeRole('author', 'admin'),
  updateArticle
);

// Delete article
router.delete(
  '/:id',
  authenticateUser,
  authorizeRole('author', 'admin'),
  deleteArticle
);

// =====================================================
// ADMIN ARTICLE REVIEW ROUTES
// =====================================================

// Get all articles for admin
router.get(
  '/admin/all',
  authenticateUser,
  authorizeRole('admin'),
  getAllArticlesForAdmin
);

// Admin: approve article
router.patch(
  '/:id/approve',
  authenticateUser,
  authorizeRole('admin'),
  approveArticle
);

// Admin: reject article
router.patch(
  '/:id/reject',
  authenticateUser,
  authorizeRole('admin'),
  rejectArticle
);

// Admin: request article changes
router.patch(
  '/:id/request-changes',
  authenticateUser,
  authorizeRole('admin'),
  requestChanges
);

// Admin: publish article
router.patch(
  '/:id/publish',
  authenticateUser,
  authorizeRole('admin'),
  publishArticle
);

// Admin: review article
router.patch(
  '/:id/review',
  authenticateUser,
  authorizeRole('admin'),
  reviewArticle
);

// =====================================================
// GET SINGLE ARTICLE
// IMPORTANT: Keep this LAST because /:id is generic.
// =====================================================

// Recommended articles
router.get('/:id/recommendations', optionalAuth, getRecommendedArticles);

// Content Freshness & Explanations (Features 9 & 10)
router.get('/freshness/alerts', optionalAuth, getAuthorFreshnessAlerts);
router.post('/freshness/audit', optionalAuth, auditDraftHandler);
router.get('/:id/explanation', optionalAuth, getExplanationHandler);

router.get('/:id', optionalAuth, getArticleById);


module.exports = router;
