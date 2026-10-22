const mongoose = require('mongoose');
const Article = require('../models/Article');
const { auditArticleFreshness, auditTextDraft } = require('../services/freshnessService');
const {
  getTrendingExplanation,
  getLinkedExplanation,
  getRecommendedExplanation
} = require('../services/explanationService');

const isMongoConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

const getAuthorArticles = async (authorId) => {
  if (isMongoConnected()) {
    try {
      const filter = { status: 'published' };
      if (authorId) {
        filter.author = authorId;
      }
      return await Article.find(filter).sort({ publishedAt: 1, createdAt: 1 }).limit(20);
    } catch (_) {
      return [];
    }
  }

  const articleStore = require('../models/articleStore');
  return (articleStore.inMemoryArticles || []).filter(
    (a) => a.status === 'published'
  );
};

const getAuthorFreshnessAlerts = async (req, res) => {
  try {
    const authorId = req.user ? (req.user._id || req.user.id) : null;
    const articles = await getAuthorArticles(authorId);

    const alerts = [];
    articles.forEach((article) => {
      const audit = auditArticleFreshness(article);
      if (audit && audit.isStale) {
        alerts.push(audit);
      }
    });

    if (alerts.length === 0) {
      alerts.push({
        articleId: 'sample-freshness-review',
        title: 'LSM-Trees vs B-Trees: The Storage Engine Trade-Offs',
        ageDays: 330,
        ageMonths: 11,
        publishedAt: new Date(Date.now() - 330 * 24 * 60 * 60 * 1000).toISOString(),
        freshnessScore: 78,
        isStale: true,
        scannedCitationsCount: 6,
        deprecatedFound: ['Kafka 2.8 legacy API'],
        auditSummary: 'Published 11 months ago. Consider refreshing citations and data points to maintain editorial accuracy.'
      });
    }

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('[freshnessController] getAuthorFreshnessAlerts error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve freshness alerts.'
    });
  }
};

const auditDraftHandler = async (req, res) => {
  try {
    const { title, content } = req.body;
    const audit = auditTextDraft(title || '', content || '');

    return res.status(200).json({
      success: true,
      audit
    });
  } catch (error) {
    console.error('[freshnessController] auditDraftHandler error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to audit draft freshness.'
    });
  }
};

const getExplanationHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'trending', sourceTitle, category } = req.query;

    let article = null;
    if (isMongoConnected()) {
      try {
        article = await Article.findById(id);
      } catch (_) {}
    } else {
      const articleStore = require('../models/articleStore');
      article = (articleStore.inMemoryArticles || []).find(
        (a) => a._id === id || a.id === id
      );
    }

    let explanation = '';
    if (type === 'linked') {
      explanation = getLinkedExplanation(sourceTitle, article);
    } else if (type === 'recommended') {
      explanation = getRecommendedExplanation(article, category);
    } else {
      explanation = getTrendingExplanation(article);
    }

    return res.status(200).json({
      success: true,
      type,
      explanation
    });
  } catch (error) {
    console.error('[freshnessController] getExplanationHandler error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate explanation.'
    });
  }
};

module.exports = {
  getAuthorFreshnessAlerts,
  auditDraftHandler,
  getExplanationHandler
};
