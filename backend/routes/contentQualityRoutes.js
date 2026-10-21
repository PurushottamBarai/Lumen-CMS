const express = require('express');

const {
  analyzeContent,
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

module.exports = router;