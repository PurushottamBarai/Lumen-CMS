const mongoose = require('mongoose');

const reputationLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reputation log must reference a user'],
      index: true,
    },
    delta: {
      type: Number,
      required: [true, 'Score delta is required'],
    },
    previousScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    newScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: [
        'ARTICLE_APPROVED',
        'ARTICLE_REJECTED_VIOLATION',
        'COMMENT_MODERATED_DELETE',
        'HELPFUL_REACTION_RECEIVED',
        'QUIZ_COMPLETED',
        'ADMIN_MANUAL_ADJUSTMENT',
        'REPORT_CONFIRMED_PENALTY',
        'SYSTEM_RESET',
      ],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'A description or reason is required for trust updates'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    sourceId: {
      type: String,
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index to ensure deduplication (an action cannot reward or penalize multiple times for the same source)
reputationLogSchema.index({ user: 1, eventType: 1, sourceId: 1 }, { unique: true, sparse: true });

const ReputationLog = mongoose.model('ReputationLog', reputationLogSchema);

module.exports = ReputationLog;
