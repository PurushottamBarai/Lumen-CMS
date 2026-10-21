import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ThumbsUp,
  Heart,
  Sparkles,
  Reply,
  Edit2,
  Trash2,
  Check,
  X,
  CornerDownRight,
  Shield,
  PenLine,
  User,
  ShieldAlert,
} from 'lucide-react';

const CommentItem = ({
  comment,
  targetId,
  onReplyAdded,
  onCommentUpdated,
  onCommentDeleted,
  onReactionToggled,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [localReacted, setLocalReacted] = useState(comment.userReaction !== null);
  const [localReactionCount, setLocalReactionCount] = useState(
    comment.reactionCounts?.total || 0
  );

  const currentUserId = user?.id || user?._id;
  const authorId = comment.author?.id || comment.author?._id || comment.author;
  const isOwner = currentUserId && authorId && currentUserId.toString() === authorId.toString();
  const isAdmin = user?.role === 'admin';

  // Helper for author initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Helper for relative time
  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to react to comments.');
      return;
    }

    // Optimistic update
    const newReactedState = !localReacted;
    setLocalReacted(newReactedState);
    setLocalReactionCount((prev) => (newReactedState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await onReactionToggled(comment.id || comment._id, 'like');
    } catch (err) {
      // Revert on error
      setLocalReacted(!newReactedState);
      setLocalReactionCount((prev) => (!newReactedState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;

    setIsSavingEdit(true);
    try {
      await onCommentUpdated(comment.id || comment._id, editText.trim());
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update comment. Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      await onReplyAdded({
        content: replyText.trim(),
        targetId,
        parentId: comment.id || comment._id,
      });
      setReplyText('');
      setIsReplying(false);
    } catch (err) {
      alert('Failed to post reply. Please try again.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDelete = async () => {
    const confirmText = isAdmin && !isOwner
      ? 'Moderator Action: Are you sure you want to delete this comment?'
      : 'Are you sure you want to delete your comment?';

    if (window.confirm(confirmText)) {
      await onCommentDeleted(comment.id || comment._id);
    }
  };

  return (
    <div className="space-y-3">
      <div className={`bg-[#FAF7F2] border rounded-2xl p-4 sm:p-5 transition hover:border-[#DDD7CC] ${
        comment.author?.role === 'admin'
          ? 'border-purple-200/80 bg-purple-50/20'
          : comment.author?.role === 'author'
          ? 'border-emerald-200/80 bg-emerald-50/20'
          : 'border-[#EDE8DF]'
      }`}>
        {/* Comment Header */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full font-serif font-bold flex items-center justify-center text-xs shadow-2xs ${
              comment.author?.role === 'admin'
                ? 'bg-purple-900 text-white'
                : comment.author?.role === 'author'
                ? 'bg-[#1A382B] text-white'
                : 'bg-stone-700 text-white'
            }`}>
              {getInitials(comment.author?.name)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-stone-900">
                  {comment.author?.name || 'Community Contributor'}
                </span>

                {/* Role Badge */}
                {comment.author?.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-900 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full shadow-2xs">
                    <Shield className="w-2.5 h-2.5 text-purple-700" />
                    Admin / Moderator
                  </span>
                )}
                {comment.author?.role === 'author' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs">
                    <PenLine className="w-2.5 h-2.5 text-emerald-700" />
                    Author
                  </span>
                )}
                {comment.author?.role === 'reader' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-700 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                    <User className="w-2.5 h-2.5 text-stone-500" />
                    Reader
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                <span>{formatTime(comment.createdAt)}</span>
                {comment.isEdited && (
                  <>
                    <span>•</span>
                    <span className="italic text-stone-400">edited</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Edit / Delete Actions */}
          <div className="flex items-center gap-1.5">
            {isOwner && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition"
                title="Edit your comment"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {isOwner && (
              <button
                onClick={handleDelete}
                className="p-1.5 text-stone-400 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition"
                title="Delete your comment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {isAdmin && !isOwner && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition shadow-2xs"
                title="Moderate and delete this comment"
              >
                <ShieldAlert className="w-3 h-3 text-rose-600" />
                <span>Moderate</span>
              </button>
            )}
          </div>
        </div>

        {/* Comment Content or Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-2 mt-2">
            <textarea
              rows={3}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 bg-white border border-[#1A382B] rounded-xl text-xs text-stone-900 focus:outline-none resize-none"
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-4 py-1.5 bg-[#1A382B] text-white text-xs font-bold rounded-lg hover:bg-[#11261D] transition"
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-line pl-10">
            {comment.content}
          </p>
        )}

        {/* Comment Footer: Reactions & Reply Toggle */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#EFECE6] text-xs">
          <div className="flex items-center gap-2 pl-10">
            {/* Reaction Like Button */}
            <button
              onClick={handleLikeClick}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                localReacted
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                  : 'bg-white border border-[#EDE8DF] text-stone-600 hover:bg-stone-100'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${localReacted ? 'fill-emerald-800 text-emerald-800' : ''}`} />
              <span>{localReactionCount > 0 ? localReactionCount : 'Like'}</span>
            </button>

            {/* Reply Button */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  alert('Please sign in to reply to discussions.');
                  return;
                }
                setIsReplying(!isReplying);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-full transition font-semibold"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
          </div>
        </div>

        {/* Inline Reply Form */}
        {isReplying && (
          <div className="mt-4 pt-3 border-t border-[#EDE8DF] pl-10 animate-in fade-in">
            <form onSubmit={handleSendReply} className="space-y-2">
              <div className="flex items-start gap-2">
                <CornerDownRight className="w-4 h-4 text-stone-400 mt-2.5 flex-shrink-0" />
                <textarea
                  rows={2}
                  placeholder={`Replying to ${comment.author?.name || 'contributor'} (${comment.author?.role || 'reader'})...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EDE8DF] focus:border-[#1A382B] rounded-xl text-xs text-stone-900 focus:outline-none resize-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="px-3 py-1 text-xs text-stone-600 hover:text-stone-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReply || !replyText.trim()}
                  className="px-4 py-1.5 bg-[#1A382B] text-white text-xs font-bold rounded-lg hover:bg-[#11261D] transition disabled:opacity-50"
                >
                  {isSubmittingReply ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Nested Replies Thread Tree */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-6 sm:pl-10 space-y-3 border-l-2 border-[#EDE8DF] ml-4 sm:ml-6 mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id || reply._id}
              comment={reply}
              targetId={targetId}
              onReplyAdded={onReplyAdded}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
              onReactionToggled={onReactionToggled}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
