const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    readingHistory: [
      {
        article: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Article',
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
        tags: {
          type: [String],
          default: [],
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    preferredCategories: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Method to record an article view and keep history capped at 50 items
userActivitySchema.methods.recordView = async function (articleId, category, tags = []) {
  // Filter out duplicate view if already in recent history to move it to the top
  this.readingHistory = this.readingHistory.filter(
    (item) => item.article.toString() !== articleId.toString()
  );

  this.readingHistory.unshift({
    article: articleId,
    category,
    tags,
    viewedAt: new Date(),
  });

  // Keep history capped at 50 to maintain fast query performance
  if (this.readingHistory.length > 50) {
    this.readingHistory = this.readingHistory.slice(0, 50);
  }

  return this.save();
};

module.exports = mongoose.model('UserActivity', userActivitySchema);