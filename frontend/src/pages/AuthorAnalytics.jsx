import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authorAnalyticsAPI } from '../services/api';
import AuthorPerformanceCard from '../components/analytics/AuthorPerformanceCard';
import EngagementChart from '../components/analytics/EngagementChart';
import DetailedAnalyticsTable from '../components/analytics/DetailedAnalyticsTable';
import {
  BarChart3,
  Calendar,
  Sparkles,
  TrendingUp,
  BookOpen,
  Award,
  RefreshCw,
  Eye,
  Heart,
  Share2,
  Percent,
  CheckCircle,
} from 'lucide-react';

const AuthorAnalytics = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState('all');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async (tf = timeframe) => {
    try {
      setLoading(true);
      setError('');
      const res = await authorAnalyticsAPI.getMyAnalytics({ timeframe: tf });
      if (res.data?.success && res.data?.data) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
      setError('Failed to fetch author analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe]);

  const handleTimeframeChange = (tf) => {
    setTimeframe(tf);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Top Header & Timeframe Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1 border border-blue-100">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Author Intelligence Hub</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Author Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-xl">
            In-depth readership metrics, audience engagement rates, content velocity, and editorial intelligence.
          </p>
        </div>

        {/* Timeframe Selector Pills */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <span className="text-xs text-stone-400 font-medium mr-1 hidden sm:inline">
            <Calendar className="w-3.5 h-3.5 inline mr-1" />
            Timeframe:
          </span>
          {[
            { id: 'all', label: 'All Time' },
            { id: '30d', label: 'Last 30 Days' },
            { id: '7d', label: 'Last 7 Days' },
            { id: 'year', label: 'This Year' },
          ].map((tf) => {
            const isActive = timeframe === tf.id;
            return (
              <button
                key={tf.id}
                onClick={() => handleTimeframeChange(tf.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#1A382B] text-white shadow-xs'
                    : 'bg-[#FAF7F2] hover:bg-[#F2ECE1] text-stone-700 border border-[#EDE8DF]'
                }`}
              >
                {tf.label}
              </button>
            );
          })}

          <button
            onClick={() => fetchAnalytics(timeframe)}
            className="p-2 text-stone-500 hover:text-stone-800 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl hover:bg-[#F2ECE1] transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Stitch Design Component */}
      <AuthorPerformanceCard
        initialData={analytics}
        showFullHubLink={false}
      />

      {/* Deep-Dive Grid: Readership Velocity Chart & Popular Topics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Readership Velocity Chart (8 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F5F2EB]">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1A382B]" />
                Readership &amp; Engagement Velocity
              </h3>
              <p className="text-xs text-stone-500">
                Monthly audience reach and engagement conversion trend
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Active Growth
            </span>
          </div>

          <EngagementChart data={analytics?.trendHistory || []} />
        </div>

        {/* Popular Topics & Audience Focus (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="pb-3 border-b border-[#F5F2EB]">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-700" />
              Audience Topic Dominance
            </h3>
            <p className="text-xs text-stone-500">
              Most engaging themes across published editorial works
            </p>
          </div>

          <div className="space-y-4">
            {(analytics?.popularTopics || []).map((topic, i) => {
              const barColors = [
                'bg-blue-600',
                'bg-indigo-600',
                'bg-emerald-600',
                'bg-amber-600',
                'bg-purple-600',
              ];
              const barColor = barColors[i % barColors.length];

              return (
                <div key={topic.name || i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${barColor}`} />
                      {topic.name}
                    </span>
                    <span className="font-mono text-stone-600">
                      {topic.percentage}% ({topic.count} {topic.count === 1 ? 'article' : 'articles'})
                    </span>
                  </div>
                  <div className="w-full bg-[#FAF7F2] border border-[#EDE8DF] h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(8, topic.percentage)}%` }}
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#EDE8DF] text-[11px] text-stone-600 space-y-1">
            <div className="font-bold text-stone-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Topic Optimization Insight
            </div>
            <p>
              Articles written in your top topics receive 2.4x higher like ratios and 3.1x more citations compared to general categories.
            </p>
          </div>
        </div>
      </div>

      {/* Full Article-by-Article Performance Table */}
      <DetailedAnalyticsTable
        articles={analytics?.articles || []}
        onShareSuccess={() => fetchAnalytics(timeframe)}
      />
    </div>
  );
};

export default AuthorAnalytics;
