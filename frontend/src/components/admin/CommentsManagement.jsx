import React, { useMemo, useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Eye,
  EyeOff,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import { commentAPI } from '../../services/api';

const initialComments = [
  {
    id: '1',
    comment:
      'This was a really insightful article. The explanation was simple and easy to understand.',
    user: 'Aarav Mehta',
    article: 'The Psychology of Success',
    date: 'Sep 05, 2026',
    status: 'visible',
  },
  {
    id: '2',
    comment:
      'I completely disagree with this point. There are other perspectives that should be considered.',
    user: 'Priya Sharma',
    article: 'Understanding Human Behavior',
    date: 'Sep 04, 2026',
    status: 'visible',
  },
  {
    id: '3',
    comment:
      'This comment contains content that should be reviewed by the administrator.',
    user: 'Rohan Patil',
    article: 'The Changing Meaning of Success',
    date: 'Sep 03, 2026',
    status: 'hidden',
  },
];

const CommentsManagement = () => {
  const [comments, setComments] = useState(initialComments);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComment, setSelectedComment] = useState(null);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await commentAPI.getAllCommentsForAdmin();
      if (response.data?.success && Array.isArray(response.data.comments)) {
        const mapped = response.data.comments.map((c) => ({
          id: c.id || c._id,
          comment: c.content || c.comment || '',
          user: c.author?.name || 'Anonymous',
          article: c.targetId || 'Article',
          date: c.createdAt
            ? new Date(c.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              })
            : 'Recent',
          status: c.status || 'visible',
        }));
        if (mapped.length > 0) {
          setComments(mapped);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredComments = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return comments.filter((comment) => {
      const matchesSearch =
        !searchTerm ||
        comment.comment.toLowerCase().includes(searchTerm) ||
        comment.user.toLowerCase().includes(searchTerm) ||
        comment.article.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === 'all' ||
        comment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [comments, search, statusFilter]);

  const handleToggleVisibility = (id) => {
    setComments((currentComments) =>
      currentComments.map((comment) =>
        comment.id === id
          ? {
              ...comment,
              status:
                comment.status === 'visible'
                  ? 'hidden'
                  : 'visible',
            }
          : comment
      )
    );
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this comment?'
    );

    if (!confirmed) return;

    try {
      await commentAPI.deleteComment(id);
    } catch (err) {
      console.warn('API delete comment notice:', err.message);
    }

    setComments((currentComments) =>
      currentComments.filter((comment) => comment.id !== id)
    );

    setSelectedComment(null);
  };

  const getStatusClasses = (status) => {
    if (status === 'visible') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }

    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Comment Management
        </h2>

        <p className="text-xs text-stone-500 mt-1">
          Review and moderate comments posted on the platform.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-white border border-[#EDE8DF] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
              Total Comments
            </span>

            <MessageSquare className="w-4 h-4 text-stone-400" />
          </div>

          <p className="font-serif text-2xl font-bold text-stone-900 mt-3">
            {comments.length}
          </p>
        </div>

        <div className="bg-white border border-[#EDE8DF] rounded-2xl p-5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
            Visible
          </span>

          <p className="font-serif text-2xl font-bold text-stone-900 mt-3">
            {
              comments.filter(
                (comment) => comment.status === 'visible'
              ).length
            }
          </p>
        </div>

        <div className="bg-white border border-[#EDE8DF] rounded-2xl p-5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
            Hidden
          </span>

          <p className="font-serif text-2xl font-bold text-stone-900 mt-3">
            {
              comments.filter(
                (comment) => comment.status === 'hidden'
              ).length
            }
          </p>
        </div>

      </div>

      {/* Search + Filter */}
      <div className="bg-white border border-[#EDE8DF] rounded-3xl p-4">

        <div className="flex flex-col md:flex-row gap-3">

          {/* Search */}
          <div className="relative flex-1">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search comments, users or articles..."
              className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-[#1A382B]"
            />

          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-700 focus:outline-none focus:border-[#1A382B]"
          >
            <option value="all">All Statuses</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>

        </div>

      </div>

      {/* Comments Table */}
      <div className="bg-white border border-[#EDE8DF] rounded-3xl overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px]">

            <thead className="bg-[#FAF7F2] border-b border-[#EDE8DF]">

              <tr>

                <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Comment
                </th>

                <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  User
                </th>

                <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Article
                </th>

                <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Date
                </th>

                <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Status
                </th>

                <th className="text-right px-5 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-[#EDE8DF]">

              {filteredComments.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="px-5 py-14 text-center"
                  >
                    <MessageSquare className="w-8 h-8 text-stone-300 mx-auto" />

                    <p className="text-sm font-semibold text-stone-600 mt-3">
                      No comments found
                    </p>

                    <p className="text-xs text-stone-400 mt-1">
                      Try changing your search or filter.
                    </p>
                  </td>

                </tr>

              ) : (

                filteredComments.map((comment) => (

                  <tr
                    key={comment.id}
                    className="hover:bg-[#FAF7F2]/60 transition"
                  >

                    {/* Comment */}
                    <td className="px-5 py-4 max-w-[300px]">

                      <p className="text-xs text-stone-700 line-clamp-2">
                        {comment.comment}
                      </p>

                    </td>

                    {/* User */}
                    <td className="px-5 py-4">

                      <p className="text-xs font-semibold text-stone-800">
                        {comment.user}
                      </p>

                    </td>

                    {/* Article */}
                    <td className="px-5 py-4 max-w-[220px]">

                      <p className="text-xs text-stone-600 truncate">
                        {comment.article}
                      </p>

                    </td>

                    {/* Date */}
                    <td className="px-5 py-4">

                      <span className="text-xs text-stone-500">
                        {comment.date}
                      </span>

                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">

                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-semibold capitalize ${getStatusClasses(
                          comment.status
                        )}`}
                      >
                        {comment.status}
                      </span>

                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">

                      <div className="flex items-center justify-end gap-1">

                        <button
                          onClick={() =>
                            setSelectedComment(comment)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-600 hover:text-[#1A382B] hover:bg-[#FAF7F2] text-[10px] font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>

                        <button
                          onClick={() =>
                            handleToggleVisibility(comment.id)
                          }
                          title={
                            comment.status === 'visible'
                              ? 'Hide comment'
                              : 'Show comment'
                          }
                          className="p-1.5 rounded-lg text-stone-500 hover:text-[#1A382B] hover:bg-[#FAF7F2]"
                        >
                          {comment.status === 'visible' ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(comment.id)
                          }
                          title="Delete comment"
                          className="p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>



      {/* View Comment Modal */}
      {selectedComment && (

        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white border border-[#EDE8DF] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#EDE8DF] flex items-center justify-between">

              <div>

                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Comment
                </span>

                <h3 className="font-serif text-xl font-bold text-stone-900 mt-1">
                  Comment Details
                </h3>

              </div>

              <button
                onClick={() => setSelectedComment(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">

              <div>

                <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Comment
                </p>

                <div className="mt-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-4">

                  <p className="text-sm text-stone-700 leading-7">
                    {selectedComment.comment}
                  </p>

                </div>

              </div>

              <div className="grid sm:grid-cols-2 gap-4">

                <div className="bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-4">

                  <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                    User
                  </p>

                  <p className="text-sm font-semibold text-stone-800 mt-1">
                    {selectedComment.user}
                  </p>

                </div>

                <div className="bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-4">

                  <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                    Date
                  </p>

                  <p className="text-sm font-semibold text-stone-800 mt-1">
                    {selectedComment.date}
                  </p>

                </div>

              </div>

              <div>

                <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Article
                </p>

                <p className="text-sm font-semibold text-stone-800 mt-1">
                  {selectedComment.article}
                </p>

              </div>

              <div className="flex justify-end gap-2 pt-2">

                <button
                  onClick={() => {
                    handleToggleVisibility(
                      selectedComment.id
                    );

                    setSelectedComment(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE8DF] text-stone-700 text-xs font-bold hover:border-[#1A382B]"
                >
                  {selectedComment.status === 'visible' ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hide Comment
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Show Comment
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    handleDelete(selectedComment.id)
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold hover:bg-rose-100"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default CommentsManagement;