
const mongoose = require('mongoose');

const topicTrendSchema = new mongoose.Schema(
  {
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    analysisWindowDays: {
      type: Number,
      default: 7,
    },
    trendBasis: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
    topics: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    sourceArticleCount: {
      type: Number,
      default: 0,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = topicTrendSchema;
