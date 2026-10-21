const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['Article', 'Comment', 'User', 'Other'],
      default: 'Article',
    },

    item: {
      type: String,
      required: true,
      trim: true,
    },

    targetId: {
      type: String,
      default: '',
      trim: true,
    },

    reportedBy: {
      type: String,
      required: true,
      trim: true,
    },

    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
    },

    // AI analysis of the reported content
    aiAnalysis: {
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
      },

      label: {
        type: String,
        default: '',
        trim: true,
      },

      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },

      summary: {
        type: String,
        default: '',
        trim: true,
      },

      analyzedAt: {
        type: Date,
        default: null,
      },
    },

    // Admin review information
    adminReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      action: {
        type: String,
        enum: [
          '',
          'none',
          'content_removed',
          'content_restored',
          'user_warned',
          'user_suspended',
          'dismissed',
        ],
        default: '',
      },

      notes: {
        type: String,
        default: '',
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Report', reportSchema);