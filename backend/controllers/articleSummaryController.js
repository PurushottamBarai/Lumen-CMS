const mongoose = require('mongoose');
const Article = require('../models/Article');
const { summarizeArticle, chatWithArticle } = require('../services/articleSummaryService');

const isMongoConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

const findArticleById = async (id) => {
  if (isMongoConnected()) {
    try {
      return await Article.findById(id);
    } catch (_) {
      return null;
    }
  }

  const articleStore = require('../models/articleStore');
  return (articleStore.inMemoryArticles || []).find(
    (a) => a._id === id || a.id === id
  );
};

const saveSummaryToArticle = async (article, summaryData) => {
  if (isMongoConnected()) {
    try {
      await Article.findByIdAndUpdate(
        article._id || article.id,
        { $set: { aiSummary: summaryData } },
        { new: true }
      );
    } catch (err) {
      console.warn('[articleSummaryController] Failed to persist summary in MongoDB:', err.message);
    }
  }

  article.aiSummary = summaryData;
};

const getArticleSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await findArticleById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    if (article.aiSummary) {
      return res.status(200).json({
        success: true,
        summary: article.aiSummary,
        isCached: true
      });
    }

    return res.status(200).json({
      success: true,
      summary: null,
      isCached: false,
      message: 'Summary not generated yet.'
    });
  } catch (error) {
    console.error('[articleSummaryController] getArticleSummary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve summary this time.'
    });
  }
};

const generateArticleSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await findArticleById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    const { force } = req.query;
    if (article.aiSummary && force !== 'true') {
      return res.status(200).json({
        success: true,
        summary: article.aiSummary,
        isCached: true
      });
    }

    const summary = await summarizeArticle({
      title: article.title,
      content: article.content,
      description: article.description
    });

    const summaryRecord = {
      ...summary,
      generatedAt: new Date().toISOString()
    };

    await saveSummaryToArticle(article, summaryRecord);

    return res.status(200).json({
      success: true,
      summary: summaryRecord,
      isCached: false
    });
  } catch (error) {
    console.error('[articleSummaryController] generateArticleSummary error:', error.message);
    return res.status(502).json({
      success: false,
      message: 'Unable to generate summary, please try again later.'
    });
  }
};

const articleChatHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A message query is required.'
      });
    }

    const article = await findArticleById(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    const result = await chatWithArticle({
      title: article.title,
      content: article.content,
      userMessage: message,
      conversationHistory: history
    });

    return res.status(200).json({
      success: true,
      reply: result.reply
    });
  } catch (error) {
    console.error('[articleSummaryController] articleChatHandler error:', error.message);
    return res.status(502).json({
      success: false,
      message: 'Unable to process chat request this time, please try again.'
    });
  }
};

module.exports = {
  getArticleSummary,
  generateArticleSummary,
  articleChatHandler
};
