const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// A user can subscribe to an author only once.
subscriptionSchema.index(
  { subscriber: 1, author: 1 },
  { unique: true }
);

// Helpful for showing an author's subscriber count.
subscriptionSchema.index({ author: 1 });

module.exports = mongoose.model(
  'Subscription',
  subscriptionSchema
);