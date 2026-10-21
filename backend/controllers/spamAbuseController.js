const Comment = require("../models/Comment");
const Report = require("../models/Report");
const User = require("../models/User");

// Suspicious links commonly found in spam
const suspiciousLinkPattern =
    /(https?:\/\/|www\.)[^\s]+/i;

// Common spam keywords/patterns
const spamPattern =
    /(click here|free money|win now|claim now|buy now|limited offer|subscribe now|urgent offer)/i;


// Check a comment for spam
const checkCommentSpam = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        let riskScore = 0;
        const reasons = [];

        // Check suspicious links
        if (suspiciousLinkPattern.test(comment.content)) {
            riskScore += 40;
            reasons.push("Suspicious link detected");
        }

        // Check spam keywords
        if (spamPattern.test(comment.content)) {
            riskScore += 30;
            reasons.push("Spam keywords detected");
        }

        // Check repeated comments by same user
        const recentComments = await Comment.find({
            author: comment.author,
            targetId: comment.targetId,
            _id: { $ne: comment._id },
            createdAt: {
                $gte: new Date(Date.now() - 10 * 60 * 1000),
            },
        }).limit(10);

        const duplicateComment = recentComments.some(
            (item) =>
                item.content.trim().toLowerCase() ===
                comment.content.trim().toLowerCase()
        );

        if (duplicateComment) {
            riskScore += 30;
            reasons.push("Repeated comment detected");
        }

        let riskLevel = "low";

        if (riskScore >= 70) {
            riskLevel = "high";
        } else if (riskScore >= 40) {
            riskLevel = "medium";
        }

        res.status(200).json({
            success: true,
            commentId: comment._id,
            riskScore,
            riskLevel,
            isSpam: riskScore >= 40,
            reasons,
        });
    } catch (error) {
        console.error("Spam detection error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to check comment for spam",
        });
    }
};


// Detect unusual user activity
const checkUserActivity = async (req, res) => {
    try {
        const { userId } = req.params;

        const tenMinutesAgo = new Date(
            Date.now() - 10 * 60 * 1000
        );

        const comments = await Comment.find({
            author: userId,
            createdAt: { $gte: tenMinutesAgo },
        });

        const reports = await Report.find({
            reporterId: userId,
            createdAt: { $gte: tenMinutesAgo },
        });

        let riskScore = 0;
        const reasons = [];

        // Too many comments in a short period
        if (comments.length >= 10) {
            riskScore += 50;
            reasons.push("Unusually high comment activity");
        }

        // Too many reports in a short period
        if (reports.length >= 5) {
            riskScore += 30;
            reasons.push("Unusually high reporting activity");
        }

        let riskLevel = "low";

        if (riskScore >= 70) {
            riskLevel = "high";
        } else if (riskScore >= 40) {
            riskLevel = "medium";
        }

        res.status(200).json({
            success: true,
            userId,
            commentsLast10Minutes: comments.length,
            reportsLast10Minutes: reports.length,
            riskScore,
            riskLevel,
            suspicious: riskScore >= 40,
            reasons,
        });
    } catch (error) {
        console.error("User activity detection error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to check user activity",
        });
    }
};


// Restrict suspicious user
const restrictUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.isRestricted = true;
        user.restrictionReason =
            reason || "Restricted due to suspicious activity";

        await user.save();

        res.status(200).json({
            success: true,
            message: "User restricted successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isRestricted: user.isRestricted,
                restrictionReason: user.restrictionReason,
            },
        });
    } catch (error) {
        console.error("User restriction error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to restrict user",
        });
    }
};


// Get recent comments from a user
const getUserCommentActivity = async (req, res) => {
    try {
        const { userId } = req.params;

        const comments = await Comment.find({
            author: userId,
        })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            count: comments.length,
            comments,
        });
    } catch (error) {
        console.error("Spam activity error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get user activity",
        });
    }
};


// Get pending abuse reports
const getPendingReports = async (req, res) => {
    try {
        const reports = await Report.find({
            status: "pending",
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reports.length,
            reports,
        });
    } catch (error) {
        console.error("Report fetch error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get pending reports",
        });
    }
};


module.exports = {
    checkCommentSpam,
    checkUserActivity,
    restrictUser,
    getUserCommentActivity,
    getPendingReports,
};