import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { commentAPI } from '../../services/api';
import CommentItem from './CommentItem';
import {
  MessageSquare,
  Send,
  Sparkles,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Lock,
} from 'lucide-react';

const CommentSection = ({ targetId = 'default-discussion', targetTitle = 'Discussion' }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'top'

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await commentAPI.getCommentsByTarget(targetId);
      if (response.data?.success) {
        setComments(response.data.comments || []);
        setTotalCount(response.data.count || 0);
      } else {
        setError('Failed to load discussion comments.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error connecting to discussion service.');
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handle posting a new top-level comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await commentAPI.createComment({
        content: newCommentText.trim(),
        targetId,
        targetType: 'article',
      });

      if (response.data?.success && response.data?.comment) {
        setComments((prev) => [response.data.comment, ...prev]);
        setTotalCount((prev) => prev + 1);
        setNewCommentText('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle posting a nested reply
  const handleReplyAdded = async (replyData) => {
    const response = await commentAPI.createComment(replyData);
    if (response.data?.success) {
      // Re-fetch comments to cleanly re-assemble the updated nested hierarchy
      fetchComments();
    }
  };

  // Handle updating a comment
  const handleCommentUpdated = async (commentId, newContent) => {
    const response = await commentAPI.updateComment(commentId, { content: newContent });
    if (response.data?.success) {
      fetchComments();
    }
  };

  // Handle deleting a comment
  const handleCommentDeleted = async (commentId) => {
    const response = await commentAPI.deleteComment(commentId);
    if (response.data?.success) {
      fetchComments();
    }
  };

  // Handle reacting to a comment
  const handleReactionToggled = async (commentId, type = 'like') => {
    await commentAPI.toggleReaction(commentId, type);
  };

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Sort comments
  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'top') {
      const aLikes = (a.reactionCounts?.total || 0) + (a.replies?.length || 0);
      const bLikes = (b.reactionCounts?.total || 0) + (b.replies?.length || 0);
      return bLikes - aLikes;
    }
    // Default newest
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5F2EB]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#1A382B] flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Community Discussion
            </h3>
            <p className="text-xs text-stone-500">
              {totalCount} {totalCount === 1 ? 'thought' : 'thoughts'} shared on this topic
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          {/* Sort Tabs */}
          <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#EDE8DF]">
            <button
              onClick={() => setSortBy('newest')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                sortBy === 'newest'
                  ? 'bg-[#1A382B] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Newest
            </button>
            <button
              onClick={() => setSortBy('top')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                sortBy === 'top'
                  ? 'bg-[#1A382B] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Top Reacted
            </button>
          </div>

          <button
            onClick={fetchComments}
            disabled={loading}
            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-[#FAF7F2] rounded-xl border border-[#EDE8DF] transition"
            title="Refresh discussions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Comment Composer */}
      {isAuthenticated ? (
        <form onSubmit={handlePostComment} className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1A382B] text-white font-serif font-bold flex items-center justify-center text-xs shadow-2xs flex-shrink-0 mt-0.5">
              {getInitials(user?.name)}
            </div>

            <div className="flex-1 space-y-2">
              <textarea
                rows={3}
                placeholder="Share your perspective, question, or analysis..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="w-full p-3.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl text-xs sm:text-sm text-stone-900 placeholder-[#9E988D] focus:outline-none focus:border-[#1A382B] focus:bg-white transition resize-none"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-stone-400">
                  Signed in as <strong className="text-stone-700 capitalize">{user?.name} ({user?.role})</strong>
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting || !newCommentText.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#1A382B] hover:bg-[#11261D] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Posting...' : 'Post Thought'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-5 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-stone-700 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Join the Discussion</span>
          </div>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Readers, authors, and editors can participate in article discussions, post replies, and react.
          </p>
          <div className="pt-1">
            <Link
              to="/login"
              className="inline-block px-4 py-2 bg-[#1A382B] text-white text-xs font-semibold rounded-xl hover:bg-[#12281E] transition"
            >
              Sign In to Comment
            </Link>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="py-12 text-center text-xs text-stone-400">
            Loading thoughts & discussion threads...
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500 space-y-1">
            <p className="font-semibold text-stone-700">No comments yet on this topic.</p>
            <p className="text-stone-400">Be the first to share an insight or question!</p>
          </div>
        ) : (
          sortedComments.map((comment) => (
            <CommentItem
              key={comment.id || comment._id}
              comment={comment}
              targetId={targetId}
              onReplyAdded={handleReplyAdded}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
              onReactionToggled={handleReactionToggled}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
