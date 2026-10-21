const commentStore = require('../models/commentStore');
const trustService = require('../services/trustService');

/**
 * Helper to build threaded comment tree and compute reaction stats
 */
const formatCommentWithStats = (comment, currentUserId) => {
  const id = comment.id || comment._id?.toString();
  const reactions = comment.reactions || [];
  const currentUserIdStr = currentUserId?.toString();

  const reactionCounts = {
    total: reactions.length,
    like: reactions.filter((r) => r.type === 'like').length,
    heart: reactions.filter((r) => r.type === 'heart').length,
    insightful: reactions.filter((r) => r.type === 'insightful').length,
    applause: reactions.filter((r) => r.type === 'applause').length,
  };

  const userReaction = currentUserIdStr
    ? reactions.find((r) => (r.user?._id?.toString() || r.user?.toString()) === currentUserIdStr)?.type || null
    : null;

  return {
    id,
    _id: id,
    content: comment.content,
    author: comment.author,
    targetId: comment.targetId,
    targetType: comment.targetType,
    parentId: comment.parentId ? comment.parentId.toString() : null,
    isEdited: comment.isEdited || false,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    reactionCounts,
    userReaction,
    replies: [],
  };
};

/**
 * @desc    Get all comments and nested replies for a target (article or discussion)
 * @route   GET /api/comments/target/:targetId
 * @access  Public / Authenticated
 */
const getCommentsByTarget = async (req, res) => {
  try {
    const { targetId } = req.params;
    const currentUserId = req.user ? (req.user.id || req.user._id) : null;

    const rawComments = await commentStore.getCommentsByTarget(targetId);

    // Format all comments
    const formatted = rawComments.map((c) => formatCommentWithStats(c, currentUserId));

    // Build threaded hierarchy
    const commentMap = {};
    const rootComments = [];

    formatted.forEach((c) => {
      commentMap[c.id] = c;
    });

    formatted.forEach((c) => {
      if (c.parentId && commentMap[c.parentId]) {
        commentMap[c.parentId].replies.push(c);
      } else {
        rootComments.push(c);
      }
    });

    return res.status(200).json({
      success: true,
      count: rawComments.length,
      rootCount: rootComments.length,
      comments: rootComments,
    });
  } catch (error) {
    console.error('[Comment getCommentsByTarget Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving discussion comments.',
    });
  }
};

/**
 * @desc    Create a new comment or threaded reply
 * @route   POST /api/comments
 * @access  Private (Authenticated User)
 */
const createComment = async (req, res) => {
  try {
    const { content, targetId, targetType, parentId } = req.body;
    const userId = req.user.id || req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty.',
      });
    }

    if (!targetId || !targetId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Target ID is required.',
      });
    }

    // If replying, verify parent comment exists
    if (parentId) {
      const parentComment = await commentStore.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found to reply to.',
        });
      }
    }

    const newComment = await commentStore.createComment({
      content: content.trim(),
      author: userId,
      targetId: targetId.trim(),
      targetType: targetType || 'article',
      parentId: parentId || null,
    });

    const formatted = formatCommentWithStats(newComment, userId);

    return res.status(201).json({
      success: true,
      message: parentId ? 'Reply posted successfully.' : 'Comment posted successfully.',
      comment: formatted,
    });
  } catch (error) {
    console.error('[Comment createComment Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error posting comment.',
    });
  }
};

/**
 * @desc    Update a comment
 * @route   PUT /api/comments/:id
 * @access  Private (Comment Author Only)
 */
const updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const commentId = req.params.id;
    const userId = (req.user.id || req.user._id).toString();

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty.',
      });
    }

    const comment = await commentStore.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    const authorId = (comment.author?.id || comment.author?._id || comment.author).toString();
    if (authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this comment.',
      });
    }

    const updated = await commentStore.updateComment(commentId, content.trim());
    const formatted = formatCommentWithStats(updated, userId);

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully.',
      comment: formatted,
    });
  } catch (error) {
    console.error('[Comment updateComment Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating comment.',
    });
  }
};

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:id
 * @access  Private (Author or Admin)
 */
const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = (req.user.id || req.user._id).toString();
    const userRole = req.user.role;

    const comment = await commentStore.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    const authorId = (comment.author?.id || comment.author?._id || comment.author).toString();
    const isOwner = authorId === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this comment.',
      });
    }

    await commentStore.deleteComment(commentId);

    // Phase 3: Penalty for moderated deletion (-5) if removed by an admin (and not the author themselves)
    if (isAdmin && !isOwner && authorId) {
      try {
        await trustService.handleCommentModerated(
          commentId,
          authorId,
          'Comment removed by administrator moderation for policy violation',
          userId
        );
      } catch (trustErr) {
        console.warn('[Trust] Failed to record penalty on comment moderation:', trustErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: isAdmin && !isOwner ? 'Comment removed by administrator moderation.' : 'Comment deleted successfully.',
    });
  } catch (error) {
    console.error('[Comment deleteComment Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting comment.',
    });
  }
};

/**
 * @desc    Toggle reaction (like, heart, etc.) on a comment
 * @route   POST /api/comments/:id/react
 * @access  Private (Authenticated User)
 */
const toggleReaction = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { type = 'like' } = req.body;
    const userId = (req.user.id || req.user._id).toString();

    const result = await commentStore.toggleReaction(commentId, userId, type);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    // Phase 3: Award +2 Trust Score to comment author when another user adds a positive reaction
    if (result.userReacted) {
      const commentDoc = result.comment;
      const authorId = (commentDoc.author?.id || commentDoc.author?._id || commentDoc.author)?.toString();
      if (authorId && authorId !== userId) {
        try {
          await trustService.handleHelpfulReaction(`reaction_${commentId}_${userId}`, authorId);
        } catch (trustErr) {
          console.warn('[Trust] Failed to record reaction reward:', trustErr.message);
        }
      }
    }

    const formatted = formatCommentWithStats(result.comment, userId);

    return res.status(200).json({
      success: true,
      message: result.userReacted ? `Added ${type} reaction.` : `Removed ${type} reaction.`,
      userReacted: result.userReacted,
      reactionCounts: formatted.reactionCounts,
      comment: formatted,
    });
  } catch (error) {
    console.error('[Comment toggleReaction Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating reaction.',
    });
  }
};

/**
 * @desc    Get recent comments across the platform
 * @route   GET /api/comments/recent
 * @access  Public
 */
const getRecentDiscussions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 8;
    const rawComments = await commentStore.getRecentComments(limit);
    const formatted = rawComments.map((c) => formatCommentWithStats(c, req.user?.id));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      comments: formatted,
    });
  } catch (error) {
    console.error('[Comment getRecentDiscussions Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving recent discussions.',
    });
  }
};
/**
 * @desc    Get all comments for admin review
 * @route   GET /api/comments/admin/all
 * @access  Private (Admin)
 */
const getAllComments = async (req, res) => {
  try {
    const rawComments = await commentStore.getAllComments();
    const formatted = rawComments.map((c) => formatCommentWithStats(c, req.user?.id));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      comments: formatted,
    });
  } catch (error) {
    console.error('[Comment getAllComments Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving all comments.',
    });
  }
};

module.exports = {
  getCommentsByTarget,
  createComment,
  updateComment,
  deleteComment,
  toggleReaction,
  getRecentDiscussions,
  getAllComments,
};
