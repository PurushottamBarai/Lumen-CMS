import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  Calendar,
  Edit3,
  Eye,
  Heart,
  FileText,
  Trophy,
  Bookmark,
  Clock,
  PlusCircle,
  Trash2,
  X,
  Mail,
  AlertCircle,
  Save,
  ShieldAlert,
  ArrowRight,
  Lock,
  Key,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { articleAPI, quizAttemptAPI, userAPI } from '../services/api';
import TrustScoreCard from '../components/trust/TrustScoreCard';
import TrustBadge from '../components/trust/TrustBadge';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  // =====================================================
  // PROFILE STATE
  // =====================================================

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // =====================================================
  // ARTICLE STATE
  // =====================================================

  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  // =====================================================
  // QUIZ STATE
  // =====================================================

  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // =====================================================
  // BOOKMARK STATE
  // =====================================================

  const [bookmarks, setBookmarks] = useState([]);

  // =====================================================
  // PASSWORD CHANGE STATE
  // =====================================================

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  // =====================================================

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // =====================================================
  // USER ROLE
  // =====================================================

  const isAuthor =
    user?.role === 'author' || user?.role === 'admin';

  const isAdmin = user?.role === 'admin';

  // =====================================================
  // UPDATE FORM WHEN USER CHANGES
  // =====================================================

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
    }
  }, [user]);

  // =====================================================
  // FETCH ARTICLES
  // =====================================================

  useEffect(() => {
    if (isAuthor) {
      fetchArticles();
    } else {
      setLoadingArticles(false);
    }
  }, [isAuthor]);

  // =====================================================
  // FETCH QUIZ ATTEMPTS
  // =====================================================

  useEffect(() => {
    fetchMyQuizAttempts();
    fetchBookmarks();
  }, []);

  // =====================================================
  // GET MY ARTICLES
  // =====================================================

  const fetchArticles = async () => {
    try {
      setLoadingArticles(true);
      setErrorMsg('');

      const response = await articleAPI.getMyArticles();

      if (response.data?.success) {
        setArticles(response.data.articles || []);
      } else {
        setArticles([]);
        setErrorMsg(
          response.data?.message ||
            'Failed to load your articles.'
        );
      }
    } catch (error) {
      console.error('[Profile Articles Error]:', error);

      setArticles([]);

      setErrorMsg(
        error.response?.data?.message ||
          'Failed to load your articles.'
      );
    } finally {
      setLoadingArticles(false);
    }
  };

  // =====================================================
  // GET QUIZ ATTEMPTS
  // =====================================================

  const fetchMyQuizAttempts = async () => {
    try {
      setLoadingAttempts(true);

      if (!quizAttemptAPI?.getMyAttempts) {
        setAttempts([]);
        return;
      }

      const response = await quizAttemptAPI.getMyAttempts();

      if (
        response.data?.success &&
        Array.isArray(response.data?.attempts)
      ) {
        setAttempts(response.data.attempts);
      } else {
        setAttempts([]);
      }
    } catch (error) {
      console.error(
        '[Profile Attempts Error]:',
        error
      );

      setAttempts([]);
    } finally {
      setLoadingAttempts(false);
    }
  };

  // =====================================================
  // FETCH BOOKMARKS
  // =====================================================

  const fetchBookmarks = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('lumen_bookmarks') || '[]'
      );

      setBookmarks(Array.isArray(saved) ? saved : []);
    } catch (error) {
      console.error(
        '[Profile Bookmarks Error]:',
        error
      );

      setBookmarks([]);
    }
  };

  // =====================================================
  // REMOVE BOOKMARK
  // =====================================================

  const handleRemoveBookmark = (bookmarkId) => {
    try {
      const updated = bookmarks.filter(
        (bookmark) =>
          bookmark._id !== bookmarkId &&
          bookmark.id !== bookmarkId
      );

      setBookmarks(updated);

      localStorage.setItem(
        'lumen_bookmarks',
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error(
        '[Remove Bookmark Error]:',
        error
      );
    }
  };

  // =====================================================
  // GET INITIALS
  // =====================================================

  const getInitials = (value) => {
    if (!value) {
      return 'U';
    }

    const parts = value.trim().split(/\s+/);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return value.slice(0, 2).toUpperCase();
  };

  // =====================================================
  // OPEN EDIT PROFILE
  // =====================================================

  const handleEditOpen = () => {
    setName(user?.name || '');
    setBio(user?.bio || '');

    setSuccessMsg('');
    setErrorMsg('');

    setIsEditing(true);
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSaveProfile = async (event) => {
    if (event) {
      event.preventDefault();
    }

    setSuccessMsg('');
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Name cannot be empty.');
      return;
    }

    try {
      setSaving(true);

      const result = await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
      });

      if (result?.success) {
        setSuccessMsg(
          'Profile updated successfully!'
        );

        setIsEditing(false);
      } else {
        setErrorMsg(
          result?.message ||
            'Failed to update profile.'
        );
      }
    } catch (error) {
      console.error(
        '[Update Profile Error]:',
        error
      );

      setErrorMsg(
        error.response?.data?.message ||
          'Error updating profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancelEdit = () => {
    setName(user?.name || '');
    setBio(user?.bio || '');

    setIsEditing(false);

    setSuccessMsg('');
    setErrorMsg('');
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handlePasswordChange = async (event) => {
    if (event) {
      event.preventDefault();
    }

    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Please provide both current and new passwords.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await userAPI.changePassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      });

      if (res.data?.success) {
        setPasswordSuccess(res.data.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setShowPasswordChange(false), 2500);
      } else {
        setPasswordError(res.data?.message || 'Failed to change password.');
      }
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || 'Error changing password. Please try again.'
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  // =====================================================
  // EDIT ARTICLE
  // =====================================================

  const handleEditArticle = (articleId) => {
    navigate(`/write/${articleId}`);
  };

  // =====================================================
  // VIEW ARTICLE
  // =====================================================

  const handleViewArticle = (articleId) => {
    navigate(`/browse/${articleId}`);
  };

  // =====================================================
  // DELETE ARTICLE
  // =====================================================

  const handleDeleteArticle = async (articleId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this article? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMsg('');
      setSuccessMsg('');

      const response =
        await articleAPI.deleteArticle(articleId);

      if (response.data?.success) {
        setArticles((previous) =>
          previous.filter(
            (article) =>
              article._id !== articleId
          )
        );

        setSuccessMsg(
          'Article deleted successfully.'
        );
      } else {
        setErrorMsg(
          response.data?.message ||
            'Failed to delete article.'
        );
      }
    } catch (error) {
      console.error(
        '[Delete Article Error]:',
        error
      );

      setErrorMsg(
        error.response?.data?.message ||
          'Failed to delete article.'
      );
    }
  };

  // =====================================================
  // ARTICLE STATISTICS
  // =====================================================

  const articleCount = articles.length;

  const publishedArticles = articles.filter(
    (article) =>
      article.status === 'published'
  );

  const publishedCount =
    publishedArticles.length;

  const totalViews = articles.reduce(
    (total, article) =>
      total + (article.views || 0),
    0
  );

  const totalLikes = articles.reduce(
    (total, article) => {
      const likes = Array.isArray(article.likes)
        ? article.likes.length
        : article.likes || 0;

      return total + likes;
    },
    0
  );

  // =====================================================
  // JOINED DATE
  // =====================================================

  const joinedDate = user?.createdAt
    ? new Date(
        user.createdAt
      ).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'August 2026';

  // =====================================================
  // ARTICLE DATE
  // =====================================================

  const getArticleDate = (article) => {
    const date =
      article.publishedAt ||
      article.createdAt;

    if (!date) {
      return '';
    }

    return new Date(date).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  };

  // =====================================================
  // ARTICLE STATUS STYLE
  // =====================================================

  const getStatusStyle = (status) => {
    switch (status) {
      case 'published':
      case 'approved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';

      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';

      case 'changes_requested':
        return 'bg-orange-50 text-orange-800 border-orange-200';

      case 'rejected':
        return 'bg-rose-50 text-rose-800 border-rose-200';

      case 'draft':
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  // =====================================================
  // ARTICLE STATUS LABEL
  // =====================================================

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'In Review';

      case 'changes_requested':
        return 'Changes Requested';

      case 'published':
      case 'approved':
        return 'Published';

      case 'rejected':
        return 'Rejected';

      case 'draft':
      default:
        return 'Draft';
    }
  };

  // =====================================================
  // BEST QUIZ SCORE
  // =====================================================

  const bestScorePercentage =
    attempts.length > 0
      ? Math.max(
          ...attempts.map(
            (attempt) =>
              attempt.percentage || 0
          )
        )
      : 0;

  // =====================================================
  // LOADING USER
  // =====================================================

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-10 text-center">
          <p className="text-sm text-stone-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* ================================================= */}
      {/* NOTIFICATIONS */}
      {/* ================================================= */}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between gap-3">
          <span>{successMsg}</span>

          <button
            onClick={() => setSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />

          <span>{errorMsg}</span>

          <button
            onClick={() => setErrorMsg('')}
            className="ml-auto text-rose-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* PROFILE HEADER */}
      {/* ================================================= */}

      <section className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-10 shadow-xs">

        <div className="flex flex-col sm:flex-row items-start gap-6">

          {/* Avatar */}

          <div className="w-24 h-24 rounded-full bg-[#1A382B] text-white font-serif text-3xl font-bold flex items-center justify-center flex-shrink-0 overflow-hidden">

            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(user.name)
            )}

          </div>

          {/* Profile Details */}

          <div className="flex-1 w-full">

            <div className="flex items-start justify-between gap-4">

              <div>

                <div className="flex items-center gap-3 flex-wrap">

                  <h1 className="font-serif text-3xl font-bold text-stone-900">
                    {user.name}
                  </h1>

                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      user.role === 'admin'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : user.role === 'author'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {user.role}
                  </span>

                  <TrustBadge score={user.trustScore ?? 50} level={user.trustLevel} size="sm" />

                </div>

                <p className="text-sm text-stone-500 mt-2 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </p>

                <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {joinedDate}
                </p>

              </div>

              {!isEditing && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to="/my-appeals"
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#EDE8DF] rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-stone-500" />
                    <span>My Appeals</span>
                  </Link>

                  <button
                    onClick={handleEditOpen}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[#EDE8DF] rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowPasswordChange(!showPasswordChange);
                      setPasswordSuccess('');
                      setPasswordError('');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[#EDE8DF] rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50"
                  >
                    <Key className="w-4 h-4" />
                    Change Password
                  </button>
                </div>
              )}

            </div>

            {/* Account Restriction Notice */}
            {user.isRestricted && (
              <div className="mt-5 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">Account Restricted</span>
                    <span className="text-rose-700">
                      {user.restrictionReason ||
                        'Your account has been restricted due to suspicious activity or moderation policy violation.'}
                    </span>
                  </div>
                </div>
                <Link
                  to="/my-appeals?tab=submit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition self-start sm:self-auto flex-shrink-0"
                >
                  <span>Submit Appeal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* ================================================= */}
            {/* EDIT PROFILE */}
            {/* ================================================= */}

            {isEditing ? (
              <form
                onSubmit={handleSaveProfile}
                className="mt-6 space-y-4"
              >

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-2">
                    Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    required
                    className="w-full px-4 py-3 border border-[#EDE8DF] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1A382B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-2">
                    Bio
                  </label>

                  <textarea
                    value={bio}
                    onChange={(event) =>
                      setBio(event.target.value)
                    }
                    rows={4}
                    maxLength={500}
                    placeholder="Share a short bio..."
                    className="w-full px-4 py-3 border border-[#EDE8DF] rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-[#1A382B]"
                  />
                </div>

                <div className="flex gap-3">

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A382B] text-white rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />

                    {saving
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[#EDE8DF] rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>

                </div>

              </form>
            ) : (
              <p className="text-sm text-stone-700 leading-relaxed mt-5 max-w-2xl">
                {user.bio ||
                  'No bio added yet.'}
              </p>
            )}

            {/* ================================================= */}
            {/* CHANGE PASSWORD FORM */}
            {/* ================================================= */}

            {showPasswordChange && (
              <form
                onSubmit={handlePasswordChange}
                className="mt-6 p-6 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl space-y-4 max-w-lg shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#1A382B]" />
                    Change Account Password
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(false)}
                    className="p-1 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                    {passwordSuccess}
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8DF] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#1A382B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    New Password (min. 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8DF] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#1A382B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8DF] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#1A382B]"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="px-4 py-2 bg-[#1A382B] text-white rounded-xl text-xs font-bold hover:bg-[#11261D] disabled:opacity-50"
                  >
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordSuccess('');
                      setPasswordError('');
                    }}
                    className="px-3.5 py-2 border border-[#EDE8DF] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

        {/* ================================================= */}
        {/* AUTHOR STATISTICS */}
        {/* ================================================= */}

        {isAuthor && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-6 mt-6 border-t border-[#F5F2EB]">

            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold text-stone-900 block">
                {loadingArticles
                  ? '...'
                  : articleCount}
              </span>

              <span className="text-xs text-stone-500 font-medium">
                Articles
              </span>
            </div>

            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold text-stone-900 block">
                {loadingArticles
                  ? '...'
                  : publishedCount}
              </span>

              <span className="text-xs text-stone-500 font-medium">
                Published
              </span>
            </div>

            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold text-stone-900 block">
                {loadingArticles
                  ? '...'
                  : totalViews.toLocaleString()}
              </span>

              <span className="text-xs text-stone-500 font-medium">
                Total Views
              </span>
            </div>

            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold text-stone-900 block">
                {loadingArticles
                  ? '...'
                  : totalLikes}
              </span>

              <span className="text-xs text-stone-500 font-medium">
                Total Likes
              </span>
            </div>

          </div>
        )}

      </section>

      {/* ================================================= */}
      {/* USER TRUST & COMMUNITY REPUTATION */}
      {/* ================================================= */}

      <section>
        <TrustScoreCard initialUser={user} />
      </section>

      {/* ================================================= */}
      {/* SAVED READING LIST */}
      {/* ================================================= */}

      <section className="space-y-4">

        <div className="flex items-center justify-between">

          <h2 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-600" />
            Saved Reading List ({bookmarks.length})
          </h2>

        </div>

        {bookmarks.length === 0 ? (
          <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 text-center text-xs text-stone-500 space-y-2">

            <p>
              Your saved reading list is
              currently empty.
            </p>

            <p className="text-[11px] text-stone-400">
              Click the "Bookmark" button on
              any article detail page to save
              it for later.
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {bookmarks.map((bookmark) => {
              const bookmarkId =
                bookmark._id ||
                bookmark.id;

              return (
                <div
                  key={bookmarkId}
                  className="bg-white border border-[#EDE8DF] rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4"
                >

                  <div className="space-y-1 min-w-0">

                    <span className="px-2 py-0.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-full font-bold text-[10px] text-stone-700 uppercase tracking-wider">
                      {bookmark.category ||
                        'General'}
                    </span>

                    <h4 className="font-serif font-bold text-stone-900 text-sm truncate">

                      <Link
                        to={`/browse/${bookmarkId}`}
                      >
                        {bookmark.title}
                      </Link>

                    </h4>

                    <p className="text-xs text-stone-500 flex items-center gap-2">

                      <span>
                        {bookmark.author?.name ||
                          'Editorial Author'}
                      </span>

                      <span>•</span>

                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />

                        {bookmark.readingTime ||
                          5}{' '}
                        min read
                      </span>

                    </p>

                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">

                    <Link
                      to={`/browse/${bookmarkId}`}
                      className="px-3 py-1.5 bg-[#1A382B] text-white text-xs font-bold rounded-xl"
                    >
                      Read
                    </Link>

                    <button
                      onClick={() =>
                        handleRemoveBookmark(
                          bookmarkId
                        )
                      }
                      className="p-1.5 text-stone-400 hover:text-rose-600"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* ================================================= */}
      {/* AUTHOR ARTICLES */}
      {/* ================================================= */}

      {isAuthor && (
        <section className="space-y-4">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900">
                My Articles
              </h2>

              <p className="text-xs text-stone-500 mt-1">
                Manage your submitted and
                published articles.
              </p>
            </div>

            <Link
              to="/write"
              className="flex items-center gap-1.5 text-xs font-bold text-[#1A382B] hover:underline"
            >
              <PlusCircle className="w-4 h-4" />
              New Article
            </Link>

          </div>

          {/* Loading */}

          {loadingArticles && (
            <div className="bg-white border border-[#EDE8DF] rounded-2xl p-8 text-center">
              <p className="text-sm text-stone-500">
                Loading your articles...
              </p>
            </div>
          )}

          {/* Empty */}

          {!loadingArticles &&
            articles.length === 0 && (
              <div className="bg-white border border-[#EDE8DF] rounded-2xl p-10 text-center">

                <FileText className="w-10 h-10 mx-auto text-stone-300 mb-3" />

                <h3 className="font-serif text-lg font-bold text-stone-900">
                  No articles yet
                </h3>

                <p className="text-sm text-stone-500 mt-1 mb-4">
                  Start writing and share your
                  knowledge with the Lumen
                  community.
                </p>

                <Link
                  to="/write"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A382B] text-white rounded-xl text-xs font-bold hover:bg-[#11261D]"
                >
                  <PlusCircle className="w-4 h-4" />
                  Write an Article
                </Link>

              </div>
            )}

          {/* Article List */}

          {!loadingArticles &&
            articles.length > 0 && (
              <div className="space-y-3">

                {articles.map((article) => {

                  const canEditOrDelete = [
                    'draft',
                    'changes_requested',
                    'rejected',
                  ].includes(
                    article.status
                  );

                  return (
                    <div
                      key={article._id}
                      className="bg-white border border-[#EDE8DF] rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4"
                    >

                      <div className="space-y-1 min-w-0">

                        <div className="flex items-center gap-2 flex-wrap">

                          <h3 className="font-serif font-bold text-stone-900 text-base">
                            {article.title}
                          </h3>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusStyle(
                              article.status
                            )}`}
                          >
                            {getStatusLabel(
                              article.status
                            )}
                          </span>

                        </div>

                        <p className="text-xs text-stone-500">
                          {article.category ||
                            'General'}{' '}
                          •{' '}
                          {article.readingTime ||
                            1}{' '}
                          min read •{' '}
                          {article.views || 0}{' '}
                          views •{' '}
                          {Array.isArray(
                            article.likes
                          )
                            ? article.likes.length
                            : article.likes ||
                              0}{' '}
                          likes
                        </p>

                        {getArticleDate(
                          article
                        ) && (
                          <p className="text-[11px] text-stone-400">
                            {getArticleDate(
                              article
                            )}
                          </p>
                        )}

                        {article.status === 'pending' && (
                          <p className="text-[11px] text-amber-700">
                            Submitted for admin
                            review
                          </p>
                        )}

                        {(article.status ===
                          'changes_requested' ||
                          article.status ===
                            'rejected') &&
                          article.reviewFeedback && (
                            <p className="text-[11px] text-orange-800 bg-orange-50 p-2 rounded-xl border border-orange-200 mt-1">
                              <strong>
                                Admin Feedback:
                              </strong>{' '}
                              {
                                article.reviewFeedback
                              }
                            </p>
                          )}

                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">

                        {(article.status ===
                          'published' ||
                          article.status ===
                            'approved') && (
                          <button
                            onClick={() =>
                              handleViewArticle(
                                article._id
                              )
                            }
                            className="p-2 text-stone-400 hover:text-stone-700"
                            title="View article"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        {canEditOrDelete && (
                          <button
                            onClick={() =>
                              handleEditArticle(
                                article._id
                              )
                            }
                            className="p-2 text-stone-400 hover:text-stone-700"
                            title="Edit article"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {canEditOrDelete && (
                          <button
                            onClick={() =>
                              handleDeleteArticle(
                                article._id
                              )
                            }
                            className="p-2 text-stone-400 hover:text-rose-600"
                            title="Delete article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

        </section>
      )}

      {/* ================================================= */}
      {/* QUIZ ACTIVITY */}
      {/* ================================================= */}

      <section className="space-y-4">

        <div className="flex items-center justify-between">

          <h2 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#1A382B]" />

            Quiz Activity

            {attempts.length > 0 && (
              <span className="text-sm font-normal text-stone-500">
                • Best Score:{' '}
                {bestScorePercentage}%
              </span>
            )}
          </h2>

        </div>

        {loadingAttempts ? (
          <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 text-center text-xs text-stone-500">
            Loading quiz activity...
          </div>
        ) : attempts.length === 0 ? (
          <div className="bg-white border border-[#EDE8DF] rounded-3xl p-8 text-center space-y-3">

            <Trophy className="w-8 h-8 text-stone-300 mx-auto" />

            <p className="text-xs text-stone-600 font-medium">
              No quiz attempts recorded
              yet.
            </p>

            <Link
              to="/quiz/quiz-crispr-1"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A382B] text-white text-xs font-bold rounded-xl hover:bg-[#11261D] transition"
            >
              Take Sample Quiz
            </Link>

          </div>
        ) : (
          <div className="space-y-3">

            {attempts.map((attempt) => (
              <div
                key={attempt._id}
                className="bg-white border border-[#EDE8DF] rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4"
              >

                <div className="space-y-1">

                  <div className="flex items-center gap-2 flex-wrap">

                    <h4 className="font-serif font-bold text-stone-900 text-sm">
                      {attempt.quizTitle ||
                        attempt.quiz?.title ||
                        'Quiz Attempt'}
                    </h4>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        attempt.passed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {attempt.passed
                        ? 'PASSED'
                        : 'NEEDS PRACTICE'}
                    </span>

                  </div>

                  <p className="text-xs text-stone-500">
                    Score: {attempt.score || 0}{' '}
                    /{' '}
                    {attempt.totalQuestions ||
                      3}{' '}
                    ({attempt.percentage ||
                      0}
                    %)
                  </p>

                </div>

                <div className="font-serif text-lg font-bold text-stone-900">
                  {attempt.percentage ||
                    0}
                  %
                </div>

              </div>
            ))}

          </div>
        )}

      </section>

    </div>
  );
};

export default Profile;