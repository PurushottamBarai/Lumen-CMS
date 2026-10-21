import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Award,
  AlertTriangle,
  TrendingUp,
  History,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import TrustBadge, { calculateTrustLevel } from './TrustBadge';
import { trustAPI } from '../../services/api';

const EVENT_LABELS = {
  ARTICLE_APPROVED: { label: 'Article Approved & Published', color: 'text-emerald-700 bg-emerald-50' },
  ARTICLE_REJECTED_VIOLATION: { label: 'Article Rejected (Policy)', color: 'text-rose-700 bg-rose-50' },
  COMMENT_MODERATED_DELETE: { label: 'Comment Removed by Moderator', color: 'text-rose-700 bg-rose-50' },
  HELPFUL_REACTION_RECEIVED: { label: 'Community Helpful Reaction', color: 'text-blue-700 bg-blue-50' },
  QUIZ_COMPLETED: { label: 'Knowledge Quiz Completed', color: 'text-teal-700 bg-teal-50' },
  ADMIN_MANUAL_ADJUSTMENT: { label: 'Admin Trust Adjustment', color: 'text-purple-700 bg-purple-50' },
  REPORT_CONFIRMED_PENALTY: { label: 'Confirmed Community Report', color: 'text-red-700 bg-red-50' },
  SYSTEM_RESET: { label: 'System Baseline Reset', color: 'text-stone-700 bg-stone-50' },
};

const TrustScoreCard = ({ initialUser = null }) => {
  const [profileData, setProfileData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState('');

  const fetchTrustData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await trustAPI.getMyTrustProfile();
      if (res.data?.success) {
        setProfileData(res.data.data.user);
        setHistory(res.data.data.history || []);
      }
    } catch (err) {
      console.error('[TrustScoreCard] Error fetching trust profile:', err);
      // Fallback to initialUser
      if (initialUser) {
        setProfileData(initialUser);
      }
      setError('Could not load real-time trust audit log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrustData();
  }, []);

  const user = profileData || initialUser || {};
  const score = typeof user.trustScore === 'number' ? user.trustScore : 50;
  const level = user.trustLevel || calculateTrustLevel(score);
  const positiveCount = user.positiveContributionsCount || 0;
  const violationsCount = user.violationsCount || 0;

  // Percentage for progress bar (0 - 100)
  const scorePercent = Math.max(0, Math.min(100, score));

  const getProgressColor = () => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-teal-600';
    if (score >= 60) return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    if (score >= 35) return 'bg-gradient-to-r from-amber-500 to-stone-600';
    return 'bg-gradient-to-r from-rose-500 to-red-600';
  };

  return (
    <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F2EDE4] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#EDE8DF] flex items-center justify-center text-[#1A382B]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Trust & Community Standing
              </h3>
              <TrustBadge score={score} level={level} size="sm" />
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Reflects your verified contributions, community feedback, and platform adherence.
            </p>
          </div>
        </div>

        <button
          onClick={fetchTrustData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-[#FAF7F2] hover:bg-[#F2EDE4] rounded-xl border border-[#EDE8DF] transition self-start sm:self-auto"
          title="Refresh Trust Metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Score & Progress Bar */}
      <div className="space-y-3 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-5">
        <div className="flex items-baseline justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Current Trust Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl sm:text-4xl font-black text-stone-900">
                {score}
              </span>
              <span className="text-sm font-medium text-stone-500">/ 100</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">
              Standing Tier
            </span>
            <span className="text-sm font-bold capitalize text-stone-800">
              {level} Tier
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-3 bg-stone-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ease-out ${getProgressColor()}`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>

        {/* Tier scale ticks */}
        <div className="flex justify-between text-[10px] text-stone-600 font-bold pt-1 px-1">
          <span>0 (Restricted)</span>
          <span>35 (Neutral)</span>
          <span>60 (Trusted)</span>
          <span>80+ (Exemplary)</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Positive Actions</span>
          </div>
          <p className="font-serif text-2xl font-bold text-emerald-950">
            {positiveCount}
          </p>
          <p className="text-[11px] text-emerald-800 font-medium">Articles, helpful votes, quizzes</p>
        </div>

        <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-rose-800 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Policy Violations</span>
          </div>
          <p className="font-serif text-2xl font-bold text-rose-950">
            {violationsCount}
          </p>
          <p className="text-[11px] text-rose-800 font-medium">Moderated content & warnings</p>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-purple-800 text-xs font-bold">
            <Award className="w-4 h-4 text-purple-600" />
            <span>Standing Status</span>
          </div>
          <p className="font-serif text-lg font-bold text-purple-950 capitalize truncate">
            {level === 'exemplary' ? 'Top Contributor' : level === 'trusted' ? 'Good Standing' : level === 'neutral' ? 'Standard' : 'Action Required'}
          </p>
          <p className="text-[11px] text-purple-800 font-medium">Autonomous tier calculation</p>
        </div>
      </div>

      {/* Toggles: Rules & Audit Log */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={() => setShowRules(!showRules)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#1A382B] bg-[#FAF7F2] hover:bg-[#EFECE6] border border-[#EDE8DF] rounded-xl transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>How Trust Score Works</span>
          {showRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-stone-700 bg-[#FAF7F2] hover:bg-[#EFECE6] border border-[#EDE8DF] rounded-xl transition"
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Trail ({history.length} events)</span>
          {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Trust Rules Guide Dropdown */}
      {showRules && (
        <div className="p-5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl space-y-3 text-xs text-stone-700">
          <h4 className="font-serif font-bold text-stone-900 text-sm">
            Reputation Points Breakdown
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5 p-3 bg-white rounded-xl border border-emerald-200">
              <span className="font-bold text-emerald-800 block">⭐ How to Earn Points:</span>
              <ul className="space-y-1 text-stone-600 list-disc list-inside">
                <li><strong className="text-emerald-700">+10 pts:</strong> Published & approved article</li>
                <li><strong className="text-emerald-700">+2 pts:</strong> Helpful community reaction on your discussion</li>
                <li><strong className="text-emerald-700">+2 pts:</strong> Passing an educational knowledge quiz</li>
              </ul>
            </div>
            <div className="space-y-1.5 p-3 bg-white rounded-xl border border-rose-200">
              <span className="font-bold text-rose-800 block">⚠️ How Penalties are Applied:</span>
              <ul className="space-y-1 text-stone-600 list-disc list-inside">
                <li><strong className="text-rose-700">-10 pts:</strong> Article rejected for policy or plagiarism violation</li>
                <li><strong className="text-rose-700">-5 pts:</strong> Comment removed by administrator moderation</li>
                <li><strong className="text-rose-700">-15 pts:</strong> Confirmed violation from community report</li>
              </ul>
            </div>
          </div>
          <p className="text-[11px] text-stone-500 italic">
            * All trust score updates are strictly controlled by the backend and audited with immutable cryptographic logs.
          </p>
        </div>
      )}

      {/* Audit History Stream */}
      {showHistory && (
        <div className="space-y-3 pt-2">
          <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
            <History className="w-4 h-4 text-stone-500" />
            Recent Reputation Events
          </h4>

          {history.length === 0 ? (
            <div className="p-6 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl text-center text-xs text-stone-500">
              No reputation events recorded yet. Your account is in good baseline standing.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {history.map((item) => {
                const isPositive = item.delta > 0;
                const isZero = item.delta === 0;
                const config = EVENT_LABELS[item.eventType] || {
                  label: item.eventType,
                  color: 'text-stone-700 bg-stone-50',
                };

                return (
                  <div
                    key={item._id || item.id}
                    className="p-3.5 bg-white border border-[#EDE8DF] rounded-xl flex items-center justify-between gap-4 text-xs shadow-2xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-stone-400 text-[11px]">
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-stone-700 truncate font-normal">
                        {item.reason}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isPositive
                            ? 'text-emerald-600'
                            : isZero
                            ? 'text-stone-500'
                            : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+${item.delta}` : item.delta} pts
                      </span>
                      <span className="block text-[10px] text-stone-400">
                        {item.previousScore} → {item.newScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrustScoreCard;
