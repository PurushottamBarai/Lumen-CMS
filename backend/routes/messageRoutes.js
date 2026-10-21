const express = require('express');
const messageStore = require('../models/messageStore');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateUser);

// Get conversation between authenticated user and target user
router.get('/:userId', async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const selectedUserId = req.params.userId;

    if (!selectedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient user ID is required.',
      });
    }

    const messages = await messageStore.getConversation(currentUserId, selectedUserId);

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('[Messages GET Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages.',
      error: error.message,
    });
  }
});

// Send a new message
router.post('/', async (req, res) => {
  try {
    const sender = req.user._id || req.user.id;
    const { receiver, text } = req.body;

    if (!receiver || !text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Both receiver and message text are required.',
      });
    }

    if (String(sender) === String(receiver)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a message to yourself.',
      });
    }

    const result = await messageStore.createMessage({
      sender,
      receiver,
      text: text.trim(),
    });

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message,
      });
    }

    const message = result.message;

    // Real-time broadcast via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(receiver.toString()).emit('receive_message', message);
    }

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('[Messages POST Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message.',
      error: error.message,
    });
  }
});

module.exports = router;
