import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appealAPI, reportAPI } from '../services/api';
import {
  ShieldAlert,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Info,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

const COMMON_REASONS = [
  'Content was flagged incorrectly and adheres to guidelines',
  'Context or educational value was misunderstood',
  'Report was filed in bad faith or without merit',
  'Issues mentioned in the report have been corrected',
  'Copyright fair use / proper attribution was provided',
  'Other reason (specified in details below)',
];

const Appeals = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab: 'my' | 'submit'
  const initialTab = searchParams.get('tab') === 'submit' ? 'submit' : 'my';
  const [activeTab, setActiveTab] = useState(initialTab);

  // My Appeals state
  const [appeals, setAppeals] = useState([]);
  const [loadingAppeals, setLoadingAppeals] = useState(true);
  const [appealsError, setAppealsError] = useState('');

  // Submit form state
  const initialReportId = searchParams.get('reportId') || '';
  const [reportId, setReportId] = useState(initialReportId);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Optional: available reports for helper selection
  const [userReports, setUserReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Switch tab helper
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setSearchParams(
      tab === 'submit'
        ? reportId
          ? { tab: 'submit', reportId }
          : { tab: 'submit' }
        : { tab: 'my' }
    );
  };

  // Fetch logged-in user's appeals
  const fetchMyAppeals = async () => {
    setLoadingAppeals(true);
    setAppealsError('');
    try {
      const res = await appealAPI.getMyAppeals();
      if (res.data?.success) {
        setAppeals(Array.isArray(res.data.appeals) ? res.data.appeals : []);
      } else {
        setAppealsError('Failed to fetch your appeals.');
      }
    } catch (err) {
      console.error('[Appeals] Fetch my appeals error:', err);
      setAppealsError(
        err.response?.data?.message ||
          'Unable to load your appeals. Please check your connection and try again.'
      );
    } finally {
      setLoadingAppeals(false);
    }
  };

  // Optionally load existing reports so user can pick one easily
  const fetchRecentReports = async () => {
    try {
      setLoadingReports(true);
      const res = await reportAPI.getReports();
      if (res.data?.success && Array.isArray(res.data.reports)) {
        setUserReports(res.data.reports.slice(0, 10));
      }
    } catch (err) {
      // Non-critical helper, ignore error
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyAppeals();
      fetchRecentReports();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const urlReportId = searchParams.get('reportId');
    if (urlReportId) {
      setReportId(urlReportId);
      setActiveTab('submit');
    }
  }, [searchParams]);

  // Handle appeal submission
  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    const finalReason =
      reason === 'Other reason (specified in details below)'
        ? customReason.trim() || 'Other'
        : reason.trim();

    // Validation
    if (!reportId.trim()) {
      setSubmitError('Please provide a valid Report ID for the content you are appealing.');
      return;
    }

    if (!finalReason) {
      setSubmitError('Please select or specify a reason for your appeal.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reportId: reportId.trim(),
        reason: finalReason,
        details: details.trim(),
      };

      const res = await appealAPI.createAppeal(payload);

      if (res.data?.success) {
        setSubmitSuccess(
          res.data.message || 'Appeal submitted successfully! An administrator will review your case.'
        );
        // Clear form
        setReportId('');
        setReason('');
        setCustomReason('');
        setDetails('');

        // Refresh list and optionally switch after delay
        fetchMyAppeals();
      } else {
        setSubmitError(res.data?.message || 'Failed to submit appeal.');
      }
    } catch (err) {
      console.error('[Appeals] Submit appeal error:', err);
      setSubmitError(
        err.response?.data?.message ||
          'Failed to submit appeal. Please verify the Report ID and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDE8DF] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#FAF7F2] border border-[#EDE8DF] rounded-full text-xs font-semibold text-stone-700 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-[#1A382B]" />
            Community Moderation & Fairness
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Report Appeals Center
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            If your article, comment, or contribution was reported or moderated, you have the right to request a formal editorial review.
          </p>
        </div>

        {/* Action / Refresh */}
        <div className="flex items-center gap-2">
          {activeTab === 'my' ? (
            <button
              onClick={fetchMyAppeals}
              disabled={loadingAppeals}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-[#EDE8DF] rounded-xl transition"
              title="Refresh Appeals"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAppeals ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          ) : null}
          <button
            onClick={() => handleTabSwitch(activeTab === 'my' ? 'submit' : 'my')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A382B] text-white hover:bg-[#11261D] text-xs font-bold rounded-xl shadow-xs transition"
          >
            {activeTab === 'my' ? (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Submit New Appeal</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>View My Appeals</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EDE8DF]">
        <button
          onClick={() => handleTabSwitch('my')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === 'my'
              ? 'border-[#1A382B] text-[#1A382B]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          My Appeals {appeals.length > 0 ? `(${appeals.length})` : ''}
        </button>
        <button
          onClick={() => handleTabSwitch('submit')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === 'submit'
              ? 'border-[#1A382B] text-[#1A382B]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Submit Appeal
        </button>
      </div>

      {/* ================================================= */}
      {/* TAB 1: MY APPEALS LIST */}
      {/* ================================================= */}
      {activeTab === 'my' && (
        <div className="space-y-6">
          {/* Error Banner */}
          {appealsError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{appealsError}</span>
              </div>
              <button
                onClick={fetchMyAppeals}
                className="underline font-bold text-rose-900 hover:opacity-80"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loadingAppeals && (
            <div className="bg-white border border-[#EDE8DF] rounded-3xl p-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-stone-400 animate-spin mx-auto" />
              <p className="text-xs text-stone-500 font-medium">
                Loading your submitted appeals...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loadingAppeals && appeals.length === 0 && !appealsError && (
            <div className="bg-white border border-[#EDE8DF] rounded-3xl p-10 sm:p-14 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#EDE8DF] flex items-center justify-center text-stone-400 mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                No Appeals Filed
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                You haven't submitted any appeals yet. If any of your published pieces or comments receive an adverse moderation decision, you can submit an appeal here for review.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => handleTabSwitch('submit')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A382B] text-white text-xs font-bold rounded-xl hover:bg-[#11261D] transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Submit an Appeal</span>
                </button>
              </div>
            </div>
          )}

          {/* Appeals List */}
          {!loadingAppeals && appeals.length > 0 && (
            <div className="space-y-4">
              {appeals.map((appeal) => {
                const appealId = appeal._id || appeal.id;
                const report = appeal.reportId;
                const hasReportObject = report && typeof report === 'object';
                const reviewed = appeal.status !== 'pending';

                return (
                  <div
                    key={appealId}
                    className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5"
                  >
                    {/* Appeal Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F5F2EB] pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-stone-400">
                            Appeal #{String(appealId).slice(-6)}
                          </span>
                          <span className="text-stone-300">•</span>
                          <span className="text-xs text-stone-500">
                            Submitted on{' '}
                            {new Date(appeal.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-stone-900">
                          {appeal.reason}
                        </h3>
                      </div>
                      <div>{getStatusBadge(appeal.status)}</div>
                    </div>

                    {/* Details section */}
                    {appeal.details && (
                      <div className="bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-4 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Your Explanation & Case
                        </span>
                        <p className="text-xs text-stone-700 leading-relaxed font-normal">
                          {appeal.details}
                        </p>
                      </div>
                    )}

                    {/* Associated Report Details */}
                    {hasReportObject ? (
                      <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-2 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-stone-400" />
                          Associated Report Reference ({report.type || 'Content'})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                          <div>
                            <strong className="text-stone-800">Target Item: </strong>
                            <span>{report.item || 'Content item'}</span>
                          </div>
                          <div>
                            <strong className="text-stone-800">Report Reason: </strong>
                            <span>{report.reason || 'Flagged by community'}</span>
                          </div>
                        </div>
                        {report.description && (
                          <p className="text-[11px] text-stone-500 italic mt-1">
                            "{report.description}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-stone-400">
                        Associated Report ID:{' '}
                        <span className="font-mono">{String(appeal.reportId)}</span>
                      </div>
                    )}

                    {/* Admin Review Feedback */}
                    {reviewed && (
                      <div
                        className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                          appeal.status === 'approved'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50/70 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            {appeal.status === 'approved' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-700" />
                            )}
                            Admin Review Decision: {appeal.status.toUpperCase()}
                          </span>
                          {appeal.reviewedAt && (
                            <span className="text-[11px] opacity-75">
                              {new Date(appeal.reviewedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        {appeal.reviewNotes ? (
                          <p className="leading-relaxed pl-5 font-normal">
                            {appeal.reviewNotes}
                          </p>
                        ) : (
                          <p className="italic pl-5 opacity-75 text-[11px]">
                            No written notes were attached to this review decision.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* TAB 2: SUBMIT APPEAL FORM */}
      {/* ================================================= */}
      {activeTab === 'submit' && (
        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Submit a Report Appeal
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Provide the reference ID of the report or flagged content and explain why this action should be reversed.
            </p>
          </div>

          {/* Success Banner */}
          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">{submitSuccess}</p>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('my')}
                  className="underline font-semibold hover:opacity-80 flex items-center gap-1 mt-1"
                >
                  <span>Go to My Appeals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {submitError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitAppeal} className="space-y-5">
            {/* Report Reference Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-800">
                Report Reference ID <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                placeholder="e.g. 66c9f1a00000000000000001 or report ID"
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#1A382B] focus:bg-white"
                required
              />
              <p className="text-[11px] text-stone-400">
                The identifier of the moderation report or removed content you are disputing.
              </p>

              {/* Quick Select helper from recent reports if any */}
              {userReports.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                    Or select from recent platform reports:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {userReports.slice(0, 4).map((r) => {
                      const rId = r._id || r.id;
                      return (
                        <button
                          key={rId}
                          type="button"
                          onClick={() => setReportId(String(rId))}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border text-left transition ${
                            reportId === String(rId)
                              ? 'bg-[#1A382B] text-white border-[#1A382B]'
                              : 'bg-[#FAF7F2] text-stone-700 border-[#EDE8DF] hover:bg-stone-100'
                          }`}
                        >
                          <span className="font-semibold truncate max-w-[150px] inline-block align-bottom">
                            {r.item || r.reason || `Report #${String(rId).slice(-4)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Appeal Reason Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-800">
                Reason for Appeal <span className="text-rose-600">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#1A382B] focus:bg-white"
                required
              >
                <option value="">-- Select a primary reason --</option>
                {COMMON_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom reason input if "Other" is chosen */}
            {reason === 'Other reason (specified in details below)' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  Specify Reason Headline <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Summarize the core reason for your appeal..."
                  className="w-full px-4 py-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#1A382B] focus:bg-white"
                  required
                />
              </div>
            )}

            {/* Explanation / Details */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-800">
                Detailed Explanation & Justification
              </label>
              <textarea
                rows={5}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide comprehensive details, references, and explanation for why the report decision should be reconsidered by the editorial team..."
                className="w-full p-4 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#1A382B] focus:bg-white resize-y"
              />
              <p className="text-[11px] text-stone-400">
                Clear and constructive context helps moderators process your review swiftly.
              </p>
            </div>

            {/* Appellant confirmation info */}
            <div className="p-3.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl flex items-center justify-between text-xs text-stone-600">
              <span>Submitting as:</span>
              <span className="font-bold text-stone-900">
                {user?.name} ({user?.email})
              </span>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleTabSwitch('my')}
                className="px-4 py-2.5 rounded-xl border border-[#EDE8DF] text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reportId.trim() || !reason}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1A382B] text-white text-xs font-bold rounded-xl hover:bg-[#11261D] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Appeal...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Appeal for Review</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Appeals;
