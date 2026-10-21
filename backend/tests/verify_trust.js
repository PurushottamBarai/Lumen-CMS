/**
 * Lumen CMS — User Trust & Reputation Module Verification Suite
 * Phase 3: Sadanand Module
 *
 * Automated tests covering:
 * - Baseline trust score (50) and initial tier (neutral)
 * - Tier boundary calculation (restricted, neutral, trusted, exemplary)
 * - Positive contribution rewards (Article approval +10, Helpful reaction +2, Quiz completion +2)
 * - Violation penalties (Policy rejection -10, Comment moderation -5, Report confirmed -15)
 * - Strict clamping between [0, 100]
 * - Idempotency & deduplication for events with sourceId
 * - Immutable reputation audit logging & history retrieval
 * - Admin manual adjustment with mandatory justification requirement
 * - Platform trust analytics & leaderboard ranking
 * - Trust API controller authorization checks
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const userStore = require('../models/userStore');
const reputationStore = require('../models/reputationStore');
const trustService = require('../services/trustService');
const {
  getMyTrustProfile,
  getUserTrustProfile,
  getUserTrustHistory,
  adjustUserTrustScore,
  getPlatformTrustStats,
  getTrustLeaderboard,
} = require('../controllers/trustController');

const mockRes = () => {
  const r = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      r.statusCode = code;
      return r;
    },
    json(data) {
      r.jsonData = data;
      return r;
    },
  };
  return r;
};

let passed = 0;
let total = 0;
const test = async (name, fn) => {
  total++;
  try {
    const ok = await fn();
    if (ok) {
      passed++;
      console.log(`  ✅ PASS: ${name}`);
    } else {
      console.log(`  ❌ FAIL: ${name}`);
    }
  } catch (err) {
    console.log(`  ❌ FAIL: ${name} (Exception: ${err.message})`);
  }
};

async function runSuite() {
  console.log('\n================================================================');
  console.log('  🛡️  LUMEN CMS — USER TRUST & REPUTATION VERIFICATION SUITE');
  console.log('================================================================\n');

  // Setup seed users
  const adminUser = (await userStore.findOne({ email: 'admin@lumen.com' })) || (await userStore.findOne({ email: 'admin@lumen.io' }));
  const authorUser = (await userStore.findOne({ email: 'author@lumen.com' })) || (await userStore.findOne({ email: 'author@lumen.io' }));
  const readerUser = (await userStore.findOne({ email: 'reader@lumen.com' })) || (await userStore.findOne({ email: 'reader@lumen.io' }));

  // Create a clean test subject user
  const testUser = await userStore.create({
    name: 'Trust Test Subject',
    email: `trust.test.${Date.now()}@lumen.com`,
    password: 'password123',
    role: 'author',
  });

  const testUserId = testUser._id || testUser.id;

  console.log('--- 1. Baseline Trust Score & Tier Calculations ---');

  await test('New user initializes with baseline score of 50 and tier "neutral"', async () => {
    return testUser.trustScore === 50 && testUser.trustLevel === 'neutral';
  });

  await test('calculateTrustLevel correctly assigns tiers based on score ranges', async () => {
    const t0 = trustService.calculateTrustLevel(0); // restricted
    const t25 = trustService.calculateTrustLevel(25); // restricted
    const t34 = trustService.calculateTrustLevel(34); // restricted
    const t35 = trustService.calculateTrustLevel(35); // neutral
    const t50 = trustService.calculateTrustLevel(50); // neutral
    const t59 = trustService.calculateTrustLevel(59); // neutral
    const t60 = trustService.calculateTrustLevel(60); // trusted
    const t79 = trustService.calculateTrustLevel(79); // trusted
    const t80 = trustService.calculateTrustLevel(80); // exemplary
    const t100 = trustService.calculateTrustLevel(100); // exemplary

    return (
      t0 === 'restricted' &&
      t25 === 'restricted' &&
      t34 === 'restricted' &&
      t35 === 'neutral' &&
      t50 === 'neutral' &&
      t59 === 'neutral' &&
      t60 === 'trusted' &&
      t79 === 'trusted' &&
      t80 === 'exemplary' &&
      t100 === 'exemplary'
    );
  });

  console.log('\n--- 2. Positive Contribution Rewards ---');

  await test('Article approval increases trust score by +10 and increments positive contributions', async () => {
    const articleId = `art_test_${Date.now()}`;
    const result = await trustService.handleArticleApproved(articleId, testUserId, adminUser?._id);

    return (
      result.user.trustScore === 60 &&
      result.user.trustLevel === 'trusted' &&
      result.user.positiveContributionsCount === 1 &&
      result.log.delta === 10 &&
      result.log.eventType === 'ARTICLE_APPROVED'
    );
  });

  await test('Helpful community reaction awards +2 trust score', async () => {
    const reactionId = `react_test_${Date.now()}`;
    const result = await trustService.handleHelpfulReaction(reactionId, testUserId);

    return (
      result.user.trustScore === 62 &&
      result.user.trustLevel === 'trusted' &&
      result.user.positiveContributionsCount === 2 &&
      result.log.delta === 2
    );
  });

  await test('Educational quiz completion awards +2 trust score', async () => {
    const quizId = `quiz_test_${Date.now()}`;
    const result = await trustService.handleQuizCompleted(quizId, testUserId);

    return (
      result.user.trustScore === 64 &&
      result.user.positiveContributionsCount === 3 &&
      result.log.delta === 2
    );
  });

  console.log('\n--- 3. Violation Penalties ---');

  await test('Comment moderated removal applies -5 penalty and increments violations count', async () => {
    const commentId = `comm_violation_${Date.now()}`;
    const result = await trustService.handleCommentModerated(commentId, testUserId, 'Offensive language violation', adminUser?._id);

    return (
      result.user.trustScore === 59 &&
      result.user.trustLevel === 'neutral' &&
      result.user.violationsCount === 1 &&
      result.log.delta === -5 &&
      result.log.eventType === 'COMMENT_MODERATED_DELETE'
    );
  });

  await test('Content policy violation rejection applies -10 penalty', async () => {
    const articleId = `art_violation_${Date.now()}`;
    const result = await trustService.handleArticleRejectedViolation(articleId, testUserId, 'Plagiarism detected', adminUser?._id);

    return (
      result.user.trustScore === 49 &&
      result.user.trustLevel === 'neutral' &&
      result.user.violationsCount === 2 &&
      result.log.delta === -10
    );
  });

  await test('Confirmed community report applies -15 penalty', async () => {
    const reportId = `report_violation_${Date.now()}`;
    const result = await trustService.handleReportConfirmed(reportId, testUserId, 'Severe spam harassment', adminUser?._id);

    return (
      result.user.trustScore === 34 &&
      result.user.trustLevel === 'restricted' &&
      result.user.violationsCount === 3 &&
      result.log.delta === -15
    );
  });

  console.log('\n--- 4. Clamping & Boundary Protections ---');

  await test('Trust score is strictly bounded at lower limit 0', async () => {
    const heavyPenalty = await trustService.recordReputationEvent({
      userId: testUserId,
      eventType: 'REPORT_CONFIRMED_PENALTY',
      delta: -100,
      reason: 'Excessive critical infractions',
    });

    return (
      heavyPenalty.user.trustScore === 0 &&
      heavyPenalty.user.trustLevel === 'restricted'
    );
  });

  await test('Trust score is strictly bounded at upper limit 100', async () => {
    const maxReward = await trustService.recordReputationEvent({
      userId: testUserId,
      eventType: 'ARTICLE_APPROVED',
      delta: 150,
      reason: 'Outstanding contribution bonus',
    });

    return (
      maxReward.user.trustScore === 100 &&
      maxReward.user.trustLevel === 'exemplary'
    );
  });

  console.log('\n--- 5. Idempotency & Deduplication Protection ---');

  await test('Duplicate events with identical sourceId and eventType are rejected idempotently', async () => {
    const fixedSource = `fixed_dedup_id_999`;

    // First invocation: should process
    const res1 = await trustService.recordReputationEvent({
      userId: testUserId,
      eventType: 'ARTICLE_APPROVED',
      delta: 10,
      reason: 'Publishing article',
      sourceId: fixedSource,
    });

    const scoreAfterFirst = res1.user.trustScore;

    // Second invocation: should detect duplicate and NOT add points again
    const res2 = await trustService.recordReputationEvent({
      userId: testUserId,
      eventType: 'ARTICLE_APPROVED',
      delta: 10,
      reason: 'Publishing article duplicate call',
      sourceId: fixedSource,
    });

    return (
      res1.duplicate === false &&
      res2.duplicate === true &&
      res2.user.trustScore === scoreAfterFirst
    );
  });

  console.log('\n--- 6. Reputation Audit Log History ---');

  await test('getUserReputationHistory returns chronological audit trail of all score changes', async () => {
    const history = await trustService.getUserReputationHistory(testUserId, 20);
    return (
      Array.isArray(history) &&
      history.length >= 5 &&
      history[0].previousScore !== undefined &&
      history[0].newScore !== undefined
    );
  });

  console.log('\n--- 7. Admin Adjustments & Mandatory Justification ---');

  await test('Admin adjustment succeeds with valid delta and non-empty reason', async () => {
    const res = await trustService.handleAdminAdjustment(
      testUserId,
      -10,
      'Manual adjustment for minor policy misunderstanding',
      adminUser?._id
    );

    return (
      res.user.trustScore === 90 &&
      res.log.eventType === 'ADMIN_MANUAL_ADJUSTMENT' &&
      res.log.reason === 'Manual adjustment for minor policy misunderstanding'
    );
  });

  await test('Admin adjustment rejects empty or whitespace reason', async () => {
    let failedAsExpected = false;
    try {
      await trustService.handleAdminAdjustment(testUserId, 5, '   ', adminUser?._id);
    } catch (err) {
      failedAsExpected = true;
    }
    return failedAsExpected;
  });

  console.log('\n--- 8. Analytics & Leaderboard ---');

  await test('getPlatformTrustStats calculates correct platform statistics and tier breakdown', async () => {
    const stats = await trustService.getPlatformTrustStats();
    return (
      typeof stats.totalUsers === 'number' &&
      stats.totalUsers > 0 &&
      typeof stats.averageScore === 'number' &&
      typeof stats.tiers.exemplary === 'number' &&
      typeof stats.tiers.trusted === 'number' &&
      typeof stats.tiers.neutral === 'number' &&
      typeof stats.tiers.restricted === 'number'
    );
  });

  await test('getTrustLeaderboard ranks users in descending order of trust score', async () => {
    const leaderboard = await trustService.getTrustLeaderboard(10);
    if (!Array.isArray(leaderboard) || leaderboard.length === 0) return false;

    // Verify descending order
    let isDescending = true;
    for (let i = 0; i < leaderboard.length - 1; i++) {
      if (leaderboard[i].trustScore < leaderboard[i + 1].trustScore) {
        isDescending = false;
        break;
      }
    }
    return isDescending;
  });

  console.log('\n--- 9. Trust Controller HTTP Endpoints ---');

  await test('getMyTrustProfile returns user score, level, and audit history', async () => {
    const req = { user: testUser };
    const res = mockRes();
    await getMyTrustProfile(req, res);

    return (
      res.statusCode === 200 &&
      res.jsonData.success === true &&
      res.jsonData.data.user.trustScore === 90 &&
      res.jsonData.data.user.trustLevel === 'exemplary' &&
      Array.isArray(res.jsonData.data.history)
    );
  });

  await test('getUserTrustProfile returns public trust badges and stats without private fields', async () => {
    const req = { params: { id: testUserId } };
    const res = mockRes();
    await getUserTrustProfile(req, res);

    return (
      res.statusCode === 200 &&
      res.jsonData.success === true &&
      res.jsonData.data.trustScore === 90 &&
      res.jsonData.data.password === undefined
    );
  });

  await test('adjustUserTrustScore validates delta and reason via HTTP controller', async () => {
    const reqInvalid = {
      params: { id: testUserId },
      body: { delta: 'not-a-number', reason: 'Test' },
      user: adminUser,
    };
    const resInvalid = mockRes();
    await adjustUserTrustScore(reqInvalid, resInvalid);

    const reqMissingReason = {
      params: { id: testUserId },
      body: { delta: 10, reason: '' },
      user: adminUser,
    };
    const resMissingReason = mockRes();
    await adjustUserTrustScore(reqMissingReason, resMissingReason);

    return (
      resInvalid.statusCode === 400 &&
      resMissingReason.statusCode === 400
    );
  });

  console.log('\n================================================================');
  console.log(`  RESULT: ${passed}/${total} Trust & Reputation tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed === total) {
    console.log('🎉 ALL TRUST & REPUTATION TESTS PASSED PERFECTLY!\n');
  } else {
    console.error('❌ SOME TESTS FAILED. CHECK LOGS ABOVE.\n');
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Unexpected test error:', err);
  process.exit(1);
});
