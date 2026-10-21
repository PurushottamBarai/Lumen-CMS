const express = require("express");

const {
  getPendingArticles,
  getPendingQuizzes,

  approveArticle,
  rejectArticle,
  requestArticleChanges,

  approveQuiz,
  rejectQuiz,
  requestQuizChanges,

  getVerificationStats,
} = require("../controllers/adminVerificationController");

const {
  authenticateUser,
  authorizeRole,
} = require("../middleware/auth");

const router = express.Router();

// =====================================================
// AUTHENTICATION + ADMIN AUTHORIZATION
// =====================================================

router.use(authenticateUser);
router.use(authorizeRole("admin"));

// =====================================================
// GET VERIFICATION STATISTICS
// =====================================================

router.get("/stats", getVerificationStats);

// =====================================================
// GET PENDING CONTENT
// =====================================================

router.get("/articles", getPendingArticles);

router.get("/quizzes", getPendingQuizzes);

// =====================================================
// ARTICLE VERIFICATION
// =====================================================

router.put(
  "/articles/:id/approve",
  approveArticle
);

router.put(
  "/articles/:id/reject",
  rejectArticle
);

router.put(
  "/articles/:id/request-changes",
  requestArticleChanges
);

// =====================================================
// QUIZ VERIFICATION
// =====================================================

router.put(
  "/quizzes/:id/approve",
  approveQuiz
);

router.put(
  "/quizzes/:id/reject",
  rejectQuiz
);

router.put(
  "/quizzes/:id/request-changes",
  requestQuizChanges
);

module.exports = router;