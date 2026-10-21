const express = require('express');
const {
  getModerationStats,
  getModeratedContent,
  rescanContent,
  scanAllUnscanned,
  rescanAllContent,
} = require('../controllers/moderationController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// All moderation routes are protected for admins
router.use(authenticateUser, authorizeRole('admin'));

// GET  — stats for the AI dashboard
router.get('/stats', getModerationStats);

// GET  — all content with AI moderation flags & scores
router.get('/content', getModeratedContent);

// POST — rescan a specific article or quiz
router.post('/rescan/:type/:id', rescanContent);

// POST — scan only unscanned items
router.post('/scan-all', scanAllUnscanned);

// POST — force-rescan EVERY item with Gemini AI (fixes stale 0-score records)
router.post('/rescan-all', rescanAllContent);

module.exports = router;
