const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  getQuizByArticleId,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  attachQuizToArticle,
  submitQuiz,
} = require('../controllers/quizController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

// Public / Authenticated read routes
router.get('/', getAllQuizzes);
router.get('/article/:articleId', getQuizByArticleId);
router.get('/:id', getQuizById);

// Author & Admin creation / update routes
router.post('/', authenticateUser, authorizeRole('author', 'admin'), createQuiz);
router.put('/:id', authenticateUser, authorizeRole('author', 'admin'), updateQuiz);
router.patch('/:id/submit', authenticateUser, authorizeRole('author', 'admin'), submitQuiz);
router.delete('/:id', authenticateUser, authorizeRole('author', 'admin'), deleteQuiz);

// Question Management Routes
router.post('/:id/questions', authenticateUser, authorizeRole('author', 'admin'), addQuestion);
router.put('/:id/questions/:questionId', authenticateUser, authorizeRole('author', 'admin'), updateQuestion);
router.delete('/:id/questions/:questionId', authenticateUser, authorizeRole('author', 'admin'), deleteQuestion);

// Attach Quiz to Article Route
router.put('/:id/attach/:articleId', authenticateUser, authorizeRole('author', 'admin'), attachQuizToArticle);

module.exports = router;
