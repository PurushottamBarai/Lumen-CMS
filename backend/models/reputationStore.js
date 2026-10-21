const mongoose = require('mongoose');
const ReputationLog = require('./ReputationLog');

let inMemoryReputationLogs = [];

const isDBConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

const reputationStore = {
  isDBConnected,

  async createLog({ user, delta, previousScore, newScore, eventType, reason, sourceId = null, createdBy = null }) {
    if (isDBConnected()) {
      try {
        const log = await ReputationLog.create({
          user,
          delta,
          previousScore,
          newScore,
          eventType,
          reason,
          sourceId,
          createdBy,
        });
        await log.populate('createdBy', 'name email role');
        return log;
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate key error (idempotency caught by unique index)
          console.warn('[ReputationLog] Duplicate event ignored for sourceId:', sourceId);
          return null;
        }
        console.warn('[DB Fallback] ReputationLog create failed, using memory store:', err.message);
      }
    }

    const userIdStr = user?.toString();
    // Check in-memory deduplication
    if (sourceId) {
      const exists = inMemoryReputationLogs.some(
        (l) => l.user?.toString() === userIdStr && l.eventType === eventType && l.sourceId === sourceId
      );
      if (exists) {
        console.warn('[ReputationLog Memory] Duplicate event ignored for sourceId:', sourceId);
        return null;
      }
    }

    const newId = new mongoose.Types.ObjectId().toString();
    const doc = {
      id: newId,
      _id: newId,
      user,
      delta,
      previousScore,
      newScore,
      eventType,
      reason,
      sourceId,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryReputationLogs.unshift(doc);
    return doc;
  },

  async getLogsByUser(userId, limit = 50) {
    const userIdStr = userId?.toString();
    if (isDBConnected()) {
      try {
        const logs = await ReputationLog.find({ user: userId })
          .populate('createdBy', 'name email role')
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        return logs;
      } catch (err) {
        console.warn('[DB Fallback] ReputationLog query failed, using memory store:', err.message);
      }
    }

    return inMemoryReputationLogs
      .filter((l) => l.user?.toString() === userIdStr)
      .slice(0, limit);
  },

  async getAllLogs(limit = 100) {
    if (isDBConnected()) {
      try {
        const logs = await ReputationLog.find()
          .populate('user', 'name email role trustScore trustLevel')
          .populate('createdBy', 'name email role')
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        return logs;
      } catch (err) {
        console.warn('[DB Fallback] ReputationLog query all failed, using memory store:', err.message);
      }
    }

    return inMemoryReputationLogs.slice(0, limit);
  },

  async hasEventOccurred(userId, eventType, sourceId) {
    if (!sourceId) return false;
    const userIdStr = userId?.toString();

    if (isDBConnected()) {
      try {
        const count = await ReputationLog.countDocuments({
          user: userId,
          eventType,
          sourceId,
        });
        return count > 0;
      } catch (err) {
        console.warn('[DB Fallback] hasEventOccurred failed, using memory store:', err.message);
      }
    }

    return inMemoryReputationLogs.some(
      (l) => l.user?.toString() === userIdStr && l.eventType === eventType && l.sourceId === sourceId
    );
  },
};

module.exports = reputationStore;
