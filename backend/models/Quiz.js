const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (options) {
          return Array.isArray(options) && options.length === 4;
        },
        message: 'A question must have exactly 4 options',
      },
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      trim: true,
    },
  },
  {
    _id: true,
  }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'changes_requested'],
      default: 'draft',
    },
    reviewFeedback: {
      type: String,
      default: '',
      trim: true,
    },
    aiModeration: {
      score: {
        type: Number,
        default: null,
      },
      level: {
        type: String,
        enum: ['low', 'moderate', 'high', 'pending', null],
        default: null,
      },
      flags: {
        type: [String],
        default: [],
      },
      reason: {
        type: String,
        default: '',
      },
      checkedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Quiz', quizSchema);
