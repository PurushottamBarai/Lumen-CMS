const express = require('express');

const router = express.Router();

const {
  subscribeToAuthor,
  unsubscribeFromAuthor,
  getSubscriptionStatus,
  getMySubscriptions,
  getAuthorSubscriberCount,
} = require('../controllers/subscriptionController');

const {
  authenticateUser,
} = require('../middleware/auth');

// All subscription actions require login.
router.use(authenticateUser);

// Get logged-in user's subscriptions
router.get(
  '/',
  getMySubscriptions
);

// Check whether current user follows author
router.get(
  '/status/:authorId',
  getSubscriptionStatus
);

// Get number of subscribers for author
router.get(
  '/author/:authorId/count',
  getAuthorSubscriberCount
);

// Subscribe
router.post(
  '/:authorId',
  subscribeToAuthor
);

// Unsubscribe
router.delete(
  '/:authorId',
  unsubscribeFromAuthor
);

module.exports = router;