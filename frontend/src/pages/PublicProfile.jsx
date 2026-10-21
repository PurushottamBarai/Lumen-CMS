import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  ArrowLeft,
  Eye,
  Heart,
  FileText,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

import { userAPI, articleAPI } from '../services/api';
import TrustBadge from '../components/trust/TrustBadge';

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');

  // Fetch profile and articles
  useEffect(() => {
    if (!id) return;

    fetchPublicProfile();
    fetchPublishedArticles();
  }, [id]);

  // Fetch public user profile
  const fetchPublicProfile = async () => {
    setLoadingProfile(true);
    setErrorMsg('');

    try {
      const response = await userAPI.getUserById(id);

      if (response.data.success) {
        setProfile(response.data.user);
      } else {
        setErrorMsg(
          response.data.message || 'Failed to load user profile.'
        );
      }
    } catch (error) {
      console.error('[Public Profile Error]:', error);

      setErrorMsg(
        error.response?.data?.message ||
          'Failed to load user profile. Please try again.'
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  // Fetch published articles
  const fetchPublishedArticles = async () => {
    setLoadingArticles(true);

    try {
      const response =
        await articleAPI.getPublishedArticlesByAuthor(id);

      if (response.data.success) {
        setArticles(response.data.articles || []);
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error(
        '[Public Profile Articles Error]:',
        error
      );

      setArticles([]);
    } finally {
      setLoadingArticles(false);
    }
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return 'U';

    const parts = name.trim().split(' ');

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
  };

  // Format joined date
  const getJoinedDate = (date) => {
    if (!date) {
      return 'August 2026';
    }

    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  // Format article date
  const getArticleDate = (article) => {
    const date =
      article.publishedAt || article.createdAt;

    if (!date) return '';

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Open article
  const handleViewArticle = (articleId) => {
    navigate(`/browse/${articleId}`);
  };

  // Loading profile
  if (loadingProfile) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-10 text-center">
          <p className="text-sm text-stone-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // Profile not found
  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-10 text-center">

          <AlertCircle className="w-10 h-10 mx-auto text-rose-400 mb-4" />

          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Profile Not Found
          </h1>

          <p className="text-sm text-stone-500 mt-2">
            The user profile you're looking for could not be found.
          </p>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-[#1A382B] text-white rounded-xl text-xs font-bold hover:bg-[#11261D] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

        </div>
      </div>
    );
  }

  // Statistics
  const totalViews = articles.reduce(
    (total, article) =>
      total + (article.views || 0),
    0
  );

  const totalLikes = articles.reduce(
    (total, article) =>
      total + (article.likes || 0),
    0
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Error */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Profile Card */}
      <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-10 shadow-xs">

        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">

          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#1A382B] text-white font-serif text-3xl sm:text-4xl font-bold flex items-center justify-center flex-shrink-0 shadow-md ring-4 ring-[#FAF7F2] overflow-hidden">

            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(profile.name)
            )}

          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-4 w-full">

            {/* Name and Role */}
            <div>

              <div className="flex items-center gap-3 flex-wrap">

                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  {profile.name}
                </h1>

                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    profile.role === 'admin'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : profile.role === 'author'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {profile.role}
                </span>

                <TrustBadge score={profile.trustScore ?? 50} level={profile.trustLevel} size="sm" />

              </div>

              {/* Member Since */}
              <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-2">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Member since {getJoinedDate(profile.createdAt)}
              </p>

            </div>

            {/* Bio */}
            <p className="text-sm text-stone-700 leading-relaxed max-w-2xl">
              {profile.bio || 'No bio added yet.'}
            </p>

            {/* Author Statistics */}
            {profile.role === 'author' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-5 border-t border-[#F5F2EB]">

                <div>
                  <span className="font-serif text-2xl font-bold text-stone-900 block">
                    {loadingArticles ? '...' : articles.length}
                  </span>

                  <span className="text-xs text-stone-500 font-medium">
                    Published Articles
                  </span>
                </div>

                <div>
                  <span className="font-serif text-2xl font-bold text-stone-900 block">
                    {loadingArticles ? '...' : totalViews}
                  </span>

                  <span className="text-xs text-stone-500 font-medium">
                    Total Views
                  </span>
                </div>

                <div>
                  <span className="font-serif text-2xl font-bold text-stone-900 block">
                    {loadingArticles ? '...' : totalLikes}
                  </span>

                  <span className="text-xs text-stone-500 font-medium">
                    Total Likes
                  </span>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* Published Articles */}
      <section className="space-y-4">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Published Articles
            </h2>

            <p className="text-xs text-stone-500 mt-1">
              Articles published by {profile.name}
            </p>
          </div>

          <BookOpen className="w-5 h-5 text-stone-400" />

        </div>

        {/* Loading */}
        {loadingArticles && (
          <div className="bg-white border border-[#EDE8DF] rounded-2xl p-8 text-center">
            <p className="text-sm text-stone-500">
              Loading published articles...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loadingArticles && articles.length === 0 && (
          <div className="bg-white border border-[#EDE8DF] rounded-2xl p-10 text-center">

            <FileText className="w-10 h-10 mx-auto text-stone-300 mb-3" />

            <h3 className="font-serif text-lg font-bold text-stone-900">
              No published articles
            </h3>

            <p className="text-sm text-stone-500 mt-1">
              {profile.name} hasn't published any articles yet.
            </p>

          </div>
        )}

        {/* Articles */}
        {!loadingArticles && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {articles.map((article) => (
              <article
                key={article._id}
                className="bg-white border border-[#EDE8DF] rounded-2xl p-5 shadow-xs hover:shadow-md transition"
              >

                {/* Category */}
                <div className="flex items-center justify-between gap-3 mb-3">

                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A382B] bg-[#EEF3EF] px-2.5 py-1 rounded-full">
                    {article.category || 'General'}
                  </span>

                  {getArticleDate(article) && (
                    <span className="text-[11px] text-stone-400">
                      {getArticleDate(article)}
                    </span>
                  )}

                </div>

                {/* Title */}
                <h3 className="font-serif text-lg font-bold text-stone-900 leading-snug">
                  {article.title}
                </h3>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-sm text-stone-600 mt-2 line-clamp-3">
                    {article.excerpt}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 mt-4 text-xs text-stone-500">

                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {article.readingTime || 1} min read
                  </span>

                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {article.views || 0}
                  </span>

                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {article.likes || 0}
                  </span>

                </div>

                {/* Read Article */}
                <button
                  onClick={() => handleViewArticle(article._id)}
                  className="inline-flex items-center gap-1.5 mt-5 text-xs font-bold text-[#1A382B] hover:underline"
                >
                  Read Article
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </button>

              </article>
            ))}

          </div>
        )}

      </section>

    </div>
  );
};

export default PublicProfile;