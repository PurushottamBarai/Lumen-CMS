const express = require("express");

const {
    checkCommentSpam,
    checkUserActivity,
    restrictUser,
    getUserCommentActivity,
    getPendingReports,
} = require("../controllers/spamAbuseController");

const router = express.Router();

// Check a comment for spam
router.get("/comment/:commentId/check", checkCommentSpam);

// Check unusual activity of a user
router.get("/user/:userId/activity/check", checkUserActivity);

// Get user's recent comment activity
router.get("/user/:userId/activity", getUserCommentActivity);

// Restrict suspicious user
router.patch("/user/:userId/restrict", restrictUser);

// Get pending abuse reports
router.get("/reports/pending", getPendingReports);

module.exports = router;