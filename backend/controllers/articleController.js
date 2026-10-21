const mongoose = require('mongoose');
const Article = require('../models/Article');
const User = require('../models/User');
const { notifyAuthorSubscribers, notifyAdminUsers, createNotification } = require('./notificationController');
const { enrichTopicTrends } = require('../services/geminiTopicService');

const connectTopicTrendDB = require('../config/topicTrendDB');
const topicTrendSchema = require('../models/TopicTrend');

const getUserId = (req) => {
  return req.user.id || req.user._id;
};

const isArticleOwner = (article, userId) => {
  return article.author.toString() === userId.toString();
};

// Create a new article
const createArticle = async (req, res) => {
  try {
    const { title, description, content, category, tags, status } = req.body;
    const initialStatus = status === 'pending' ? 'pending' : 'draft';

    const article = await Article.create({
      title,
      description,
      content,
      category,
      tags: Array.isArray(tags) ? tags : [],
      author: req.user._id,
      status: initialStatus,
      submittedAt: initialStatus === 'pending' ? new Date() : null,
    });

    const populatedArticle = await Article.findById(article._id)
      .populate('author', 'name email role avatar');

    if (initialStatus === 'pending') {
      await notifyAdminUsers({
        sender: req.user._id,
        title: 'New Article Pending Review',
        message: `Author ${req.user?.name || 'an author'} submitted "${article.title}" for editorial verification.`,
        type: 'article_status',
        link: '/admin',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Article created successfully.',
      article: populatedArticle,
    });
  } catch (error) {
    console.error('Create article error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create article.',
    });
  }
};

const isMongoConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

// Get all articles
const getArticles = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const isAdmin = req.user && req.user.role === 'admin';

    if (isMongoConnected()) {
      const filter = {};

      if (status) {
        if (!isAdmin && status !== 'published') {
          filter.status = 'published';
        } else {
          filter.status = status;
        }
      } else {
        if (!isAdmin) {
          filter.status = 'published';
        }
      }

      if (category) {
        filter.category = category;
      }

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ];
      }

      const articles = await Article.find(filter)
        .populate('author', 'name email role avatar')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: articles.length,
        articles,
      });
    }

    // In-memory fallback
    const articleStore = require('../models/articleStore');
    let articles = [...(articleStore.inMemoryArticles || [])];

    if (status) {
      if (!isAdmin && status !== 'published') {
        articles = articles.filter((a) => a.status === 'published');
      } else {
        articles = articles.filter((a) => a.status === status);
      }
    } else if (!isAdmin) {
      articles = articles.filter((a) => a.status === 'published');
    }

    if (category) {
      articles = articles.filter((a) => a.category === category);
    }

    if (search) {
      const term = search.toLowerCase();
      articles = articles.filter(
        (a) =>
          (a.title && a.title.toLowerCase().includes(term)) ||
          (a.description && a.description.toLowerCase().includes(term)) ||
          (Array.isArray(a.tags) && a.tags.some((tag) => String(tag).toLowerCase().includes(term)))
      );
    }

    return res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error('Get articles error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles.',
    });
  }
};

// Get single article
const getArticleById = async (req, res) => {
  try {
    let article = null;

    if (isMongoConnected()) {
      article = await Article.findById(req.params.id)
        .populate('author', 'name email role avatar bio')
        .populate('adminNote.reviewedBy', 'name email');
    } else {
      const articleStore = require('../models/articleStore');
      article = (articleStore.inMemoryArticles || []).find(
        (a) => a._id === req.params.id || a.id === req.params.id
      );
    }

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
      });
    }

    if (article.status !== 'published') {
      const currentUserId = req.user ? (req.user._id || req.user.id)?.toString() : null;
      const articleAuthorId = article.author ? (article.author._id || article.author.id || article.author)?.toString() : null;
      const isAuthor = currentUserId && articleAuthorId && currentUserId === articleAuthorId;
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'This article is pending editorial review and is not yet published.',
        });
      }
    }

    res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    console.error('Get article error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch article.',
    });
  }
};

// Update article
const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
      });
    }

    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own articles.',
      });
    }

    const editableStatuses = [
      'draft',
      'rejected',
      'changes_requested',
    ];

    if (!editableStatuses.includes(article.status)) {
      return res.status(400).json({
        success: false,
        message: `Article cannot be edited while its status is '${article.status}'.`,
      });
    }

    const { title, description, content, category, tags } = req.body;

    if (title !== undefined) article.title = title;
    if (description !== undefined) article.description = description;
    if (content !== undefined) article.content = content;
    if (category !== undefined) article.category = category;

    if (tags !== undefined) {
      article.tags = Array.isArray(tags) ? tags : [];
    }

    if (
      article.status === 'rejected' ||
      article.status === 'changes_requested'
    ) {
      article.adminNote = {
        message: '',
        reviewedBy: null,
        reviewedAt: null,
      };
    }

    await article.save();

    const updatedArticle = await Article.findById(article._id)
      .populate('author', 'name email role avatar');

    if (article.status === 'published' && article.author) {
      await notifyAuthorSubscribers({
        authorId: article.author,
        title: `Content Updated: "${article.title}"`,
        message: `${updatedArticle.author?.name || 'Author'} updated the content in "${article.title}". Read the latest release!`,
        type: 'subscription',
        link: `/browse/${article._id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Article updated successfully.',
      article: updatedArticle,
    });
  } catch (error) {
    console.error('Update article error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update article.',
    });
  }
};

// Submit article for review
const submitArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
      });
    }

    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit your own articles.',
      });
    }

    const allowedStatuses = [
      'draft',
      'rejected',
      'changes_requested',
    ];

    if (!allowedStatuses.includes(article.status)) {
      return res.status(400).json({
        success: false,
        message: `Article cannot be submitted from '${article.status}' status.`,
      });
    }

    article.status = 'pending';
    article.submittedAt = new Date();

    await article.save();

    await notifyAdminUsers({
      sender: req.user._id,
      title: 'New Article Pending Review',
      message: `Author ${req.user?.name || 'an author'} submitted "${article.title}" for editorial verification.`,
      type: 'article_status',
      link: '/admin',
    });

    res.status(200).json({
      success: true,
      message: 'Article submitted for review.',
      article,
    });
  } catch (error) {
    console.error('Submit article error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to submit article.',
    });
  }
};

// Admin approves article
const approveArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
      });
    }

    if (article.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending articles can be approved.',
      });
    }

    article.status = 'approved';

    await article.save();

    const updatedArticle = await Article.findById(article._id)
      .populate('author', 'name email role avatar');

    res.status(200).json({
      success: true,
      message: 'Article approved successfully.',
      article: updatedArticle,
    });
  } catch (error) {
    console.error('Approve article error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to approve article.',
    });
  }
};

// Admin rejects article
const rejectArticle = async (req, res) => {
  try {
    const { adminNote } = req.body;

    if (!adminNote || !adminNote.trim()) {
      return res.status(400).json({
        success: false,
        message: 'An admin note is required when rejecting an article.',
      });
    }

    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
      });
    }

    if (article.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending articles can be rejected.',
      });
    }

    article.status = 'rejected';

    article.adminNote = {
      message: adminNote.trim(),
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };

    await article.save();

    const updatedArticle = await Article.findById(article._id)
      .populate('author', 'name email role avatar')
      .populate('adminNote.reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Article rejected successfully.',
      article: updatedArticle,
    });
  } catch (error) {
    console.error('Reject article error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to reject article.',
    });
  }
};

// Admin requests changes
const requestChanges = async (req, res) => {
  try {
    const { adminNote } = req.body;

    if (!adminNote || !adminNote.trim()) {
      return res.status(400).json({
        success: false,
        message: 'An admin note is required when requesting changes.',
      });
    }

    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
      });
    }

    if (article.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending articles can have changes requested.',
      });
    }

    article.status = 'changes_requested';

    article.adminNote = {
      message: adminNote.trim(),
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };

    await article.save();

    const updatedArticle = await Article.findById(article._id)
      .populate('author', 'name email role avatar')
      .populate('adminNote.reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Changes requested successfully.',
      article: updatedArticle,
    });
  } catch (error) {
    console.error('Request changes error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to request changes.',
    });
  }
};

// Publish approved article
const publishArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
      });
    }

    if (article.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved articles can be published.',
      });
    }

    article.status = 'published';
    article.publishedAt = new Date();

    await article.save();

    const updatedArticle = await Article.findById(article._id)
      .populate('author', 'name email role avatar');

    res.status(200).json({
      success: true,
      message: 'Article published successfully.',
      article: updatedArticle,
    });
  } catch (error) {
    console.error('Publish article error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to publish article.',
    });
  }
};

// Get articles belonging to logged-in author
const getMyArticles = async (req, res) => {
  try {
    const articles = await Article.find({
      author: req.user._id,
    })
      .populate('author', 'name email role avatar')
      .populate('adminNote.reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error('Get my articles error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch your articles.',
    });
  }
};

const getMyArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid article ID.',
      });
    }

    /*
     * First find the article WITHOUT populating the author.
     * This keeps article.author as the ObjectId so that
     * ownership checking works correctly.
     */
    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
      });
    }

    /*
     * Check ownership before populating the author.
     */
    if (!isArticleOwner(article, userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this article.',
      });
    }

    /*
     * Now populate the author after ownership has been verified.
     */
    await article.populate('author', 'name avatar bio');

    return res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    console.error('[Get My Article Error]:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve article.',
    });
  }
};

// Get published articles by a specific author
const getPublishedArticlesByAuthor = async (req, res) => {
  try {
    const articles = await Article.find({
      author: req.params.id,
      status: 'published',
    })
      .populate('author', 'name role avatar bio')
      .sort({ publishedAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error('Get published author articles error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch published articles.',
    });
  }
};

// Like an article
const likeArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
      });
    }

    if (typeof article.likes === 'number') {
      article.likes = (article.likes || 0) + 1;
    } else if (Array.isArray(article.likes)) {
      article.likes.push(req.user._id);
    } else {
      article.likes = 1;
    }

    await article.save();

    const likeCount = typeof article.likes === 'number' ? article.likes : article.likes.length;

    res.status(200).json({
      success: true,
      message: 'Article liked successfully.',
      likes: likeCount,
    });
  } catch (error) {
    console.error('Like article error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to like article.',
    });
  }
};


// Increment article views
const incrementViews = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
      });
    }

    res.status(200).json({
      success: true,
      views: article.views,
    });
  } catch (error) {
    console.error('Increment views error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to increment views.',
    });
  }
};

// Delete article
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
      });
    }

    if (
      article.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own articles.',
      });
    }

    await Article.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully.',
    });
  } catch (error) {
    console.error('Delete article error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete article.',
    });
  }
};

const reviewArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewFeedback } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid article ID.',
      });
    }

    const allowedStatuses = [
      'published',
      'changes_requested',
      'rejected',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid review status. Allowed values: published, changes_requested, rejected.',
      });
    }

    if (
      ['changes_requested', 'rejected'].includes(status) &&
      (!reviewFeedback || !reviewFeedback.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Review feedback is required for this status.',
      });
    }

    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
      });
    }

    article.status = status;
    article.reviewFeedback = reviewFeedback
      ? reviewFeedback.trim()
      : '';

    await article.save();

    const reviewedArticle = await Article.findById(article._id).populate(
      'author',
      'name avatar bio'
    );

    if (status === 'published' && article.author) {
      const authorUser = await User.findById(article.author);
      const authorName = authorUser ? authorUser.name : 'Subscribed Author';

      await createNotification({
        user: article.author,
        sender: req.user._id,
        title: 'Article Approved & Published',
        message: `Your article "${article.title}" has been approved by admin and is live on Lumen!`,
        type: 'article_status',
        link: `/browse/${article._id}`,
      });

      await notifyAuthorSubscribers({
        authorId: article.author,
        title: `New Article by ${authorName}`,
        message: `${authorName} published a new article: "${article.title}". Read it now on Lumen!`,
        type: 'subscription',
        link: `/browse/${article._id}`,
      });
    } else if (['changes_requested', 'rejected'].includes(status) && article.author) {
      await createNotification({
        user: article.author,
        sender: req.user._id,
        title: status === 'rejected' ? 'Article Rejected' : 'Changes Requested',
        message: `Your article "${article.title}" status updated to ${status}. Feedback: "${reviewFeedback ? reviewFeedback.trim() : ''}"`,
        type: status === 'rejected' ? 'rejection' : 'change_request',
        link: `/write/${article._id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Article status changed to '${status}'.`,
      article: reviewedArticle,
    });
  } catch (error) {
    console.error('[Review Article Error]:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to review article.',
    });
  }
};

// ==========================================
// GET ALL ARTICLES - ADMIN
// ==========================================

const getAllArticlesForAdmin = async (req, res) => {
  try {
    const articles = await Article.find({status: { $ne: 'draft' },})
      .populate('author', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error('Get Admin Articles Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch articles',
      error: error.message,
    });
  }
};

// Get recommended articles related by category or tags
const getRecommendedArticles = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const currentArticle = await Article.findById(id);
      if (!currentArticle) {
        return res.status(404).json({ success: false, message: 'Article not found.' });
      }

      const recommendations = await Article.find({
        _id: { $ne: id },
        status: 'published',
        $or: [
          { category: currentArticle.category },
          { tags: { $in: currentArticle.tags || [] } }
        ],
      })
        .populate('author', 'name email role avatar')
        .limit(4);

      if (recommendations.length < 4) {
        const existingIds = recommendations.map(r => r._id).concat(id);
        const fill = await Article.find({
          _id: { $nin: existingIds },
          status: 'published',
        })
          .populate('author', 'name email role avatar')
          .limit(4 - recommendations.length);

        recommendations.push(...fill);
      }

      return res.status(200).json({
        success: true,
        count: recommendations.length,
        recommendations,
      });
    }

    const articleStore = require('../models/articleStore');
    const all = (articleStore.inMemoryArticles || []).filter(a => a.status === 'published');
    const current = (articleStore.inMemoryArticles || []).find(a => a._id === id || a.id === id);
    let list = all.filter(a => (a._id !== id && a.id !== id));
    if (current?.category) {
      const matchCat = list.filter(a => a.category === current.category);
      if (matchCat.length > 0) list = matchCat;
    }

    res.status(200).json({
      success: true,
      count: list.slice(0, 4).length,
      recommendations: list.slice(0, 4),
    });
  } catch (error) {
    console.error('Get recommended articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations.',
    });
  }
};


// Analyze published article metadata to identify topics gaining attention.

const getTopicTrends = async (req, res) => {
  try {
    let articles = [];

    if (isMongoConnected()) {
      articles = await Article.find({ status: 'published' })
        .select(
          'title description content category tags views likes publishedAt createdAt updatedAt status'
        )
        .sort({ publishedAt: -1, createdAt: -1 })
        .lean();
    } else {
      const articleStore = require('../models/articleStore');
      articles = (articleStore.inMemoryArticles || []).filter(
        (article) => article.status === 'published'
      );
    }

    const generatedAt = new Date();
    const analysis = await enrichTopicTrends(articles, generatedAt);
    const topics = analysis.topics;

    const trendBasis =
      'Rule-based topic frequency compares published article counts in consecutive 7-day windows. Rising means more articles in the latest window; Cooling means fewer articles in the latest window than in the prior window; Steady means counts differ by no more than 10%; other cases or missing window data are Insufficient data. Popular is an independent badge for topics in at least 3 articles and at least 20% of the published corpus. Engagement values are current article totals; historical engagement snapshots are not stored.';

    // Save the analysis snapshot to the separate Topic Trends database.
    // Do not save in-memory fallback results as persistent CMS analysis.
    let historySaved = false;

    let snapshotWarning = null;
    if (isMongoConnected() && process.env.TOPIC_MONGODB_URI) {
      try {
        const topicTrendConnection = await connectTopicTrendDB();
        const TopicTrend = topicTrendConnection.models.TopicTrend || topicTrendConnection.model('TopicTrend', topicTrendSchema);
        await TopicTrend.create({ generatedAt, analysisWindowDays: 7, trendBasis, count: topics.length, topics, sourceArticleCount: articles.length });
        historySaved = true;
      } catch (snapshotError) {
        snapshotWarning = 'Trend analysis is available, but its snapshot could not be saved to the separate Topic Trends database.';
        console.error('Save topic trend snapshot error:', {
          name: snapshotError.name,
          code: snapshotError.code || 'UNKNOWN',
        });
      }
    } else if (isMongoConnected()) {
      snapshotWarning = 'Trend analysis is available, but snapshot history is disabled because TOPIC_MONGODB_URI is not configured.';
    }

    return res.status(200).json({
      success: true,
      generatedAt: generatedAt.toISOString(),
      analysisWindowDays: 7,
      trendBasis,
      count: topics.length,
      sourceArticleCount: articles.length,
      methodology: analysis.aiEnhanced
        ? 'Gemini semantic topic grouping and summaries; frequency, engagement, and classifications remain rule-based.'
        : 'Rule-based topic extraction and metrics; Gemini summaries are added when configured and available.',
      popularRule: 'At least 3 related published articles and at least 20% of the published corpus.',
      topics,
      historySaved,
      ...(snapshotWarning ? { snapshotWarning } : {}),
    });
  } catch (error) {
    console.error('Get topic trends error:', {
      name: error.name,
      code: error.code || 'UNKNOWN',
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to analyze topic trends.',
    });
  }
};


module.exports = {
  getTopicTrends,
  createArticle,
  getArticles,
  getArticleById,
  getRecommendedArticles,
  updateArticle,
  submitArticle,
  approveArticle,
  rejectArticle,
  requestChanges,
  publishArticle,
  getMyArticles,
  getMyArticleById,
  getPublishedArticlesByAuthor,
  likeArticle,
  incrementViews,
  deleteArticle,
  reviewArticle,
  getAllArticlesForAdmin,
};
