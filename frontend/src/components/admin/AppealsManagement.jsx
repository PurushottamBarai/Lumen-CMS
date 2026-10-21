import React, { useState, useEffect, useMemo } from 'react';
import { appealAPI } from '../../services/api';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  AlertCircle,
  FileText,
  User,
  Filter,
  Check,
} from 'lucide-react';

const AppealsManagement = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering & search
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Review modal state
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Fetch appeals from backend API
  const fetchAppeals = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await appealAPI.getAppeals(params);
      if (res.data?.success && Array.isArray(res.data.appeals)) {
        setAppeals(res.data.appeals);
      } else {
        setAppeals([]);
      }
    } catch (err) {
      console.error('[AppealsManagement] Error loading appeals:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load appeals. Ensure you are signed in with administrator privileges.'
      );
      setAppeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, [statusFilter]);

  // Client-side search filtering
  const filteredAppeals = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return appeals;

    return appeals.filter((appeal) => {
      const appellantName =
        typeof appeal.appellantId === 'object'
          ? appeal.appellantId?.name || appeal.appellantName || ''
          : appeal.appellantName || '';
      const appellantEmail =
        typeof appeal.appellantId === 'object'
          ? appeal.appellantId?.email || ''
          : '';
      const reason = appeal.reason || '';
      const details = appeal.details || '';
      const reportItem =
        typeof appeal.reportId === 'object' ? appeal.reportId?.item || '' : '';
      const id = String(appeal._id || appeal.id);

      return (
        appellantName.toLowerCase().includes(term) ||
        appellantEmail.toLowerCase().includes(term) ||
        reason.toLowerCase().includes(term) ||
        details.toLowerCase().includes(term) ||
        reportItem.toLowerCase().includes(term) ||
        id.toLowerCase().includes(term)
      );
    });
  }, [appeals, search]);

  // Metrics
  const totalCount = appeals.length;
  const pendingCount = appeals.filter((a) => a.status === 'pending').length;
  const approvedCount = appeals.filter((a) => a.status === 'approved').length;
  const rejectedCount = appeals.filter((a) => a.status === 'rejected').length;

  // Review handler (approve or reject)
  const handleReviewAppeal = async (status) => {
    if (!selectedAppeal) return;

    const appealId = selectedAppeal._id || selectedAppeal.id;
    setReviewing(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await appealAPI.reviewAppeal(appealId, {
        status,
        reviewNotes: reviewNotes.trim(),
      });

      if (res.data?.success) {
        setSuccessMsg(
          `Appeal #${String(appealId).slice(-6)} has been ${status} successfully.`
        );
        // Update local appeal item
        setAppeals((prev) =>
          prev.map((a) =>
            (a._id || a.id) === appealId
              ? {
                  ...a,
                  status,
                  reviewNotes: reviewNotes.trim(),
                  reviewedAt: new Date().toISOString(),
                }
              : a
          )
        );
        setSelectedAppeal(null);
        setReviewNotes('');
      } else {
        setError(res.data?.message || 'Failed to review appeal.');
      }
    } catch (err) {
      console.error('[AppealsManagement] Review appeal error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to review appeal. Please try again.'
      );
    } finally {
      setReviewing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#1A382B]" />
            Report Appeals Management
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Review user disputes regarding community moderation, flagged reports, and account penalties.
          </p>
        </div>
        <button
          onClick={fetchAppeals}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-[#EDE8DF] rounded-xl transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EDE8DF] rounded-2xl p-5 shadow-2xs">
          <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">
            Total Appeals
          </span>
          <p className="font-serif text-2xl font-bold text-stone-900 mt-2">
            {totalCount}
          </p>
          <span className="text-[11px] text-stone-500 font-medium">Logged cases</span>
        </div>

        <div className="bg-white border border-[#EDE8DF] rounded-2xl p-5 shadow-2xs">
          <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 block">
            Pending Review
          </span>
          <p className="font-serif text-2xl font-bold text-amber-950 mt-2">
            {pendingCount}
          </p>
          <span className="text-[11px] text-amber-700 font-medium">Requires action</span>
        </div>

        <div className="bg-white border border-[#EDE8DF] rounded-2xl p-5 shadow-2xs">
          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 block">
            Approved
          </span>
          <p className="font-serif text-2xl font-bold text-emerald-950 mt-2">
            {approvedCount}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">Overturned</span>
        </div>

        <div className="bg-white border border-[#EDE8DF] rounded-2xl p-5 shadow-2xs">
          <span className="text-[10px] uppercase tracking-wider font-bold text-rose-600 block">
            Rejected
          </span>
          <p className="font-serif text-2xl font-bold text-rose-950 mt-2">
            {rejectedCount}
          </p>
          <span className="text-[11px] text-rose-700 font-medium">Upheld penalties</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#EDE8DF] rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search appeals by appellant, reason, details or ID..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#1A382B]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-700 focus:outline-none focus:border-[#1A382B]"
        >
          <option value="all">All Statuses ({totalCount})</option>
          <option value="pending">Pending ({pendingCount})</option>
          <option value="approved">Approved ({approvedCount})</option>
          <option value="rejected">Rejected ({rejectedCount})</option>
        </select>
      </div>

      {/* Appeals Table */}
      <div className="bg-white border border-[#EDE8DF] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="bg-[#FAF7F2] border-b border-[#EDE8DF]">
              <tr>
                <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Appellant
                </th>
                <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Appeal Reason
                </th>
                <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Target Report
                </th>
                <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Date
                </th>
                <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Status
                </th>
                <th className="text-right px-5 py-3.5 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE8DF]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-xs text-stone-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-stone-400 mb-2" />
                    Loading appeals queue...
                  </td>
                </tr>
              ) : filteredAppeals.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center">
                    <ShieldAlert className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-stone-700">No appeals found</p>
                    <p className="text-xs text-stone-400 mt-1">
                      {search ? 'Try adjusting your search criteria.' : 'The appeals queue is currently clear.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAppeals.map((appeal) => {
                  const appealId = appeal._id || appeal.id;
                  const appellantName =
                    typeof appeal.appellantId === 'object'
                      ? appeal.appellantId?.name || appeal.appellantName
                      : appeal.appellantName || 'User';
                  const appellantEmail =
                    typeof appeal.appellantId === 'object'
                      ? appeal.appellantId?.email
                      : '';
                  const report = appeal.reportId;
                  const reportItem =
                    report && typeof report === 'object'
                      ? report.item || report.reason || 'Content'
                      : `Report #${String(appeal.reportId).slice(-6)}`;

                  return (
                    <tr key={appealId} className="hover:bg-[#FAF7F2]/60 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#1A382B] text-white flex items-center justify-center font-bold text-[10px]">
                            {appellantName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 truncate">
                              {appellantName}
                            </p>
                            {appellantEmail && (
                              <p className="text-[10px] text-stone-400 truncate">
                                {appellantEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 max-w-[220px]">
                        <p className="text-xs font-semibold text-stone-800 truncate" title={appeal.reason}>
                          {appeal.reason}
                        </p>
                        {appeal.details && (
                          <p className="text-[11px] text-stone-500 truncate" title={appeal.details}>
                            {appeal.details}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 max-w-[180px]">
                        <span className="text-xs text-stone-700 truncate block font-medium" title={reportItem}>
                          {reportItem}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          #{String(appeal.reportId?._id || appeal.reportId).slice(-6)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-stone-500 whitespace-nowrap">
                        {appeal.createdAt
                          ? new Date(appeal.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '-'}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(appeal.status)}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedAppeal(appeal);
                            setReviewNotes(appeal.reviewNotes || '');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EDE8DF] text-xs font-semibold text-stone-700 hover:bg-[#FAF7F2] hover:text-[#1A382B] transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{appeal.status === 'pending' ? 'Review' : 'View'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDE8DF] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#EDE8DF] flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Appeal Review Portal
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-0.5">
                  Appeal #{String(selectedAppeal._id || selectedAppeal.id).slice(-8)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppeal(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Status & Appellant header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Appellant
                  </span>
                  <span className="text-sm font-bold text-stone-900">
                    {typeof selectedAppeal.appellantId === 'object'
                      ? selectedAppeal.appellantId?.name || selectedAppeal.appellantName
                      : selectedAppeal.appellantName || 'Anonymous'}
                  </span>
                  {typeof selectedAppeal.appellantId === 'object' && selectedAppeal.appellantId?.email && (
                    <span className="text-stone-500 block text-[11px]">
                      {selectedAppeal.appellantId.email}
                    </span>
                  )}
                </div>
                <div>{getStatusBadge(selectedAppeal.status)}</div>
              </div>

              {/* Appeal Reason & Details */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Appellant's Reason
                </span>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800">
                  {selectedAppeal.reason}
                </div>
              </div>

              {selectedAppeal.details && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Detailed Explanation & Arguments
                  </span>
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl leading-relaxed text-stone-700 whitespace-pre-wrap">
                    {selectedAppeal.details}
                  </div>
                </div>
              )}

              {/* Report Reference info */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Associated Original Report
                </span>
                <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-2">
                  {typeof selectedAppeal.reportId === 'object' && selectedAppeal.reportId ? (
                    <>
                      <div className="flex justify-between">
                        <strong className="text-amber-950">
                          {selectedAppeal.reportId.type || 'Content'} Report
                        </strong>
                        <span className="text-amber-700 font-mono text-[11px]">
                          ID: {selectedAppeal.reportId._id}
                        </span>
                      </div>
                      <p className="text-amber-900 font-medium">
                        Reported Item: {selectedAppeal.reportId.item || 'N/A'}
                      </p>
                      <p className="text-stone-600">
                        Reason: {selectedAppeal.reportId.reason || 'Flagged'}
                      </p>
                      {selectedAppeal.reportId.description && (
                        <p className="text-stone-500 italic text-[11px]">
                          "{selectedAppeal.reportId.description}"
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-stone-600 font-mono">
                      Report ID: {String(selectedAppeal.reportId)}
                    </p>
                  )}
                </div>
              </div>

              {/* Review Notes Input */}
              <div className="space-y-1.5 pt-2 border-t border-[#EDE8DF]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Administrator Review Notes
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter explanatory notes for this decision (visible to appellant)..."
                  className="w-full p-3 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#1A382B]"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-[#EDE8DF] bg-[#FAF7F2] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedAppeal(null)}
                className="px-4 py-2 border border-[#EDE8DF] rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => handleReviewAppeal('rejected')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Appeal</span>
                </button>

                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => handleReviewAppeal('approved')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Appeal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppealsManagement;
