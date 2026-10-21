/**
 * Lumen CMS — User Trust & Reputation Controller
 * Phase 3: Sadanand Module
 */

const trustService = require('../services/trustService');
const userStore = require('../models/userStore');
const reputationStore = require('../models/reputationStore');

/**
 * @desc    Get authenticated user's trust profile and recent history
 * @route   GET /api/trust/my-score
 * @access  Private (Authenticated users)
 */
const getMyTrustProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await userStore.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    const history = await trustService.getUserReputationHistory(userId, 20);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id || user.id,
          _id: user._id || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          trustScore: user.trustScore ?? 50,
          trustLevel: user.trustLevel || trustService.calculateTrustLevel(user.trustScore ?? 50),
          positiveContributionsCount: user.positiveContributionsCount || 0,
          violationsCount: user.violationsCount || 0,
          lastReputationUpdate: user.lastReputationUpdate,
        },
        history,
      },
    });
  } catch (error) {
    console.error('Error fetching my trust profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving trust profile',
      error: error.message,
    });
  }
};

/**
 * @desc    Get public trust metrics for any user by ID
 * @route   GET /api/trust/users/:id
 * @access  Public / Authenticated
 */
const getUserTrustProfile = async (req, res) => {
  try {
    const user = await userStore.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id || user.id,
        _id: user._id || user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        trustScore: user.trustScore ?? 50,
        trustLevel: user.trustLevel || trustService.calculateTrustLevel(user.trustScore ?? 50),
        positiveContributionsCount: user.positiveContributionsCount || 0,
        violationsCount: user.violationsCount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching user trust info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user trust information',
      error: error.message,
    });
  }
};

/**
 * @desc    Get complete audit log history for a specific user
 * @route   GET /api/trust/users/:id/history
 * @access  Private (Admin only)
 */
const getUserTrustHistory = async (req, res) => {
  try {
    const targetUser = await userStore.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const history = await trustService.getUserReputationHistory(req.params.id, 100);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching user trust history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving trust history',
      error: error.message,
    });
  }
};

/**
 * @desc    Manually adjust a user's trust score with mandatory audit reason
 * @route   POST /api/trust/users/:id/adjust
 * @access  Private (Admin only)
 */
const adjustUserTrustScore = async (req, res) => {
  try {
    const { delta, reason } = req.body;
    const adminId = req.user._id || req.user.id;

    if (delta === undefined || typeof Number(delta) !== 'number' || isNaN(Number(delta))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid numeric delta (points to add or subtract)',
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A detailed reason is mandatory for manual administrative trust adjustments',
      });
    }

    const result = await trustService.handleAdminAdjustment(
      req.params.id,
      Number(delta),
      reason.trim(),
      adminId
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        user: {
          id: result.user._id || result.user.id,
          name: result.user.name,
          email: result.user.email,
          trustScore: result.user.trustScore,
          trustLevel: result.user.trustLevel,
        },
        log: result.log,
      },
    });
  } catch (error) {
    console.error('Error adjusting trust score:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message || 'Server error adjusting trust score',
    });
  }
};

/**
 * @desc    Get aggregate platform-wide trust statistics and tier distribution
 * @route   GET /api/trust/stats
 * @access  Private (Admin only)
 */
const getPlatformTrustStats = async (req, res) => {
  try {
    const stats = await trustService.getPlatformTrustStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching trust stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving trust statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get public top trusted contributors leaderboard
 * @route   GET /api/trust/leaderboard
 * @access  Public / Authenticated
 */
const getTrustLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const leaderboard = await trustService.getTrustLeaderboard(limit);

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Error fetching trust leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving trust leaderboard',
      error: error.message,
    });
  }
};

/**
 * @desc    Get recent system-wide reputation audit logs
 * @route   GET /api/trust/logs
 * @access  Private (Admin only)
 */
const getAllReputationLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const logs = await reputationStore.getAllLogs(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error('Error fetching reputation logs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving audit logs',
      error: error.message,
    });
  }
};

module.exports = {
  getMyTrustProfile,
  getUserTrustProfile,
  getUserTrustHistory,
  adjustUserTrustScore,
  getPlatformTrustStats,
  getTrustLeaderboard,
  getAllReputationLogs,
};
