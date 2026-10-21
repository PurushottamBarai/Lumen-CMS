/**
 * Lumen CMS — User Trust & Reputation Service
 * Phase 3: Sadanand Module
 *
 * Provides centralized business logic for trust score updates, tier determination,
 * idempotent audit logging, and trust analytics.
 */

const userStore = require('../models/userStore');
const reputationStore = require('../models/reputationStore');

// Standard reputation delta constants
const REPUTATION_RULES = {
  ARTICLE_APPROVED: { delta: 10, label: 'Approved Article Publication' },
  ARTICLE_REJECTED_VIOLATION: { delta: -10, label: 'Policy Violation Article Rejection' },
  COMMENT_MODERATED_DELETE: { delta: -5, label: 'Moderated Comment Removal' },
  HELPFUL_REACTION_RECEIVED: { delta: 2, label: 'Helpful Community Reaction' },
  QUIZ_COMPLETED: { delta: 2, label: 'Knowledge Quiz Completion' },
  REPORT_CONFIRMED_PENALTY: { delta: -15, label: 'Confirmed Community Report Violation' },
};

/**
 * Calculates tier standing based on trust score [0 - 100].
 * - restricted: 0 – 34
 * - neutral: 35 – 59
 * - trusted: 60 – 79
 * - exemplary: 80 – 100
 */
const calculateTrustLevel = (score) => {
  const numericScore = typeof score === 'number' ? score : 50;
  if (numericScore >= 80) return 'exemplary';
  if (numericScore >= 60) return 'trusted';
  if (numericScore >= 35) return 'neutral';
  return 'restricted';
};

/**
 * Records a reputation event and updates the user's trust score and level.
 * Guarantees idempotency when sourceId is provided.
 */
const recordReputationEvent = async ({
  userId,
  eventType,
  delta,
  reason,
  sourceId = null,
  createdBy = null,
}) => {
  if (!userId) {
    throw new Error('User ID is required to record reputation event');
  }

  // Idempotency check: if sourceId is provided, make sure this event wasn't already awarded
  if (sourceId) {
    const alreadyProcessed = await reputationStore.hasEventOccurred(userId, eventType, sourceId);
    if (alreadyProcessed) {
      const existingUser = await userStore.findById(userId);
      return {
        user: existingUser,
        log: null,
        duplicate: true,
        message: `Event ${eventType} for source ${sourceId} was already processed.`,
      };
    }
  }

  const user = await userStore.findById(userId);
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  const previousScore = typeof user.trustScore === 'number' ? user.trustScore : 50;
  const newScore = Math.max(0, Math.min(100, previousScore + delta));
  const newLevel = calculateTrustLevel(newScore);

  const updates = {
    trustScore: newScore,
    trustLevel: newLevel,
    lastReputationUpdate: new Date(),
  };

  if (delta > 0) {
    updates.positiveContributionsCount = (user.positiveContributionsCount || 0) + 1;
  } else if (delta < 0) {
    updates.violationsCount = (user.violationsCount || 0) + 1;
  }

  const updatedUser = await userStore.findByIdAndUpdate(userId, updates);

  // Write immutable audit log
  const log = await reputationStore.createLog({
    user: userId,
    delta,
    previousScore,
    newScore,
    eventType,
    reason,
    sourceId,
    createdBy,
  });

  return {
    user: updatedUser,
    log,
    duplicate: false,
    message: `Reputation updated by ${delta > 0 ? '+' : ''}${delta} points.`,
  };
};

/**
 * Convenience trigger methods for other modules & controllers
 */
const trustService = {
  REPUTATION_RULES,
  calculateTrustLevel,
  recordReputationEvent,

  async handleArticleApproved(articleId, authorId, adminId = null) {
    return recordReputationEvent({
      userId: authorId,
      eventType: 'ARTICLE_APPROVED',
      delta: REPUTATION_RULES.ARTICLE_APPROVED.delta,
      reason: 'Article approved and published to the platform',
      sourceId: articleId?.toString(),
      createdBy: adminId,
    });
  },

  async handleArticleRejectedViolation(articleId, authorId, reason = 'Article rejected due to content policy violations', adminId = null) {
    return recordReputationEvent({
      userId: authorId,
      eventType: 'ARTICLE_REJECTED_VIOLATION',
      delta: REPUTATION_RULES.ARTICLE_REJECTED_VIOLATION.delta,
      reason: reason || 'Article rejected due to content policy violations',
      sourceId: articleId?.toString(),
      createdBy: adminId,
    });
  },

  async handleCommentModerated(commentId, authorId, reason = 'Comment removed by moderator for policy violation', adminId = null) {
    return recordReputationEvent({
      userId: authorId,
      eventType: 'COMMENT_MODERATED_DELETE',
      delta: REPUTATION_RULES.COMMENT_MODERATED_DELETE.delta,
      reason: reason || 'Comment removed by moderator for policy violation',
      sourceId: commentId?.toString(),
      createdBy: adminId,
    });
  },

  async handleHelpfulReaction(sourceId, authorId) {
    return recordReputationEvent({
      userId: authorId,
      eventType: 'HELPFUL_REACTION_RECEIVED',
      delta: REPUTATION_RULES.HELPFUL_REACTION_RECEIVED.delta,
      reason: 'Received helpful reaction on community contribution',
      sourceId: sourceId?.toString(),
    });
  },

  async handleQuizCompleted(quizId, userId) {
    return recordReputationEvent({
      userId,
      eventType: 'QUIZ_COMPLETED',
      delta: REPUTATION_RULES.QUIZ_COMPLETED.delta,
      reason: 'Successfully completed educational knowledge quiz',
      sourceId: quizId?.toString(),
    });
  },

  async handleReportConfirmed(reportId, targetUserId, reason = 'Confirmed violation from user report', adminId = null) {
    return recordReputationEvent({
      userId: targetUserId,
      eventType: 'REPORT_CONFIRMED_PENALTY',
      delta: REPUTATION_RULES.REPORT_CONFIRMED_PENALTY.delta,
      reason: reason || 'Confirmed violation from user report',
      sourceId: reportId?.toString(),
      createdBy: adminId,
    });
  },

  async handleAdminAdjustment(userId, delta, reason, adminId) {
    if (typeof delta !== 'number' || isNaN(delta)) {
      throw new Error('Delta must be a valid number');
    }
    if (!reason || !reason.trim()) {
      throw new Error('A reason is mandatory for manual admin trust score adjustments');
    }
    return recordReputationEvent({
      userId,
      eventType: 'ADMIN_MANUAL_ADJUSTMENT',
      delta,
      reason: reason.trim(),
      sourceId: `admin_adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdBy: adminId,
    });
  },

  async getUserReputationHistory(userId, limit = 50) {
    return reputationStore.getLogsByUser(userId, limit);
  },

  async getPlatformTrustStats() {
    const allUsers = await userStore.find();
    const stats = {
      totalUsers: allUsers.length,
      averageScore: 0,
      tiers: {
        exemplary: 0,
        trusted: 0,
        neutral: 0,
        restricted: 0,
      },
      totalPositiveContributions: 0,
      totalViolations: 0,
    };

    if (allUsers.length === 0) return stats;

    let scoreSum = 0;
    allUsers.forEach((u) => {
      const score = typeof u.trustScore === 'number' ? u.trustScore : 50;
      scoreSum += score;
      const level = u.trustLevel || calculateTrustLevel(score);
      if (stats.tiers[level] !== undefined) {
        stats.tiers[level] += 1;
      }
      stats.totalPositiveContributions += u.positiveContributionsCount || 0;
      stats.totalViolations += u.violationsCount || 0;
    });

    stats.averageScore = Math.round((scoreSum / allUsers.length) * 10) / 10;
    return stats;
  },

  async getTrustLeaderboard(limit = 10) {
    const allUsers = await userStore.find();
    return allUsers
      .map((u) => ({
        id: u._id || u.id,
        _id: u._id || u.id,
        name: u.name,
        role: u.role,
        avatar: u.avatar,
        trustScore: u.trustScore ?? 50,
        trustLevel: u.trustLevel || calculateTrustLevel(u.trustScore ?? 50),
        positiveContributionsCount: u.positiveContributionsCount || 0,
        violationsCount: u.violationsCount || 0,
      }))
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, limit);
  },
};

module.exports = trustService;
