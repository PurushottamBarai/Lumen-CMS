const mongoose = require('mongoose');
const Message = require('./Message');
const userStore = require('./userStore');

// In-Memory store for messages when MongoDB is offline / disconnected
let inMemoryMessages = [
  {
    _id: '66c9f3a00000000000000001',
    id: '66c9f3a00000000000000001',
    sender: '66c9f1a00000000000000002', // Thomas Okeke (Author)
    receiver: '66c9f1a00000000000000001', // Amara Silva (Admin)
    text: 'Hello Amara, the draft for the new history article has been prepared for editorial review.',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000),
  },
  {
    _id: '66c9f3a00000000000000002',
    id: '66c9f3a00000000000000002',
    sender: '66c9f1a00000000000000001', // Amara Silva (Admin)
    receiver: '66c9f1a00000000000000002', // Thomas Okeke (Author)
    text: 'Thanks Thomas! I will review the sources and get back to you shortly.',
    createdAt: new Date(Date.now() - 20 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 20 * 3600 * 1000),
  },
  {
    _id: '66c9f3a00000000000000003',
    id: '66c9f3a00000000000000003',
    sender: '66c9f1a00000000000000004', // Lena Kaufmann (Reader)
    receiver: '66c9f1a00000000000000002', // Thomas Okeke (Author)
    text: 'Hi Thomas, really enjoyed your ARPANET article! Fascinating history.',
    createdAt: new Date(Date.now() - 10 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 10 * 3600 * 1000),
  },
];

const isDBConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

const messageStore = {
  isDBConnected,
  inMemoryMessages,

  /**
   * Retrieve conversation messages between two users sorted chronologically
   */
  async getConversation(user1, user2) {
    const u1 = user1.toString();
    const u2 = user2.toString();

    if (isDBConnected() && mongoose.Types.ObjectId.isValid(u1) && mongoose.Types.ObjectId.isValid(u2)) {
      try {
        const dbMessages = await Message.find({
          $or: [
            { sender: u1, receiver: u2 },
            { sender: u2, receiver: u1 },
          ],
        }).sort({ createdAt: 1 });

        if (dbMessages && dbMessages.length > 0) {
          return dbMessages.map((m) => ({
            _id: m._id.toString(),
            id: m._id.toString(),
            sender: m.sender.toString(),
            receiver: m.receiver.toString(),
            text: m.text,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
          }));
        }
      } catch (err) {
        console.warn('[messageStore] MongoDB query failed, using in-memory store:', err.message);
      }
    }

    // In-memory filter
    return inMemoryMessages
      .filter((m) => {
        const s = (m.sender?.id || m.sender?._id || m.sender)?.toString();
        const r = (m.receiver?.id || m.receiver?._id || m.receiver)?.toString();
        return (s === u1 && r === u2) || (s === u2 && r === u1);
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  /**
   * Create and persist a new message
   */
  async createMessage({ sender, receiver, text }) {
    if (!sender || !receiver || !text || !text.trim()) {
      return {
        success: false,
        status: 400,
        message: 'Sender, receiver, and message text are required.',
      };
    }

    const sId = sender.toString();
    const rId = receiver.toString();
    const trimmedText = text.trim();

    // Verify recipient user exists
    const recipientUser = await userStore.findById(rId);
    if (!recipientUser) {
      return {
        success: false,
        status: 404,
        message: 'Recipient user does not exist in the directory.',
      };
    }

    let savedMessage = null;

    if (isDBConnected() && mongoose.Types.ObjectId.isValid(sId) && mongoose.Types.ObjectId.isValid(rId)) {
      try {
        const dbMsg = await Message.create({
          sender: sId,
          receiver: rId,
          text: trimmedText,
        });

        savedMessage = {
          _id: dbMsg._id.toString(),
          id: dbMsg._id.toString(),
          sender: sId,
          receiver: rId,
          text: trimmedText,
          createdAt: dbMsg.createdAt,
          updatedAt: dbMsg.updatedAt,
        };
      } catch (err) {
        console.warn('[messageStore] MongoDB insert failed, falling back to memory store:', err.message);
      }
    }

    if (!savedMessage) {
      const generatedId = new mongoose.Types.ObjectId().toString();
      savedMessage = {
        _id: generatedId,
        id: generatedId,
        sender: sId,
        receiver: rId,
        text: trimmedText,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Always record in inMemoryMessages for immediate synchronous consistency
    inMemoryMessages.push(savedMessage);

    return {
      success: true,
      message: savedMessage,
    };
  },
};

module.exports = messageStore;
