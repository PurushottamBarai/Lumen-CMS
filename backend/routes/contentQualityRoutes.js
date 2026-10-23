const express = require('express');

const {
  analyzeContent,
  generateSuggestions,
} = require('../controllers/contentQualityController');

const {
  authenticateUser,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

// Analyze article content quality
router.post(
  '/analyze',
  authenticateUser,
  authorizeRole('author', 'admin'),
  analyzeContent
);

router.post(
  '/suggestions',
  authenticateUser,
  authorizeRole('author', 'admin'),
  generateSuggestions
);

module.exports = router;