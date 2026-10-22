const mongoose = require('mongoose');
const Article = require('../models/Article');

const {
  analyzeContent: analyzeContentService,
} = require('../services/contentQualityService');
const {
  generateContentSuggestions,
} = require('../services/aiContentSuggestionsService');

const analyzeContent = async (req, res) => {
  try {
    const {
      title = '',
      description = '',
      content = '',
      category = '',
      tags = [],
      articleId = null,
    } = req.body;

    // Validate input
    if (!title.trim() && !content.trim()) {
      return res.status(400).json({
        success: false,
        message:
          'Title or content is required for quality analysis.',
      });
    }

    // Only compare with published articles
    const filter = {
      status: 'published',
    };

    // When editing an existing article,
    // don't compare it with itself.
    if (
      articleId &&
      mongoose.Types.ObjectId.isValid(articleId)
    ) {
      filter._id = {
        $ne: articleId,
      };
    }

    const existingArticles = await Article.find(filter)
      .select('_id title content category')
      .lean();

    const result = analyzeContentService({
      title,
      description,
      content,
      category,
      tags: Array.isArray(tags) ? tags : [],
      existingArticles,
    });

    return res.status(200).json({
      success: true,
      message: 'Content quality analysis completed.',
      analysis: result,
    });
  } catch (error) {
    console.error(
      '[Content Quality] Analysis error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to analyze article content.',
      error: error.message,
    });
  }
};

const generateSuggestions = async (req, res) => {
  const {
    title = '',
    description = '',
    content = '',
    category = '',
    tags = [],
  } = req.body;

  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Article content is required for AI suggestions.',
    });
  }

  try {
    const suggestions = await generateContentSuggestions({
      title,
      description,
      content,
      category,
      tags,
    });

    return res.status(200).json({
      success: true,
      message: 'AI content suggestions generated successfully.',
      suggestions,
    });
  } catch (error) {
    console.error('[Content Quality] Suggestion error:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to generate AI content suggestions.',
    });
  }
};

module.exports = {
  analyzeContent,
  generateSuggestions,
};