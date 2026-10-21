const mongoose = require('mongoose');
const Article = require('../models/Article');
const Quiz = require('../models/Quiz');
const { scanContent } = require('../services/aiModerationService');

// ─── Helper: small delay to prevent Gemini rate-limiting ─────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Helper: ensure DB is connected before a save ────────────────────────────
const ensureConnected = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('[Moderation] MongoDB not connected. Waiting 3s...');
    await sleep(3000);
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection lost. Please retry the scan.');
    }
  }
};

// ─── Scan a single article with Gemini and save ───────────────────────────────
const scanAndSaveArticle = async (article, applyStatusChange = false) => {
  const fullText = `${article.title}\n\n${article.description || ''}\n\n${article.content || ''}`;
  const aiResult = await scanContent('article', article.title, fullText);

  // IMPORTANT: Must use set() or markModified() — direct object assignment
  // doesn't trigger Mongoose's change detection for nested sub-documents.
  article.set('aiModeration', aiResult);
  article.markModified('aiModeration');

  if (applyStatusChange && article.status === 'pending') {
    if (aiResult.level === 'low') {
      article.status = 'published';
      article.publishedAt = new Date();
    } else if (aiResult.level === 'high') {
      article.status = 'rejected';
    }
    // moderate stays pending for admin review
  }

  await ensureConnected();
  await article.save();
  return aiResult;
};

// ─── Scan a single quiz with Gemini and save ─────────────────────────────────
const scanAndSaveQuiz = async (quiz, applyStatusChange = false) => {
  let questionsText = '';
  if (Array.isArray(quiz.questions)) {
    questionsText = quiz.questions
      .map((q, idx) => `Q${idx + 1}: ${q.question} (${(q.options || []).join(', ')})`)
      .join('\n');
  }
  const fullText = `${quiz.title}\n\n${quiz.description || ''}\n\n${questionsText}`;
  const aiResult = await scanContent('quiz', quiz.title, fullText);

  // IMPORTANT: Must use set() + markModified() so Mongoose detects the nested change
  quiz.set('aiModeration', aiResult);
  quiz.markModified('aiModeration');

  if (applyStatusChange && quiz.status === 'submitted') {
    if (aiResult.level === 'low') {
      quiz.status = 'approved';
    } else if (aiResult.level === 'high') {
      quiz.status = 'rejected';
    }
  }

  await ensureConnected();
  await quiz.save();
  return aiResult;
};

// ─── Get overall AI moderation stats ─────────────────────────────────────────
const getModerationStats = async (req, res) => {
  try {
    const [articles, quizzes] = await Promise.all([
      Article.find({ 'aiModeration.level': { $ne: null } }).select('aiModeration status'),
      Quiz.find({ 'aiModeration.level': { $ne: null } }).select('aiModeration status'),
    ]);

    const all = [
      ...articles.map((a) => ({ level: a.aiModeration?.level, score: a.aiModeration?.score })),
      ...quizzes.map((q) => ({ level: q.aiModeration?.level, score: q.aiModeration?.score })),
    ];

    const stats = {
      totalScanned: all.length,
      lowRisk: all.filter((i) => i.level === 'low').length,
      moderateRisk: all.filter((i) => i.level === 'moderate').length,
      highRisk: all.filter((i) => i.level === 'high').length,
      averageScore: all.length
        ? Math.round(all.reduce((acc, curr) => acc + (curr.score || 0), 0) / all.length)
        : 0,
    };

    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error('Get Moderation Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve moderation statistics.' });
  }
};

// ─── Get all content with AI moderation scores ────────────────────────────────
const getModeratedContent = async (req, res) => {
  try {
    const { level, type } = req.query;

    const [articles, quizzes] = await Promise.all([
      Article.find().populate('author', 'name email avatar').sort({ createdAt: -1 }),
      Quiz.find()
        .populate('createdBy', 'name email')
        .populate('articleId', 'title')
        .sort({ createdAt: -1 }),
    ]);

    let items = [
      ...articles.map((a) => ({
        _id: a._id,
        id: a._id,
        type: 'article',
        title: a.title,
        author: a.author?.name || 'Unknown Author',
        authorEmail: a.author?.email || '',
        status: a.status,
        createdAt: a.createdAt,
        aiModeration: a.aiModeration || {
          score: null,
          level: 'unscanned',
          flags: [],
          reason: 'Not yet scanned by AI',
          checkedAt: null,
        },
      })),
      ...quizzes.map((q) => ({
        _id: q._id,
        id: q._id,
        type: 'quiz',
        title: q.title,
        author: q.createdBy?.name || 'Unknown Author',
        authorEmail: q.createdBy?.email || '',
        status: q.status,
        createdAt: q.createdAt,
        aiModeration: q.aiModeration || {
          score: null,
          level: 'unscanned',
          flags: [],
          reason: 'Not yet scanned by AI',
          checkedAt: null,
        },
      })),
    ];

    if (level && level !== 'all') {
      items = items.filter((item) => item.aiModeration?.level === level);
    }
    if (type && type !== 'all') {
      items = items.filter((item) => item.type === type);
    }

    res.status(200).json({ success: true, count: items.length, items });
  } catch (error) {
    console.error('Get Moderated Content Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve moderated content list.' });
  }
};

// ─── Rescan a specific article or quiz ───────────────────────────────────────
const rescanContent = async (req, res) => {
  try {
    const { type, id } = req.params;

    if (type === 'article') {
      const article = await Article.findById(id).populate('author', 'name email');
      if (!article) return res.status(404).json({ success: false, message: 'Article not found.' });

      const aiResult = await scanAndSaveArticle(article, true);

      return res.status(200).json({
        success: true,
        message: `Article rescanned. Risk Level: ${aiResult.level.toUpperCase()} (${aiResult.score}/100)`,
        aiModeration: aiResult,
        status: article.status,
      });
    }

    if (type === 'quiz') {
      const quiz = await Quiz.findById(id);
      if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });

      const aiResult = await scanAndSaveQuiz(quiz, true);

      return res.status(200).json({
        success: true,
        message: `Quiz rescanned. Risk Level: ${aiResult.level.toUpperCase()} (${aiResult.score}/100)`,
        aiModeration: aiResult,
        status: quiz.status,
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid content type. Use "article" or "quiz".' });
  } catch (error) {
    console.error('Rescan Content Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to rescan content.' });
  }
};

// ─── Scan only items that have never been scanned ────────────────────────────
const scanAllUnscanned = async (req, res) => {
  try {
    const [articles, quizzes] = await Promise.all([
      Article.find({
        $or: [
          { 'aiModeration.checkedAt': { $exists: false } },
          { 'aiModeration.checkedAt': null },
          { 'aiModeration.level': { $exists: false } },
          { 'aiModeration.level': null },
        ],
      }),
      Quiz.find({
        $or: [
          { 'aiModeration.checkedAt': { $exists: false } },
          { 'aiModeration.checkedAt': null },
          { 'aiModeration.level': { $exists: false } },
          { 'aiModeration.level': null },
        ],
      }),
    ]);

    console.log(`[Scan New] ${articles.length} unscanned articles + ${quizzes.length} unscanned quizzes.`);

    let scannedCount = 0;
    const results = [];

    for (const article of articles) {
      try {
        const aiResult = await scanAndSaveArticle(article, true);
        scannedCount++;
        results.push({ type: 'article', title: article.title, level: aiResult.level, score: aiResult.score });
        console.log(`[Scan New] ✅ Article "${article.title}" => ${aiResult.level} (${aiResult.score})`);
        await sleep(300); // small pause to avoid Gemini rate-limit
      } catch (err) {
        console.error(`[Scan New] ⚠️ Failed article "${article.title}":`, err.message);
        results.push({ type: 'article', title: article.title, error: err.message });
      }
    }

    for (const quiz of quizzes) {
      try {
        const aiResult = await scanAndSaveQuiz(quiz, true);
        scannedCount++;
        results.push({ type: 'quiz', title: quiz.title, level: aiResult.level, score: aiResult.score });
        console.log(`[Scan New] ✅ Quiz "${quiz.title}" => ${aiResult.level} (${aiResult.score})`);
        await sleep(300);
      } catch (err) {
        console.error(`[Scan New] ⚠️ Failed quiz "${quiz.title}":`, err.message);
        results.push({ type: 'quiz', title: quiz.title, error: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully scanned ${scannedCount} new items with Gemini AI.`,
      scannedCount,
      results,
    });
  } catch (error) {
    console.error('Scan All Unscanned Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to scan new items.' });
  }
};

// ─── Force rescan ALL content with Gemini (fixes stale 0-score records) ──────
const rescanAllContent = async (req, res) => {
  try {
    const [articles, quizzes] = await Promise.all([
      Article.find().select('_id title description content status publishedAt aiModeration'),
      Quiz.find().select('_id title description questions status aiModeration'),
    ]);

    console.log(`[Rescan All] Starting Gemini rescan for ${articles.length} articles + ${quizzes.length} quizzes...`);

    let scannedCount = 0;
    let failedCount = 0;
    const results = [];

    // Process in batches of 5 with a pause between batches to keep connection alive
    const BATCH_SIZE = 5;
    const BATCH_PAUSE_MS = 1500;
    const ITEM_PAUSE_MS = 400;

    // ── Articles ──
    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE);
      for (const article of batch) {
        try {
          await ensureConnected();
          const aiResult = await scanAndSaveArticle(article, false); // don't force status on bulk rescan
          scannedCount++;
          results.push({ type: 'article', id: article._id, title: article.title, level: aiResult.level, score: aiResult.score });
          console.log(`[Rescan All] ✅ Article [${scannedCount}] "${article.title}" => ${aiResult.level} (${aiResult.score})`);
          await sleep(ITEM_PAUSE_MS);
        } catch (err) {
          failedCount++;
          console.error(`[Rescan All] ⚠️ Article "${article.title}": ${err.message}`);
          results.push({ type: 'article', id: article._id, title: article.title, error: err.message });
        }
      }
      if (i + BATCH_SIZE < articles.length) {
        console.log(`[Rescan All] 💤 Batch pause...`);
        await sleep(BATCH_PAUSE_MS);
      }
    }

    // ── Quizzes ──
    for (let i = 0; i < quizzes.length; i += BATCH_SIZE) {
      const batch = quizzes.slice(i, i + BATCH_SIZE);
      for (const quiz of batch) {
        try {
          await ensureConnected();
          const aiResult = await scanAndSaveQuiz(quiz, false);
          scannedCount++;
          results.push({ type: 'quiz', id: quiz._id, title: quiz.title, level: aiResult.level, score: aiResult.score });
          console.log(`[Rescan All] ✅ Quiz [${scannedCount}] "${quiz.title}" => ${aiResult.level} (${aiResult.score})`);
          await sleep(ITEM_PAUSE_MS);
        } catch (err) {
          failedCount++;
          console.error(`[Rescan All] ⚠️ Quiz "${quiz.title}": ${err.message}`);
          results.push({ type: 'quiz', id: quiz._id, title: quiz.title, error: err.message });
        }
      }
      if (i + BATCH_SIZE < quizzes.length) {
        await sleep(BATCH_PAUSE_MS);
      }
    }

    console.log(`[Rescan All] Done. ✅ ${scannedCount} scanned, ⚠️ ${failedCount} failed.`);

    res.status(200).json({
      success: true,
      message: `Rescanned ${scannedCount} items with Gemini AI${failedCount > 0 ? ` (${failedCount} failed — retry individually)` : ''}. `,
      scannedCount,
      failedCount,
      results,
    });
  } catch (error) {
    console.error('Rescan All Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to rescan all content.' });
  }
};

module.exports = {
  getModerationStats,
  getModeratedContent,
  rescanContent,
  scanAllUnscanned,
  rescanAllContent,
};
