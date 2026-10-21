const mongoose = require('mongoose');
const Article = require('../models/Article');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const articleStore = require('../models/articleStore');
const { createNotification, notifyAuthorSubscribers } = require('./notificationController');
const trustService = require('../services/trustService');
const { inMemoryQuizzes } = require('./quizController');

// =====================================================
// GET PENDING ARTICLES
// =====================================================
const getPendingArticles = async (req, res) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const articles = await Article.find({
        status: 'pending',
      })
        .populate('author', 'name email role')
        .sort({ createdAt: -1 });

      if (articles.length > 0) {
        const formatted = articles.map((art) => ({
          _id: art._id,
          title: art.title,
          author: art.author?.name || 'Unknown Author',
          authorId: art.author?._id || art.author,
          category: art.category || 'General',
          readingTime: art.readingTime ? `${art.readingTime} min` : '5 min',
          content: art.content,
          description: art.description,
          status: art.status,
          reviewFeedback: art.reviewFeedback || art.adminNote?.message || '',
          createdAt: art.createdAt,
          updatedAt: art.updatedAt,
        }));

        return res.status(200).json({
          success: true,
          count: formatted.length,
          data: formatted,
        });
      }
    }

    // Fallback pending items from articleStore
    const pendingList = articleStore.inMemoryArticles
      .filter((a) => a.status === 'pending' || a.status === 'changes_requested')
      .map((art) => ({
        _id: art._id,
        title: art.title,
        author: art.author?.name || 'Unknown Author',
        authorId: art.author?._id || art.author?.id,
        category: art.category || 'General',
        readingTime: `${art.readingTime || 5} min`,
        content: art.content,
        description: art.description,
        status: art.status,
        reviewFeedback: art.reviewFeedback || '',
        createdAt: art.createdAt,
        updatedAt: art.updatedAt,
      }));

    res.status(200).json({
      success: true,
      count: pendingList.length,
      data: pendingList,
    });
  } catch (error) {
    console.error('Get pending articles error:', error);
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
    });
  }
};

// =====================================================
// GET PENDING QUIZZES
// =====================================================
const getPendingQuizzes = async (req, res) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const quizzes = await Quiz.find({
        status: 'submitted',
      })
        .populate('createdBy', 'name email role')
        .populate('articleId', 'title')
        .sort({ createdAt: -1 });

      const formatted = quizzes.map((q) => ({
        _id: q._id,
        title: q.title,
        description: q.description,
        createdBy: q.createdBy?.name || 'Unknown Author',
        authorId: q.createdBy?._id || q.createdBy,
        category: 'Quiz',
        status: q.status,
        reviewFeedback: q.reviewFeedback || '',
        questions: q.questions || [],
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      }));

      return res.status(200).json({
        success: true,
        count: formatted.length,
        data: formatted,
      });
    }

    const memPending = (inMemoryQuizzes || [])
      .filter((q) => q.status === 'submitted')
      .map((q) => ({
        _id: q._id || q.id,
        title: q.title,
        description: q.description,
        createdBy: q.createdBy?.name || 'Unknown Author',
        authorId: q.createdBy?._id || q.createdBy,
        category: 'Quiz',
        status: q.status,
        reviewFeedback: q.reviewFeedback || '',
        questions: q.questions || [],
        createdAt: q.createdAt || new Date(),
        updatedAt: q.updatedAt || new Date(),
      }));

    res.status(200).json({
      success: true,
      count: memPending.length,
      data: memPending,
    });
  } catch (error) {
    console.error('Get pending quizzes error:', error);
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
    });
  }
};

// =====================================================
// APPROVE ARTICLE
// =====================================================
const approveArticle = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const article = await Article.findById(id);
      if (article) {
        article.status = 'published';
        article.publishedAt = new Date();
        article.reviewFeedback = '';
        await article.save();

        if (article.author) {
          const authorUser = await User.findById(article.author);
          const authorName = authorUser ? authorUser.name : 'Subscribed Author';

          const authorId = article.author._id || article.author.id || article.author;
          try {
            await trustService.handleArticleApproved(article._id, authorId, req.user?._id || req.user?.id);
          } catch (trustErr) {
            console.warn('[Trust] Failed to award reputation on article approval:', trustErr.message);
          }

          await createNotification({
            user: article.author,
            sender: req.user._id,
            title: 'Article Published',
            message: `Your article "${article.title}" has been approved and is live on Lumen! (+10 Trust Score)`,
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
        }

        return res.status(200).json({
          success: true,
          message: 'Article approved and published successfully.',
          data: article,
        });
      }
    }

    const idx = articleStore.inMemoryArticles.findIndex((a) => a._id === id || a.id === id);
    if (idx !== -1) {
      articleStore.inMemoryArticles[idx].status = 'published';
      articleStore.inMemoryArticles[idx].reviewFeedback = '';

      const memAuthor = articleStore.inMemoryArticles[idx].author;
      const memAuthorId = memAuthor?._id || memAuthor?.id || memAuthor;
      if (memAuthorId) {
        try {
          await trustService.handleArticleApproved(id, memAuthorId, req.user?._id || req.user?.id);
        } catch (trustErr) {
          console.warn('[Trust] Failed to award reputation in memory store:', trustErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Article approved and published successfully.',
        data: articleStore.inMemoryArticles[idx],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Article approved successfully.',
    });
  } catch (error) {
    console.error('Approve article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve article.',
    });
  }
};

// =====================================================
// REJECT ARTICLE
// =====================================================
const rejectArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required.',
      });
    }

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const article = await Article.findById(id);
      if (article) {
        article.status = 'rejected';
        article.reviewFeedback = reason.trim();
        await article.save();

        if (article.author) {
          const authorId = article.author._id || article.author.id || article.author;
          try {
            await trustService.handleArticleRejectedViolation(article._id, authorId, reason.trim(), req.user?._id || req.user?.id);
          } catch (trustErr) {
            console.warn('[Trust] Failed to record penalty on article rejection:', trustErr.message);
          }

          await createNotification({
            user: article.author,
            sender: req.user._id,
            title: 'Article Rejected',
            message: `Your article "${article.title}" was rejected: "${reason.trim()}" (-10 Trust Score)`,
            type: 'article_status',
            link: `/write/${article._id}`,
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Article rejected successfully.',
          data: article,
        });
      }
    }

    const idx = articleStore.inMemoryArticles.findIndex((a) => a._id === id || a.id === id);
    if (idx !== -1) {
      articleStore.inMemoryArticles[idx].status = 'rejected';
      articleStore.inMemoryArticles[idx].reviewFeedback = reason.trim();

      const memAuthor = articleStore.inMemoryArticles[idx].author;
      const memAuthorId = memAuthor?._id || memAuthor?.id || memAuthor;
      if (memAuthorId) {
        try {
          await trustService.handleArticleRejectedViolation(id, memAuthorId, reason.trim(), req.user?._id || req.user?.id);
        } catch (trustErr) {
          console.warn('[Trust] Failed to record penalty in memory store:', trustErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Article rejected successfully.',
        data: articleStore.inMemoryArticles[idx],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Article rejected successfully.',
    });
  } catch (error) {
    console.error('Reject article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject article.',
    });
  }
};

// =====================================================
// REQUEST ARTICLE CHANGES
// =====================================================
const requestArticleChanges = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Feedback comment is required.',
      });
    }

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const article = await Article.findById(id);
      if (article) {
        article.status = 'changes_requested';
        article.reviewFeedback = comment.trim();
        await article.save();

        if (article.author) {
          await createNotification({
            user: article.author,
            sender: req.user._id,
            title: 'Changes Requested',
            message: `Editor feedback for "${article.title}": "${comment.trim()}"`,
            type: 'article_status',
            link: `/write/${article._id}`,
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Changes requested successfully.',
          data: article,
        });
      }
    }

    const idx = articleStore.inMemoryArticles.findIndex((a) => a._id === id || a.id === id);
    if (idx !== -1) {
      articleStore.inMemoryArticles[idx].status = 'changes_requested';
      articleStore.inMemoryArticles[idx].reviewFeedback = comment.trim();
      return res.status(200).json({
        success: true,
        message: 'Changes requested successfully.',
        data: articleStore.inMemoryArticles[idx],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Changes requested successfully.',
    });
  } catch (error) {
    console.error('Request article changes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request article changes.',
    });
  }
};

// =====================================================
// APPROVE QUIZ
// =====================================================
const approveQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      quiz.status = 'approved';
      quiz.reviewFeedback = '';
      await quiz.save();

      if (quiz.createdBy) {
        await createNotification({
          user: quiz.createdBy,
          sender: req.user._id,
          title: 'Quiz Approved',
          message: `Your quiz "${quiz.title}" has been approved!`,
          type: 'quiz_status',
          link: `/quiz/${quiz._id}`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Quiz approved successfully.',
        data: quiz,
      });
    }

    const idx = (inMemoryQuizzes || []).findIndex((q) => q._id === id || q.id === id);
    if (idx !== -1) {
      inMemoryQuizzes[idx].status = 'approved';
      inMemoryQuizzes[idx].reviewFeedback = '';
      return res.status(200).json({
        success: true,
        message: 'Quiz approved successfully.',
        data: inMemoryQuizzes[idx],
      });
    }

    res.status(404).json({ success: false, message: 'Quiz not found' });
  } catch (error) {
    console.error('Approve quiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve quiz' });
  }
};

// =====================================================
// REJECT QUIZ
// =====================================================
const rejectQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required.',
      });
    }

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      quiz.status = 'rejected';
      quiz.reviewFeedback = reason.trim();
      await quiz.save();

      if (quiz.createdBy) {
        await createNotification({
          user: quiz.createdBy,
          sender: req.user._id,
          title: 'Quiz Rejected',
          message: `Your quiz "${quiz.title}" was rejected: "${reason.trim()}"`,
          type: 'quiz_status',
          link: `/quiz-builder`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Quiz rejected successfully.',
        data: quiz,
      });
    }

    const idx = (inMemoryQuizzes || []).findIndex((q) => q._id === id || q.id === id);
    if (idx !== -1) {
      inMemoryQuizzes[idx].status = 'rejected';
      inMemoryQuizzes[idx].reviewFeedback = reason.trim();
      return res.status(200).json({
        success: true,
        message: 'Quiz rejected successfully.',
        data: inMemoryQuizzes[idx],
      });
    }

    res.status(404).json({ success: false, message: 'Quiz not found' });
  } catch (error) {
    console.error('Reject quiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject quiz' });
  }
};

// =====================================================
// REQUEST QUIZ CHANGES
// =====================================================
const requestQuizChanges = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Feedback comment is required.',
      });
    }

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      quiz.status = 'changes_requested';
      quiz.reviewFeedback = comment.trim();
      await quiz.save();

      if (quiz.createdBy) {
        await createNotification({
          user: quiz.createdBy,
          sender: req.user._id,
          title: 'Quiz Changes Requested',
          message: `Editor feedback for quiz "${quiz.title}": "${comment.trim()}"`,
          type: 'quiz_status',
          link: `/quiz-builder`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Quiz changes requested successfully.',
        data: quiz,
      });
    }

    const idx = (inMemoryQuizzes || []).findIndex((q) => q._id === id || q.id === id);
    if (idx !== -1) {
      inMemoryQuizzes[idx].status = 'changes_requested';
      inMemoryQuizzes[idx].reviewFeedback = comment.trim();
      return res.status(200).json({
        success: true,
        message: 'Quiz changes requested successfully.',
        data: inMemoryQuizzes[idx],
      });
    }

    res.status(404).json({ success: false, message: 'Quiz not found' });
  } catch (error) {
    console.error('Request quiz changes error:', error);
    res.status(500).json({ success: false, message: 'Failed to request quiz changes' });
  }
};

// =====================================================
// GET ADMIN VERIFICATION STATISTICS
// =====================================================
const getVerificationStats = async (req, res) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const [pendingArticles, changesArticles, publishedArticles, rejectedArticles] = await Promise.all([
        Article.countDocuments({ status: 'pending' }),
        Article.countDocuments({ status: 'changes_requested' }),
        Article.countDocuments({ status: { $in: ['approved', 'published'] } }),
        Article.countDocuments({ status: 'rejected' }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          pending: pendingArticles,
          changesRequested: changesArticles,
          published: publishedArticles,
          rejected: rejectedArticles,
        },
      });
    }

    const pending = articleStore.inMemoryArticles.filter((a) => a.status === 'pending').length;
    const changesRequested = articleStore.inMemoryArticles.filter((a) => a.status === 'changes_requested').length;
    const published = articleStore.inMemoryArticles.filter((a) => a.status === 'published' || a.status === 'approved').length;
    const rejected = articleStore.inMemoryArticles.filter((a) => a.status === 'rejected').length;

    return res.status(200).json({
      success: true,
      data: {
        pending,
        changesRequested,
        published,
        rejected,
      },
    });
  } catch (error) {
    console.error('Get verification statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification statistics',
      data: {
        pending: 0,
        changesRequested: 0,
        published: 0,
        rejected: 0,
      },
    });
  }
};

module.exports = {
  getPendingArticles,
  getPendingQuizzes,
  approveArticle,
  rejectArticle,
  requestArticleChanges,
  approveQuiz,
  rejectQuiz,
  requestQuizChanges,
  getVerificationStats,
};

