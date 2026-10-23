import RecommendationBadge from '../components/article/RecommendationBadge';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { articleAPI } from '../services/api';
import ForYouFeed from '../components/recommendations/ForYouFeed';
import {
  BookOpen,
  LayoutGrid,
  Search,
  PenLine,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  Filter,
  Eye,
  Clock,
  ThumbsUp,
  TrendingUp,
  Hash,
  Flame,
  Bookmark,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';

/**
 * Home Page View
 */
export const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [featuredArticles, setFeaturedArticles] = React.useState([]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchArticles = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "https://content-management-system-2-he9n.onrender.com/api";
        const res = await fetch(apiBase + "/articles");
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.articles) && data.articles.length >= 2) {
          setFeaturedArticles(data.articles.slice(0, 2));
        }
      } catch (err) {
        // Fallback to curated dispatches
      }
    };
    fetchArticles();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero Banner */}
      <div className="bg-white border border-[#EDE8DF] rounded-3xl p-8 sm:p-14 shadow-xs text-center space-y-6 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-full text-xs font-semibold text-stone-700">
          <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
          Editorial Content & Knowledge Platform
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight max-w-3xl mx-auto leading-tight">
          Where Thoughtful Writing Meets Interactive Knowledge
        </h1>

        <p className="text-xs sm:text-base text-stone-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Lumen is an editorial publishing platform designed for curious
          readers, subject matter authors, and editorial teams.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {isAuthenticated ? (
            <Link
              to="/profile"
              className="px-6 py-3 bg-[#1A382B] hover:bg-[#11261D] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <span>Go to My Profile ({user?.role})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-6 py-3 bg-[#1A382B] hover:bg-[#11261D] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/login"
                className="px-6 py-3 bg-[#EFECE6] hover:bg-[#E7E2D9] text-stone-800 text-xs sm:text-sm font-semibold rounded-xl transition"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
      {/* Editorial Tabs: Trending & For You (Lumen 2 Design) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>For You</span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Personalized dispatches curated for your reading interests
            </span>
          </div>
        </div>

        {/* Your Dynamic Recommendation Feed */}
        <ForYouFeed />
      </section>

      {/* Platform Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#1A382B] flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>

          <h2 className="font-serif text-lg font-bold text-stone-900">
            In-Depth Articles
          </h2>

          <p className="text-xs text-stone-600 leading-relaxed">
            Curated essays, technical deep-dives, and investigative science
            journalism written by domain experts.
          </p>
        </div>

        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#D97736] flex items-center justify-center font-bold">
            <PenLine className="w-5 h-5" />
          </div>

          <h2 className="font-serif text-lg font-bold text-stone-900">
            Interactive Knowledge
          </h2>

          <p className="text-xs text-stone-600 leading-relaxed">
            Test and consolidate your understanding with article-aligned
            quizzes and concept checkpoints.
          </p>
        </div>

        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>

          <h2 className="font-serif text-lg font-bold text-stone-900">
            Editorial Standards
          </h2>

          <p className="text-xs text-stone-600 leading-relaxed">
            Every submission undergoes rigorous peer review and editorial
            moderation before publication.
          </p>
        </div>
      </div>

      {/* AI Curated & Trending Dispatches (Features 9 & 10) */}
      <div className="space-y-6 pt-6 border-t border-[#EDE8DF]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Intelligent Discovery Engine</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              AI Curated &amp; Trending Dispatches
            </h2>
          </div>
          <Link
            to="/browse"
            className="text-xs font-bold text-[#1A382B] hover:underline flex items-center gap-1"
          >
            <span>Explore All Articles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredArticles.length >= 2 ? (
            featuredArticles.map((art, idx) => (
              <Link
                key={art._id || idx}
                to={'/browse/' + art._id}
                className="bg-white border border-[#EDE8DF] rounded-3xl p-6 shadow-xs space-y-3 hover:border-stone-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className={
                      'font-semibold px-2.5 py-0.5 rounded-full border ' +
                      (idx === 0
                        ? 'text-amber-800 bg-amber-50 border-amber-200'
                        : 'text-blue-800 bg-blue-50 border-blue-200')
                    }>
                      {idx === 0 ? 'Trending #1 • ' : 'Recommended • '} {art.category || 'Technology'}
                    </span>
                    <span className="font-mono text-stone-400">Score {idx === 0 ? '98.4' : '96.2'}</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-[#1A382B] transition-colors leading-snug">
                    {art.title}
                  </h3>
                  <RecommendationBadge
                    type={idx === 0 ? 'trending' : 'recommended'}
                    articleId={art._id}
                    category={art.category}
                  />
                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                    {art.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-[#F5F2EB] flex items-center justify-between text-xs text-stone-500">
                  <span>By {art.author?.name || 'Editorial Author'}</span>
                  <span className="text-[#1A382B] font-bold group-hover:underline flex items-center gap-1">
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <>
              <Link
                to="/browse"
                className="bg-white border border-[#EDE8DF] rounded-3xl p-6 shadow-xs space-y-3 hover:border-stone-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Trending #1 • Technology
                    </span>
                    <span className="font-mono text-stone-400">Score 98.4</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-[#1A382B] transition-colors leading-snug">
                    Architecting Resilient Event Streams with Distributed Kafka Clusters
                  </h3>
                  <RecommendationBadge
                    type="trending"
                    customText="High engagement velocity from systems engineers with 1.8k saves in 48 hours."
                  />
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Explore fault-tolerant partition strategies, KRaft quorum consensus, and end-to-end zero message loss semantics.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#F5F2EB] flex items-center justify-between text-xs text-stone-500">
                  <span>Curated Dispatch</span>
                  <span className="text-[#1A382B] font-bold group-hover:underline flex items-center gap-1">
                    <span>Browse Articles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>

              <Link
                to="/browse"
                className="bg-white border border-[#EDE8DF] rounded-3xl p-6 shadow-xs space-y-3 hover:border-stone-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-semibold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Recommended For You • Distributed Systems
                    </span>
                    <span className="font-mono text-stone-400">Score 96.2</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-[#1A382B] transition-colors leading-snug">
                    Consensus Invariants: Formally Verifying Raft Leader Elections
                  </h3>
                  <RecommendationBadge
                    type="recommended"
                    customText="Matched with your reading history in Distributed Systems and high comprehension test scores."
                  />
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Applying TLA+ specifications to verify safety and liveness proofs in distributed state machine replication.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#F5F2EB] flex items-center justify-between text-xs text-stone-500">
                  <span>Curated Dispatch</span>
                  <span className="text-[#1A382B] font-bold group-hover:underline flex items-center gap-1">
                    <span>Browse Articles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Browse View
 */
export const BrowsePage = () => {
  // Keep the reference design's topic navigation and editorial article feed.
  const categories = ['Technology', 'Science', 'Medicine', 'History', 'Environment', 'Architecture', 'Security'];
  const [articles, setArticles] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All Topics');
  const [selectedFeed, setSelectedFeed] = React.useState('All Topics');
  const [sortBy, setSortBy] = React.useState('latest');
  const [loading, setLoading] = React.useState(true);
  const [topicTrends, setTopicTrends] = React.useState([]);
  const [topicTrendLoading, setTopicTrendLoading] = React.useState(true);
  const [topicTrendError, setTopicTrendError] = React.useState('');
  const [topicTrendBasis, setTopicTrendBasis] = React.useState('');
  const [topicSearch, setTopicSearch] = React.useState('');
  const [topicRetry, setTopicRetry] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const fetchTopicTrends = async () => {
      setTopicTrendLoading(true);
      setTopicTrendError('');
      try {
        const response = await articleAPI.getTopicTrends();
        const data = response.data;
        if (!data?.success) throw new Error(data?.message || 'Could not load topic trends.');
        if (!cancelled) {
          setTopicTrends(data.topics || []);
          setTopicTrendBasis(data.trendBasis || '');
        }
      } catch (error) {
        console.error('Failed to load topic trends:', error);
        if (!cancelled) setTopicTrendError(error.message || 'Could not load topic trends.');
      } finally {
        if (!cancelled) setTopicTrendLoading(false);
      }
    };
    fetchTopicTrends();
    return () => { cancelled = true; };
  }, [topicRetry]);

  React.useEffect(() => {
    let cancelled = false;
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('lumen_token');
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        // Category/topic filtering is applied client-side so reference topics like
        // Architecture and Security still work with the existing Article schema.
        const apiBase = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${apiBase}/articles?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token || ''}` },
        });
        const data = await response.json();
        if (!cancelled && data.success) setArticles(data.articles || []);
      } catch (error) {
        console.error('Failed to load articles:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const timer = setTimeout(fetchArticles, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchQuery]);

  const trendingArticleIds = React.useMemo(() => {
    const ids = new Set();
    topicTrends.slice(0, 6).forEach((topic) => {
      (topic.articles || []).forEach((article) => ids.add(String(article._id || article.id || '')));
    });
    return ids;
  }, [topicTrends]);

  const visibleArticles = React.useMemo(() => {
    let result = [...articles];
    if (selectedCategory !== 'All Topics') {
      const aliases = { Medicine: 'Health' };
      const categoryName = aliases[selectedCategory] || selectedCategory;
      result = result.filter((article) => {
        const categoryMatch = String(article.category || '').toLowerCase() === categoryName.toLowerCase();
        const topicMatch = `${article.title || ''} ${article.description || ''} ${(article.tags || []).join(' ')}`.toLowerCase().includes(selectedCategory.toLowerCase());
        return categoryMatch || topicMatch;
      });
    }
    if (selectedFeed === 'Trending Now') {
      result = result.filter((article) => trendingArticleIds.has(String(article._id)));
      result.sort((a, b) => (Number(b.views || 0) + Number(b.likes || 0) * 3) - (Number(a.views || 0) + Number(a.likes || 0) * 3));
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (Number(b.views || 0) + Number(b.likes || 0) * 3) - (Number(a.views || 0) + Number(a.likes || 0) * 3));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.publishedAt || a.createdAt || 0) - new Date(b.publishedAt || b.createdAt || 0));
    } else {
      result.sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0));
    }
    return result;
  }, [articles, selectedCategory, selectedFeed, sortBy, trendingArticleIds]);

  const setFeed = (feed) => {
    setSelectedFeed(feed);
    if (feed === 'All Topics') setSelectedCategory('All Topics');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7">
      {/* Reference page header */}
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-3">
              <Link to="/" className="hover:text-[#1A382B]">Home</Link>
              <span>›</span>
              <span className="text-stone-700">Articles</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">Explore Articles</h1>
            <p className="text-sm text-stone-500 mt-2 max-w-2xl">
              Browse peer-verified engineering guides, research papers, and technical deep dives across the platform.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <label className="relative block w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search articles, keywords, or topics..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E0D7] rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#1A382B] focus:ring-2 focus:ring-[#1A382B]/10"
              />
            </label>
            <label className="relative flex items-center min-w-36">
              <ArrowUpDown className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="appearance-none w-full pl-10 pr-9 py-3 bg-white border border-[#E5E0D7] rounded-xl text-sm text-stone-700 focus:outline-none focus:border-[#1A382B]">
                <option value="latest">Latest first</option>
                <option value="popular">Most popular</option>
                <option value="oldest">Oldest first</option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 pointer-events-none" />
            </label>
          </div>
        </div>
        <div className="text-xs text-stone-500">Showing {visibleArticles.length} {visibleArticles.length === 1 ? 'article' : 'articles'}</div>
      </div>

      {/* Topic navigation from the shared Lumen reference */}
      <div className="border-b border-[#E8E2D8] pb-4 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => setFeed('All Topics')} className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition ${selectedFeed === 'All Topics' ? 'bg-[#1A382B] text-white shadow-sm' : 'bg-white border border-[#E5E0D7] text-stone-600 hover:bg-[#F2EFE9]'}`}>
            <LayoutGrid className="w-4 h-4" /> All Topics
          </button>
          <button type="button" onClick={() => setFeed('For You')} className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition ${selectedFeed === 'For You' ? 'bg-[#1A382B] text-white shadow-sm' : 'bg-white border border-[#E5E0D7] text-stone-600 hover:bg-[#F2EFE9]'}`}>
            <Sparkles className="w-4 h-4" /> For You
          </button>
          <button type="button" onClick={() => setFeed('Trending Now')} className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition ${selectedFeed === 'Trending Now' ? 'bg-[#1A382B] text-white shadow-sm' : 'bg-white border border-[#E5E0D7] text-stone-600 hover:bg-[#F2EFE9]'}`}>
            <Flame className="w-4 h-4" /> Trending Now
          </button>
          <span className="hidden md:block h-7 w-px bg-[#E5E0D7] mx-1" />
          {categories.map((category) => (
            <button key={category} type="button" onClick={() => { setSelectedCategory(category); setSelectedFeed('All Topics'); }} className={`whitespace-nowrap px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${selectedCategory === category ? 'bg-[#EFECE6] text-[#1A382B] border border-[#D8D1C5]' : 'text-stone-600 hover:bg-[#F2EFE9]'}`}>
              {category}
            </button>
          ))}
        </div>
        {selectedFeed === 'Trending Now' && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#1A382B]"><TrendingUp className="w-3.5 h-3.5" /> Topic trend detection</span>
            {topicTrends.slice(0, 5).map((topic) => (
              <button key={topic.name} type="button" onClick={() => { setSearchQuery(topic.name); setSelectedCategory('All Topics'); }} className="rounded-full border border-[#E5E0D7] bg-white px-3 py-1.5 hover:border-[#1A382B] hover:text-[#1A382B] transition">
                {topic.name} <span className="text-stone-400">· {topic.trend}</span>
              </button>
            ))}
            {topicTrends.length === 0 && <span>Topic trends appear as articles are published.</span>}
          </div>
        )}
      </div>

      {selectedFeed === 'Trending Now' && (
        <section className="space-y-4" aria-labelledby="topic-trends-heading">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 id="topic-trends-heading" className="font-serif text-2xl font-semibold text-stone-800">Topic &amp; Trend Detection</h2>
              <p className="text-sm text-stone-500 mt-1">Publication frequency across consecutive 7-day windows. Current engagement totals are context only.</p>
            </div>
            <label className="relative flex items-center w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
              <input value={topicSearch} onChange={(event) => setTopicSearch(event.target.value)} placeholder="Search topics or keywords" className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E0D7] rounded-xl text-sm focus:outline-none focus:border-[#1A382B]" />
            </label>
          </div>
          {topicTrendBasis && <p className="text-xs text-stone-500">{topicTrendBasis}</p>}
          {topicTrendLoading ? (
            <div className="rounded-2xl border border-[#E8E2D8] bg-white p-8 text-center text-sm text-stone-500" role="status">Analyzing published topics…</div>
          ) : topicTrendError ? (
            <div className="rounded-2xl border border-[#E8E2D8] bg-white p-8 text-center" role="alert"><p className="text-sm text-stone-700">{topicTrendError}</p><button type="button" onClick={() => setTopicRetry((retry) => retry + 1)} className="mt-4 rounded-xl bg-[#1A382B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#11261D]">Retry</button></div>
          ) : (() => {
            const filteredTopics = topicTrends.filter((topic) => {
              const term = topicSearch.trim().toLowerCase();
              const matchesSearch = !term || [topic.name, ...(topic.keywords || [])].some((value) => String(value).toLowerCase().includes(term));
              const matchesCategory = selectedCategory === 'All Topics' || (topic.categories || []).some((category) => (category === 'Health' && selectedCategory === 'Medicine') || category.toLowerCase() === selectedCategory.toLowerCase()) || [topic.name, ...(topic.keywords || []), ...(topic.articles || []).map((article) => article.title)].some((value) => String(value).toLowerCase().includes(selectedCategory.toLowerCase()));
              return matchesSearch && matchesCategory;
            });
            return filteredTopics.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTopics.map((topic) => (
                  <article key={topic.name} className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3"><h3 className="font-serif text-lg font-semibold text-stone-800">{topic.name}</h3><div className="flex flex-wrap justify-end gap-1.5">{topic.popular && <span className="rounded-full bg-[#EFECE6] px-2.5 py-1 text-[11px] font-semibold text-[#1A382B]">Popular</span>}<span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${topic.trend === 'Rising' ? 'bg-emerald-50 text-emerald-800' : topic.trend === 'Cooling' ? 'bg-amber-50 text-amber-800' : topic.trend === 'Steady' ? 'bg-stone-100 text-stone-700' : 'bg-stone-100 text-stone-500'}`}>{topic.trend}</span></div></div>
                    <p className="mt-3 text-sm text-stone-600">{topic.articleCount} related published {topic.articleCount === 1 ? 'article' : 'articles'} · {topic.recentArticles} latest 7 days · {topic.previousArticles} previous 7 days</p>
                    <p className="mt-1 text-xs text-stone-500">{topic.growthPercent === null ? 'No comparable prior period' : `${topic.growthPercent > 0 ? '+' : ''}${topic.growthPercent}% frequency change`}{topic.undatedArticles > 0 ? ` · ${topic.undatedArticles} without a usable date` : ''}</p>
                    {Object.keys(topic.engagement || {}).length > 0 && <p className="mt-2 text-xs text-stone-500">Current totals: {Object.entries(topic.engagement).map(([metric, value]) => `${metric} ${Number(value).toLocaleString()}`).join(' · ')}</p>}
                    {topic.keywords?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{topic.keywords.slice(0, 5).map((keyword) => <span key={keyword} className="rounded-full border border-[#E5E0D7] px-2.5 py-1 text-[11px] text-stone-600">{keyword}</span>)}</div>}
                    {topic.articles?.length > 0 && <ul className="mt-4 space-y-2 border-t border-[#F0ECE5] pt-3">{topic.articles.map((article) => <li key={article._id}><Link to={`/browse/${article._id}`} className="text-sm text-[#1A382B] hover:underline">{article.title}</Link></li>)}</ul>}
                  </article>
                ))}
              </div>
            ) : <div className="rounded-2xl border border-dashed border-[#DCD5C9] bg-white/70 p-8 text-center text-sm text-stone-500">No published topics match these filters.</div>;
          })()}
        </section>
      )}

      {/* Article feed uses the reference's clean editorial card language */}
      {loading ? (
        <div className="py-16 text-center text-sm text-stone-500">Loading articles…</div>
      ) : visibleArticles.length === 0 ? (
        <div className="py-16 text-center bg-white/70 border border-dashed border-[#DCD5C9] rounded-2xl">
          <Search className="w-7 h-7 text-stone-400 mx-auto mb-3" />
          <h2 className="font-serif text-xl font-semibold text-stone-800">No articles found matching your criteria</h2>
          <p className="text-sm text-stone-500 mt-2">Try adjusting your search, clearing filters, or exploring our active topics list.</p>
          <button type="button" onClick={() => { setSearchQuery(''); setSelectedCategory('All Topics'); setSelectedFeed('All Topics'); }} className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A382B] text-white text-sm font-semibold hover:bg-[#11261D]">Reset filters <ArrowRight className="w-4 h-4" /></button>
        </div>
      ) : (
<div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
            {visibleArticles.map((article) => {
              const cover =
                article.coverImage ||
                article.image ||
                article.thumbnail ||
                article.imageUrl;

              return (
                <Link
                  key={article._id || article.id}
                  to={`/browse/${article._id || article.id}`}
                  className="group bg-white border border-[#EDE8DF] hover:border-stone-400 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition duration-200"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] min-h-56">
                    <div className="relative min-h-44 sm:min-h-full overflow-hidden bg-[#E8E4DA]">
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/35 via-transparent to-transparent" />
                      <span className="absolute left-3 bottom-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-stone-800 uppercase tracking-wide">
                        {article.category || 'Editorial'}
                      </span>
                    </div>

<div className="p-5 sm:p-6 flex flex-col min-w-0 justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 text-xs text-stone-500">
                          <span className="truncate">
                            {article.subcategory ||
                              article.tags?.[0] ||
                              'Research & Insights'}
                          </span>
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <Eye className="w-3.5 h-3.5" />
                            {article.views || 0}
                          </span>
                        </div>

                        {/* Recommendation Badge (Supports Personalized & Trending) */}
                        {article.recommendation ? (
                          <RecommendationBadge recommendation={article.recommendation} />
                        ) : (
                          <RecommendationBadge
                            type="trending"
                            articleId={article._id || article.id}
                            category={article.category}
                          />
                        )}

                        <h2 className="font-serif text-xl sm:text-2xl leading-snug font-bold text-stone-900 mt-2 line-clamp-2 group-hover:text-emerald-900 transition">
                          {article.title}
                        </h2>

                        <p className="text-sm leading-relaxed text-stone-600 mt-2 line-clamp-3">
                          {article.description}
                        </p>
                      </div>
                      <div className="mt-auto pt-5 flex items-center justify-between gap-3 border-t border-[#F5F2EB]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#EFECE6] text-[#1A382B] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {article.author?.name ? article.author.name[0] : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-800 truncate">
                              {article.author?.name || 'Unknown Author'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-stone-500 shrink-0">
                          <span className="flex items-center gap-1 text-stone-700 font-medium">
                            <ThumbsUp className="w-3.5 h-3.5 text-stone-400" />
                            {article.likes || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
      )}
      {!loading && visibleArticles.length > 0 && <div className="flex items-center justify-between border-t border-[#E8E2D8] pt-5 text-xs text-stone-500"><span>Page 1 of 1 ({visibleArticles.length} results)</span><div className="flex items-center gap-2"><button disabled className="px-3 py-2 rounded-lg border border-[#E5E0D7] bg-white opacity-50">‹</button><span className="px-3 py-2 rounded-lg bg-[#1A382B] text-white font-semibold">1</span><button disabled className="px-3 py-2 rounded-lg border border-[#E5E0D7] bg-white opacity-50">›</button></div></div>}
    </div>
  );
};

/**
 * Write View (Article Editor)
 */
export const WritePage = () => {
  const { user } = useAuth();

  // Article form state
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [content, setContent] = React.useState('');
  const [category, setCategory] = React.useState('Technology');

  // Loading and message state
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [messageType, setMessageType] = React.useState('');

  /**
   * Submit article
   */
  const handleSubmit = async () => {
    // Validate title
    if (!title.trim()) {
      setMessageType('error');
      setMessage('Please enter an article title.');
      return;
    }

    // Validate content
    if (!content.trim()) {
      setMessageType('error');
      setMessage('Please enter article content.');
      return;
    }

    // Check logged-in user
    if (!user) {
      setMessageType('error');
      setMessage('Please login before submitting an article.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setMessageType('');

      /*
       * Your AuthContext stores the JWT using:
       *
       * localStorage.setItem('lumen_token', newToken)
       */
      const token = localStorage.getItem('lumen_token');

      if (!token) {
        setMessageType('error');
        setMessage('Authentication token not found. Please login again.');
        return;
      }

      /*
       * STEP 1:
       * Create the article.
       */
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const createResponse = await fetch(
        `${apiBase}/articles`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            content: content.trim(),
            category,
            tags: [],
          }),
        }
      );

      const createData = await createResponse.json();

      console.log('Create article response:', createData);

      if (!createResponse.ok) {
        throw new Error(
          createData.message || 'Failed to create article.'
        );
      }

      /*
       * Get article ID.
       */
      const articleId = createData.article?._id;

      if (!articleId) {
        throw new Error(
          'Article was created but no article ID was returned.'
        );
      }

      /*
       * STEP 2:
       * Submit the newly created article for review.
       */
      const submitResponse = await fetch(
        `${apiBase}/articles/${articleId}/submit`,
        {
          method: 'PATCH',

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const submitData = await submitResponse.json();

      console.log('Submit article response:', submitData);

      if (!submitResponse.ok) {
        throw new Error(
          submitData.message ||
            'Failed to submit article for review.'
        );
      }

      /*
       * SUCCESS
       */
      setMessageType('success');
      setMessage(
        'Article submitted successfully for review!'
      );

      // Clear the form
      setTitle('');
      setDescription('');
      setContent('');
      setCategory('Technology');

    } catch (error) {
      console.error('Submit article error:', error);

      setMessageType('error');
      setMessage(
        error.message ||
          'Something went wrong while submitting the article.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Write New Article
          </h1>

          <p className="text-xs text-stone-500">
            Authoring as {user?.name}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-[#1A382B] text-white text-xs font-bold rounded-xl hover:bg-[#11261D] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>

      {/* Success / Error Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-xl text-sm border ${
            messageType === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message}
        </div>
      )}

      {/* Article Form */}
      <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">

        {/* Article Title */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5">
            Article Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter an engaging headline..."
            className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl font-serif text-lg text-stone-900 focus:outline-none focus:border-[#1A382B] focus:bg-white"
          />
        </div>

        {/* Short Excerpt */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5">
            Short Excerpt
          </label>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief summary for previews..."
            className="w-full px-4 py-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#1A382B] focus:bg-white"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5">
            Category
          </label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#1A382B] focus:bg-white"
          >
            <option value="Science">Science</option>
            <option value="Technology">Technology</option>
            <option value="Environment">Environment</option>
            <option value="Health">Health</option>
            <option value="History">History</option>
            <option value="Business">Business</option>
            <option value="Education">Education</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Article Content */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5">
            Content (Markdown)
          </label>

          <textarea
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your article in Markdown..."
            className="w-full p-4 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#1A382B] focus:bg-white resize-y"
          />
        </div>

      </div>
    </div>
  );
};

/**
 * Admin View (Verification Center)
 */
export const AdminPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Admin Verification Center
        </h1>

        <p className="text-xs text-stone-500">
          Review pending submissions and editorial workflows
        </p>
      </div>

      <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-lg font-bold text-stone-900">
          Pending Review Queue
        </h2>

        <div className="divide-y divide-[#F5F2EB] text-xs">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-stone-900 block">
                The Future of Brain-Computer Interfaces
              </span>

              <span className="text-stone-500">
                Submitted by Priya Mehta ΓÇó 5 min read
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-semibold hover:bg-emerald-100 transition">
                Approve
              </button>

              <button className="px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl font-semibold hover:bg-rose-100 transition">
                Request Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

