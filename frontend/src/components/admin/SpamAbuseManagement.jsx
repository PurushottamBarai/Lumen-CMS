import React, { useState, useEffect } from 'react';
import { spamAbuseAPI, userAPI, commentAPI } from '../../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  RefreshCw,
  UserX,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ExternalLink,
  Sliders,
  ChevronRight,
} from 'lucide-react';

const SpamAbuseManagement = () => {
  // Sub-tabs: 'reports' | 'comment_analyzer' | 'user_inspector'
  const [activeSubTab, setActiveSubTab] = useState('reports');

  // General state
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ==========================================
  // PENDING REPORTS
  // ==========================================
  const [pendingReports, setPendingReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const fetchPendingReports = async () => {
    setLoadingReports(true);
    setError('');
    try {
      const res = await spamAbuseAPI.getPendingReports();
      if (res.data?.success && Array.isArray(res.data.reports)) {
        setPendingReports(res.data.reports);
      } else {
        setPendingReports([]);
      }
    } catch (err) {
      console.error('[SpamAbuse] Failed to load pending abuse reports:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load pending abuse reports from spam service.'
      );
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchPendingReports();
  }, []);

  // ==========================================
  // COMMENT SPAM ANALYZER
  // ==========================================
  const [commentIdInput, setCommentIdInput] = useState('');
  const [analyzingComment, setAnalyzingComment] = useState(false);
  const [commentSpamResult, setCommentSpamResult] = useState(null);

  const handleCheckCommentSpam = async (idToCheck = null) => {
    const id = idToCheck || commentIdInput.trim();
    if (!id) {
      setError('Please provide a Comment ID to analyze.');
      return;
    }

    setAnalyzingComment(true);
    setError('');
    setCommentSpamResult(null);
    try {
      const res = await spamAbuseAPI.checkCommentSpam(id);
      if (res.data?.success) {
        setCommentSpamResult(res.data);
      } else {
        setError(res.data?.message || 'Failed to analyze comment for spam.');
      }
    } catch (err) {
      console.error('[SpamAbuse] Comment check error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to check comment. Ensure the Comment ID exists.'
      );
    } finally {
      setAnalyzingComment(false);
    }
  };

  // ==========================================
  // USER ACTIVITY INSPECTOR & RESTRICTION
  // ==========================================
  const [userIdInput, setUserIdInput] = useState('');
  const [checkingUser, setCheckingUser] = useState(false);
  const [userActivityResult, setUserActivityResult] = useState(null);
  const [userComments, setUserComments] = useState([]);
  const [loadingUserComments, setLoadingUserComments] = useState(false);

  // Restrict user modal state
  const [showRestrictModal, setShowRestrictModal] = useState(false);
  const [restrictUserId, setRestrictUserId] = useState('');
  const [restrictReason, setRestrictReason] = useState('');
  const [restrictingUser, setRestrictingUser] = useState(false);

  const handleCheckUserActivity = async (idToCheck = null) => {
    const id = idToCheck || userIdInput.trim();
    if (!id) {
      setError('Please provide a User ID to inspect.');
      return;
    }

    setCheckingUser(true);
    setError('');
    setUserActivityResult(null);
    try {
      const res = await spamAbuseAPI.checkUserActivity(id);
      if (res.data?.success) {
        setUserActivityResult(res.data);
      } else {
        setError(res.data?.message || 'Failed to check user activity.');
      }
    } catch (err) {
      console.error('[SpamAbuse] User activity check error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to check user activity. Ensure the User ID is valid.'
      );
    } finally {
      setCheckingUser(false);
    }
  };

  const handleFetchUserComments = async (idToFetch = null) => {
    const id = idToFetch || userIdInput.trim();
    if (!id) return;

    setLoadingUserComments(true);
    try {
      const res = await spamAbuseAPI.getUserCommentActivity(id);
      if (res.data?.success && Array.isArray(res.data.comments)) {
        setUserComments(res.data.comments);
      } else {
        setUserComments([]);
      }
    } catch (err) {
      console.error('[SpamAbuse] User comments fetch error:', err);
      setUserComments([]);
    } finally {
      setLoadingUserComments(false);
    }
  };

  const handleOpenRestrictModal = (id) => {
    setRestrictUserId(id);
    setRestrictReason('Repeated suspicious spam activity and platform abuse');
    setShowRestrictModal(true);
  };

  const handleConfirmRestrictUser = async () => {
    if (!restrictUserId) return;

    setRestrictingUser(true);
    setError('');
    try {
      const res = await spamAbuseAPI.restrictUser(restrictUserId, {
        reason: restrictReason.trim() || 'Restricted due to suspicious activity',
      });

      if (res.data?.success) {
        setSuccessMsg(
          `User ${res.data.user?.name || restrictUserId} has been restricted successfully.`
        );
        setShowRestrictModal(false);
        setRestrictUserId('');
        // Re-check activity if currently viewing that user
        if (userIdInput === restrictUserId) {
          handleCheckUserActivity(restrictUserId);
        }
      } else {
        setError(res.data?.message || 'Failed to restrict user.');
      }
    } catch (err) {
      console.error('[SpamAbuse] Restrict user error:', err);
      setError(
        err.response?.data?.message || 'Failed to apply user restriction.'
      );
    } finally {
      setRestrictingUser(false);
    }
  };

  const getRiskLevelBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            High Risk
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Medium Risk
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Low Risk
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
            Spam & Abuse Intelligence Center
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Automated link & keyword heuristics, rapid-fire rate limiting, and suspicious contributor restriction.
          </p>
        </div>

        <button
          onClick={fetchPendingReports}
          disabled={loadingReports}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-[#EDE8DF] rounded-xl transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
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

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EDE8DF]">
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'reports'
              ? 'border-[#1A382B] text-[#1A382B]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Pending Abuse Reports ({pendingReports.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('comment_analyzer')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'comment_analyzer'
              ? 'border-[#1A382B] text-[#1A382B]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comment Spam Scanner</span>
        </button>

        <button
          onClick={() => setActiveSubTab('user_inspector')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'user_inspector'
              ? 'border-[#1A382B] text-[#1A382B]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <UserX className="w-4 h-4" />
          <span>User Velocity & Restriction</span>
        </button>
      </div>

      {/* ================================================= */}
      {/* SUBTAB 1: PENDING ABUSE REPORTS */}
      {/* ================================================= */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#EDE8DF] rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-[#FAF7F2] border-b border-[#EDE8DF]">
                  <tr>
                    <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                      Target Item
                    </th>
                    <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                      Report Reason
                    </th>
                    <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                      Reported By
                    </th>
                    <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                      Date
                    </th>
                    <th className="text-right px-5 py-3.5 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                      Quick Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE8DF]">
                  {loadingReports ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-12 text-center text-xs text-stone-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-stone-400 mb-2" />
                        Loading pending abuse reports...
                      </td>
                    </tr>
                  ) : pendingReports.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-12 text-center">
                        <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-bold text-stone-800">All clear!</p>
                        <p className="text-xs text-stone-400 mt-1">
                          No pending abuse reports found requiring moderation.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pendingReports.map((report) => {
                      const reportId = report._id || report.id;
                      const reporterName =
                        typeof report.reportedBy === 'object'
                          ? report.reportedBy?.name || 'User'
                          : report.reportedBy || 'User';

                      return (
                        <tr key={reportId} className="hover:bg-[#FAF7F2]/60 transition">
                          <td className="px-5 py-4 max-w-[220px]">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                                {report.type || 'Content'}
                              </span>
                              <span className="text-xs font-bold text-stone-900 truncate" title={report.item}>
                                {report.item}
                              </span>
                            </div>
                            {report.targetId && (
                              <span className="text-[10px] text-stone-400 font-mono block mt-0.5">
                                Target ID: {report.targetId}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 max-w-[220px]">
                            <p className="text-xs font-semibold text-rose-700 truncate">
                              {report.reason}
                            </p>
                            {report.description && (
                              <p className="text-[11px] text-stone-500 truncate" title={report.description}>
                                {report.description}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-xs text-stone-700 whitespace-nowrap">
                            <span className="font-medium">{reporterName}</span>
                            {report.reporterId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setUserIdInput(String(report.reporterId));
                                  setActiveSubTab('user_inspector');
                                  handleCheckUserActivity(String(report.reporterId));
                                }}
                                className="block text-[10px] text-stone-400 hover:text-[#1A382B] underline"
                              >
                                Check user velocity
                              </button>
                            )}
                          </td>

                          <td className="px-5 py-4 text-xs text-stone-500 whitespace-nowrap">
                            {report.createdAt
                              ? new Date(report.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '-'}
                          </td>

                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {report.type?.toLowerCase() === 'comment' && report.targetId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCommentIdInput(String(report.targetId));
                                    setActiveSubTab('comment_analyzer');
                                    handleCheckCommentSpam(String(report.targetId));
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
                                >
                                  Spam Scan
                                </button>
                              )}
                              {report.reporterId && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRestrictModal(String(report.reporterId))}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                                >
                                  Restrict
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* SUBTAB 2: COMMENT SPAM SCANNER */}
      {/* ================================================= */}
      {activeSubTab === 'comment_analyzer' && (
        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Heuristic Comment Spam Scanner
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Checks comments against suspicious hyperlink regular expressions, commercial promotion patterns, and rapid-fire duplicate postings.
            </p>
          </div>

          {/* Input Box */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={commentIdInput}
                onChange={(e) => setCommentIdInput(e.target.value)}
                placeholder="Enter Comment ID to scan (e.g. 66c9f1a00000000000000001)..."
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#1A382B]"
              />
            </div>
            <button
              type="button"
              disabled={analyzingComment || !commentIdInput.trim()}
              onClick={() => handleCheckCommentSpam()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1A382B] text-white text-xs font-bold rounded-xl hover:bg-[#11261D] transition disabled:opacity-50"
            >
              {analyzingComment ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Run Spam Heuristic</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Results Display */}
          {commentSpamResult && (
            <div className="p-6 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD3] pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Analysis Target
                  </span>
                  <span className="font-mono text-xs font-bold text-stone-900">
                    Comment ID: {commentSpamResult.commentId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getRiskLevelBadge(commentSpamResult.riskLevel)}
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      commentSpamResult.isSpam
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {commentSpamResult.isSpam ? 'SPAM DETECTED' : 'CLEAN / LEGITIMATE'}
                  </span>
                </div>
              </div>

              {/* Risk Score Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-stone-700">
                  <span>Calculated Risk Score</span>
                  <span className="font-mono">{commentSpamResult.riskScore} / 100</span>
                </div>
                <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      commentSpamResult.riskScore >= 70
                        ? 'bg-rose-600'
                        : commentSpamResult.riskScore >= 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, commentSpamResult.riskScore)}%` }}
                  />
                </div>
              </div>

              {/* Detected Reasons */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                  Detected Pattern Breakdown
                </span>
                {commentSpamResult.reasons?.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">
                    No malicious patterns, spam keywords, or repetitive flood submissions detected.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {commentSpamResult.reasons.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 bg-white border border-rose-200/80 rounded-xl text-xs text-rose-900 font-medium"
                      >
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* SUBTAB 3: USER VELOCITY & RESTRICTION */}
      {/* ================================================= */}
      {activeSubTab === 'user_inspector' && (
        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-stone-900">
              User Activity Velocity & Restriction Control
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Detects high-frequency flood commenting (≥10 in 10 mins) and report abuse (≥5 in 10 mins), and allows administrative account restriction.
            </p>
          </div>

          {/* User ID Input Box */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="Enter User ID (e.g. 66c9f1a00000000000000002)..."
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#1A382B]"
              />
            </div>
            <button
              type="button"
              disabled={checkingUser || !userIdInput.trim()}
              onClick={() => {
                handleCheckUserActivity();
                handleFetchUserComments();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1A382B] text-white text-xs font-bold rounded-xl hover:bg-[#11261D] transition disabled:opacity-50"
            >
              {checkingUser ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Inspect Activity</span>
                </>
              )}
            </button>
          </div>

          {/* Activity Result Card */}
          {userActivityResult && (
            <div className="p-6 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD3] pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Inspected User
                  </span>
                  <span className="font-mono text-xs font-bold text-stone-900">
                    ID: {userActivityResult.userId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getRiskLevelBadge(userActivityResult.riskLevel)}
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      userActivityResult.suspicious
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {userActivityResult.suspicious ? 'SUSPICIOUS VELOCITY' : 'NORMAL ACTIVITY'}
                  </span>
                </div>
              </div>

              {/* Velocity Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white rounded-xl border border-[#EDE8DF] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Comments (Last 10 min)
                  </span>
                  <p className="font-serif text-2xl font-bold text-stone-900">
                    {userActivityResult.commentsLast10Minutes}
                  </p>
                  <span className="text-[10px] text-stone-400">Threshold: ≥ 10 is high velocity</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#EDE8DF] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Reports (Last 10 min)
                  </span>
                  <p className="font-serif text-2xl font-bold text-stone-900">
                    {userActivityResult.reportsLast10Minutes}
                  </p>
                  <span className="text-[10px] text-stone-400">Threshold: ≥ 5 is report abuse</span>
                </div>

                <div className="col-span-2 sm:col-span-1 p-4 bg-white rounded-xl border border-[#EDE8DF] space-y-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Total Velocity Risk
                    </span>
                    <p className="font-serif text-2xl font-bold text-stone-900">
                      {userActivityResult.riskScore} pts
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenRestrictModal(userActivityResult.userId)}
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Restrict User</span>
                  </button>
                </div>
              </div>

              {/* Reasons */}
              {userActivityResult.reasons?.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                    Triggered Velocity Flags
                  </span>
                  {userActivityResult.reasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white border border-rose-200 rounded-xl text-xs text-rose-900 font-medium flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* User Recent Comments */}
              <div className="pt-3 border-t border-[#E2DDD3] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">
                    Recent User Comments ({userComments.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFetchUserComments(userActivityResult.userId)}
                    disabled={loadingUserComments}
                    className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingUserComments ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {userComments.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No recent comments logged for this user.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {userComments.map((c) => {
                      const cId = c._id || c.id;
                      return (
                        <div
                          key={cId}
                          className="p-3 bg-white border border-[#EDE8DF] rounded-xl text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-stone-400 text-[10px]">
                            <span>Comment #{String(cId).slice(-6)}</span>
                            <span>{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-stone-800">{c.content}</p>
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setCommentIdInput(String(cId));
                                setActiveSubTab('comment_analyzer');
                                handleCheckCommentSpam(String(cId));
                              }}
                              className="text-[10px] text-amber-700 hover:underline font-bold"
                            >
                              Scan this comment →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Restrict Confirmation Modal */}
      {showRestrictModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDE8DF] rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#EDE8DF] pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <UserX className="w-5 h-5" />
                <h3 className="font-serif text-lg text-stone-900">Confirm User Restriction</h3>
              </div>
              <button
                onClick={() => setShowRestrictModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Restricting user <strong className="font-mono text-stone-900">{restrictUserId}</strong> will flag their account as restricted and log the violation in system moderation logs.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-800">
                Mandatory Restriction Reason
              </label>
              <textarea
                rows={3}
                value={restrictReason}
                onChange={(e) => setRestrictReason(e.target.value)}
                placeholder="Explain the specific pattern of abuse, excessive spam, or policy violation..."
                className="w-full p-3 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-rose-600"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRestrictModal(false)}
                className="px-4 py-2 border border-[#EDE8DF] rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={restrictingUser || !restrictReason.trim()}
                onClick={handleConfirmRestrictUser}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                {restrictingUser ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restricting...</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    <span>Confirm & Restrict User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpamAbuseManagement;
