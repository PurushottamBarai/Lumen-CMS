import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowUpDown,
  ExternalLink,
  Edit,
  Share2,
  Download,
  Filter,
  Check,
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
  Flame,
} from 'lucide-react';
import { authorAnalyticsAPI } from '../../services/api';

const DetailedAnalyticsTable = ({ articles = [], onShareSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortField, setSortField] = useState('views');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [copiedId, setCopiedId] = useState(null);

  // Available categories in current set
  const categories = useMemo(() => {
    const set = new Set();
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [articles]);

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtered & Sorted Articles
  const filteredArticles = useMemo(() => {
    return articles
      .filter((a) => {
        const matchesSearch =
          (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.tags || []).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
          selectedStatus === 'all' || (a.status || '').toLowerCase() === selectedStatus.toLowerCase();

        const matchesCategory =
          selectedCategory === 'all' || (a.category || '').toLowerCase() === selectedCategory.toLowerCase();

        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [articles, searchTerm, selectedStatus, selectedCategory, sortField, sortOrder]);

  // Share handler
  const handleShare = async (articleId, title) => {
    try {
      const shareUrl = `${window.location.origin}/browse/${articleId}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopiedId(articleId);
      setTimeout(() => setCopiedId(null), 2500);

      // Record share in analytics backend
      await authorAnalyticsAPI.shareArticle(articleId, 'clipboard');
      if (onShareSuccess) {
        onShareSuccess(articleId);
      }
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'Article ID',
      'Title',
      'Category',
      'Status',
      'Views',
      'Likes',
      'Comments',
      'Shares',
      'Engagement Rate (%)',
      'Performance Tier',
      'Published Date',
    ];

    const rows = filteredArticles.map((a) => [
      `"${a._id || a.id}"`,
      `"${(a.title || '').replace(/"/g, '""')}"`,
      `"${a.category || 'General'}"`,
      `"${a.status}"`,
      a.views || 0,
      a.likes || 0,
      a.commentsCount || 0,
      a.shares || 0,
      `"${a.engagementRate || 0}%"`,
      `"${a.performanceTier || 'Steady'}"`,
      `"${new Date(a.publishedAt || a.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `author-performance-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Viral':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
            <Flame className="w-3 h-3 text-purple-600" />
            Viral
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            High
          </span>
        );
      case 'Steady':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Steady
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
            Emerging
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#F5F2EB]">
        <div>
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Article-by-Article Performance Matrix
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Showing {filteredArticles.length} of {articles.length} authored items
          </p>
        </div>

        {/* Filter Controls & CSV Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, tags..."
              className="pl-8 pr-3 py-1.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#1A382B] w-48 sm:w-56"
            />
          </div>

          {/* Status selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs font-medium text-stone-700 outline-none focus:ring-2 focus:ring-[#1A382B]"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="pending">In Review</option>
          </select>

          {/* Category selector */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs font-medium text-stone-700 outline-none focus:ring-2 focus:ring-[#1A382B]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EDE8DF] rounded-xl text-xs font-bold text-stone-700 transition"
            title="Export Performance CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#EDE8DF] text-[11px] uppercase tracking-wider text-stone-500 font-semibold bg-[#FAF7F2]/50">
              <th className="py-3 px-3">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1 hover:text-stone-900"
                >
                  <span>Article Title</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-2">Category</th>
              <th className="py-3 px-2 text-right">
                <button
                  onClick={() => handleSort('views')}
                  className="flex items-center gap-1 ml-auto hover:text-stone-900"
                >
                  <span>Views</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-2 text-right">
                <button
                  onClick={() => handleSort('likes')}
                  className="flex items-center gap-1 ml-auto hover:text-stone-900"
                >
                  <span>Likes</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-2 text-right">
                <button
                  onClick={() => handleSort('commentsCount')}
                  className="flex items-center gap-1 ml-auto hover:text-stone-900"
                >
                  <span>Comments</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-2 text-right">
                <button
                  onClick={() => handleSort('shares')}
                  className="flex items-center gap-1 ml-auto hover:text-stone-900"
                >
                  <span>Shares</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-2 text-right">
                <button
                  onClick={() => handleSort('engagementRate')}
                  className="flex items-center gap-1 ml-auto hover:text-stone-900"
                >
                  <span>Eng. Rate</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-2 text-center">Tier</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F2EB]">
            {filteredArticles.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-stone-400">
                  No articles matched your filter criteria.
                </td>
              </tr>
            ) : (
              filteredArticles.map((art) => {
                const articleId = art._id || art.id;
                const isCopied = copiedId === articleId;

                return (
                  <tr
                    key={articleId}
                    className="hover:bg-[#FAF7F2]/60 transition-colors group"
                  >
                    {/* Title */}
                    <td className="py-3 px-3 max-w-xs sm:max-w-md">
                      <Link
                        to={`/browse/${articleId}`}
                        className="font-medium text-stone-900 hover:text-[#1A382B] hover:underline line-clamp-1 block"
                        title={art.title}
                      >
                        {art.title}
                      </Link>
                      <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-2">
                        <span>
                          {art.publishedAt
                            ? new Date(art.publishedAt).toLocaleDateString()
                            : 'Draft'}
                        </span>
                        {art.tags?.length > 0 && (
                          <span className="hidden sm:inline">
                            • {art.tags.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold text-[10px] uppercase">
                        {art.category || 'General'}
                      </span>
                    </td>

                    {/* Views */}
                    <td className="py-3 px-2 text-right font-mono font-bold text-stone-900">
                      {(art.views || 0).toLocaleString()}
                    </td>

                    {/* Likes */}
                    <td className="py-3 px-2 text-right font-mono text-rose-700">
                      {(art.likes || 0).toLocaleString()}
                    </td>

                    {/* Comments */}
                    <td className="py-3 px-2 text-right font-mono text-stone-600">
                      {(art.commentsCount || 0).toLocaleString()}
                    </td>

                    {/* Shares */}
                    <td className="py-3 px-2 text-right font-mono text-blue-700">
                      {(art.shares || 0).toLocaleString()}
                    </td>

                    {/* Engagement Rate */}
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-800">
                      {art.engagementRate}%
                    </td>

                    {/* Performance Tier */}
                    <td className="py-3 px-2 text-center">
                      {getTierBadge(art.performanceTier)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleShare(articleId, art.title)}
                          className={`p-1.5 rounded-lg border transition ${
                            isCopied
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100 border-transparent'
                          }`}
                          title="Copy Share Link & Record Citation"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <Link
                          to={`/write/${articleId}`}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition"
                          title="Edit Article"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          to={`/browse/${articleId}`}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition"
                          title="Read Article"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
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
  );
};

export default DetailedAnalyticsTable;
