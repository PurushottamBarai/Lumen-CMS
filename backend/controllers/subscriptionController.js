const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const isMongoConnected = () => {
  return (
    mongoose.connection &&
    mongoose.connection.readyState === 1
  );
};

/**
 * Subscribe to an author
 * POST /api/subscriptions/:authorId
 */
const subscribeToAuthor = async (req, res) => {
  try {
    const subscriberId =
      req.user._id || req.user.id;

    const { authorId } = req.params;

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected.',
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        authorId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid author ID.',
      });
    }

    // User cannot subscribe to themselves.
    if (
      subscriberId.toString() ===
      authorId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'You cannot subscribe to yourself.',
      });
    }

    // Make sure target user exists and is an author.
    const author =
      await User.findById(authorId);

    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found.',
      });
    }

    if (author.role !== 'author') {
      return res.status(400).json({
        success: false,
        message:
          'You can only subscribe to authors.',
      });
    }

    // Check existing subscription.
    const existing =
      await Subscription.findOne({
        subscriber: subscriberId,
        author: authorId,
      });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          'You are already subscribed to this author.',
        subscription: existing,
      });
    }

    const subscription =
      await Subscription.create({
        subscriber: subscriberId,
        author: authorId,
      });

    const populated =
      await Subscription.findById(
        subscription._id
      ).populate(
        'author',
        'name email role bio avatar'
      );

    await createNotification({
      user: authorId,
      sender: subscriberId,
      title: 'New Subscriber!',
      message: `${req.user?.name || 'A reader'} subscribed to your author profile.`,
      type: 'subscription',
      link: '/profile',
    });

    return res.status(201).json({
      success: true,
      message: `Subscribed to ${author.name}.`,
      subscription: populated,
    });
  } catch (error) {
    console.error(
      '[Subscription subscribe Error]:',
      error
    );

    // Handle MongoDB duplicate-key error safely.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          'You are already subscribed to this author.',
      });
    }

    return res.status(500).json({
      success: false,
      message:
        'Failed to subscribe to author.',
    });
  }
};


/**
 * Unsubscribe from an author
 * DELETE /api/subscriptions/:authorId
 */
const unsubscribeFromAuthor = async (
  req,
  res
) => {
  try {
    const subscriberId =
      req.user._id || req.user.id;

    const { authorId } = req.params;

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected.',
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        authorId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid author ID.',
      });
    }

    const deleted =
      await Subscription.findOneAndDelete({
        subscriber: subscriberId,
        author: authorId,
      });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message:
          'You are not subscribed to this author.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Successfully unsubscribed from author.',
    });
  } catch (error) {
    console.error(
      '[Subscription unsubscribe Error]:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to unsubscribe from author.',
    });
  }
};


/**
 * Check subscription status
 * GET /api/subscriptions/status/:authorId
 */
const getSubscriptionStatus = async (
  req,
  res
) => {
  try {
    const subscriberId =
      req.user._id || req.user.id;

    const { authorId } = req.params;

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected.',
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        authorId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid author ID.',
      });
    }

    const subscription =
      await Subscription.findOne({
        subscriber: subscriberId,
        author: authorId,
      });

    return res.status(200).json({
      success: true,
      subscribed: !!subscription,
      subscription: subscription || null,
    });
  } catch (error) {
    console.error(
      '[Subscription status Error]:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to check subscription status.',
    });
  }
};


/**
 * Get all subscriptions for logged-in user
 * GET /api/subscriptions
 */
const getMySubscriptions = async (
  req,
  res
) => {
  try {
    const subscriberId =
      req.user._id || req.user.id;

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected.',
        subscriptions: [],
      });
    }

    const subscriptions =
      await Subscription.find({
        subscriber: subscriberId,
      })
        .populate(
          'author',
          'name email role bio avatar createdAt'
        )
        .sort({ subscribedAt: -1 });

    return res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error) {
    console.error(
      '[Subscription list Error]:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to load subscriptions.',
      subscriptions: [],
    });
  }
};


/**
 * Get subscriber count for an author
 * GET /api/subscriptions/author/:authorId/count
 */
const getAuthorSubscriberCount = async (
  req,
  res
) => {
  try {
    const { authorId } = req.params;

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected.',
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        authorId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid author ID.',
      });
    }

    const count =
      await Subscription.countDocuments({
        author: authorId,
      });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error(
      '[Subscription count Error]:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to get subscriber count.',
    });
  }
};


module.exports = {
  subscribeToAuthor,
  unsubscribeFromAuthor,
  getSubscriptionStatus,
  getMySubscriptions,
  getAuthorSubscriberCount,
};