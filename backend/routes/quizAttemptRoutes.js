const express = require('express');
const router = express.Router();
const {
  submitQuizAttempt,
  getMyQuizAttempts,
  getQuizAttemptsByQuizId,
} = require('../controllers/quizAttemptController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

router.use(authenticateUser);

router.post('/', submitQuizAttempt);
router.get('/my', getMyQuizAttempts);
router.get('/quiz/:quizId', authorizeRole('author', 'admin'), getQuizAttemptsByQuizId);

module.exports = router;
