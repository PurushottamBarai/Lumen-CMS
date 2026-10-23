import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Clock, Eye, ThumbsUp, Sparkles, BookOpen, User, RefreshCw } from 'lucide-react';
import RecommendationBadge from './RecommendationBadge';

export const ForYouFeed = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('lumen_token');
      const response = await axios.get('/api/recommendations/for-you?limit=6', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data && response.data.success) {
        setArticles(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load personalized recommendations:', err);
      setError('Could not load your personalized feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="pt-4 border-t border-slate-100 flex justify-between">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-3">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  // Empty State (Zero published articles in DB yet)
  if (articles.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center space-y-4 shadow-2xs">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-bold text-slate-800">
            Personalized Feed Ready
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
            As you and authors publish articles and explore topics, your dynamic "For You" recommendations will automatically appear here.
          </p>
        </div>
        <Link
          to="/write"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          Publish a Dispatch
        </Link>
      </div>
    );
  }

  // Render Recommendations Grid
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <article
            key={article._id}
            className="group bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-6 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Category Pill & Explanation Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 uppercase tracking-wider">
                  {article.category || 'Editorial'}
                </span>
                <RecommendationBadge recommendation={article.recommendation} />
              </div>

              {/* Title */}
              <Link to={`/browse/${article._id}`} className="block">
                <h3 className="font-serif text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </h3>
              </Link>

              {/* Description */}
              <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 font-normal leading-relaxed">
                {article.description || 'Click to read full dispatch and analysis...'}
              </p>
            </div>

            {/* Author Footer & Metrics */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                {article.author?.avatar ? (
                  <img
                    src={article.author.avatar}
                    alt={article.author?.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="font-medium text-slate-700 truncate max-w-[100px]">
                  {article.author?.name || 'Staff Editor'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {article.readingTime || 3}m
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                  {article.likes || 0}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ForYouFeed;