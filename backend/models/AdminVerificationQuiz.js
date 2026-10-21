const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (options) {
          return options.length === 4;
        },
        message: "A question must have exactly 4 options",
      },
    },

    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: true,
  }
);

const adminVerificationQuizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    questions: {
      type: [questionSchema],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "PENDING_REVIEW",
        "APPROVED",
        "REJECTED",
        "CHANGES_REQUESTED",
      ],
      default: "PENDING_REVIEW",
    },

    reviewComment: {
      type: String,
      default: "",
      trim: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AdminVerificationQuiz",
  adminVerificationQuizSchema
);