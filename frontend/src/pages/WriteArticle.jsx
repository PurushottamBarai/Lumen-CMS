import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  articleAPI,
  quizAPI,
  contentQualityAPI,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import FreshnessAuditBox from '../components/article/FreshnessAuditBox';
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  X,
  AlertCircle,
  Video,
  HelpCircle,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react';

const WriteArticle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const isEditMode = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keyTakeaways, setKeyTakeaways] = useState([]);
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);

  const [articleStatus, setArticleStatus] = useState('draft');

  // Toggle-Gated Quiz Builder State
  const [quizEnabled, setQuizEnabled] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([
    {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
    },
  ]);

  const [loadingArticle, setLoadingArticle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
// Content Quality Analysis
const [qualityLoading, setQualityLoading] = useState(false);
const [qualityResult, setQualityResult] = useState(null);
const [qualityError, setQualityError] = useState('');
const [qualitySignature, setQualitySignature] = useState('');
const [suggestionsLoading, setSuggestionsLoading] = useState(false);
const [suggestionsResult, setSuggestionsResult] = useState(null);
const [suggestionsSignature, setSuggestionsSignature] = useState('');
const [suggestionsError, setSuggestionsError] = useState('');
const [suggestionDecisions, setSuggestionDecisions] = useState({});
  useEffect(() => {
    if (isEditMode) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    setLoadingArticle(true);
    setErrorMsg('');

    try {
      const response = await articleAPI.getMyArticleById(id);

      if (response.data.success) {
        const article = response.data.article;

        setTitle(article.title || '');
        setDescription(article.description || '');
        setKeyTakeaways(article.keyTakeaways || []);
        setCategory(article.category || '');
        setContent(article.content || '');
        setVideoUrl(article.videoUrl || '');
        setTags(article.tags || []);
        setArticleStatus(article.status || 'draft');

        // Check if quiz exists for article
        try {
          const quizRes = await quizAPI.getQuizByArticleId(id);
          if (quizRes.data?.success && quizRes.data?.quiz) {
            setQuizEnabled(true);
            setQuizQuestions(quizRes.data.quiz.questions || []);
          }
        } catch (qErr) {}
      } else {
        setErrorMsg(response.data.message || 'Failed to load article.');
      }
    } catch (error) {
      console.error('[Load Article Error]:', error);
      setErrorMsg(
        error.response?.data?.message ||
          'Failed to load article. Please try again.'
      );
    } finally {
      setLoadingArticle(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (tags.includes(tag)) {
      setTagInput('');
      return;
    }
    setTags([...tags, tag]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Quiz Builder Handlers
  const handleAddQuizQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
      },
    ]);
  };

  const handleRemoveQuizQuestion = (qIdx) => {
    setQuizQuestions(quizQuestions.filter((_, idx) => idx !== qIdx));
  };

  const handleQuestionTextChange = (qIdx, text) => {
    const updated = [...quizQuestions];
    updated[qIdx].question = text;
    setQuizQuestions(updated);
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    const updated = [...quizQuestions];
    updated[qIdx].options[optIdx] = val;
    // If setting option that was correct answer, sync it
    if (updated[qIdx].correctAnswer === updated[qIdx].options[optIdx]) {
      updated[qIdx].correctAnswer = val;
    }
    setQuizQuestions(updated);
  };

  const handleSetCorrectAnswer = (qIdx, optVal) => {
    const updated = [...quizQuestions];
    updated[qIdx].correctAnswer = optVal;
    setQuizQuestions(updated);
  };

  const isArticleComplete =
    title.trim() &&
    category.trim() &&
    tags.length > 0 &&
    content.trim();

  const getCurrentQualitySignature = () =>
    JSON.stringify({ title, description, content, category, tags });
  const qualityIsCurrent =
    Boolean(qualityResult) &&
    qualitySignature === getCurrentQualitySignature();

  const validateArticle = () => {
    if (!title.trim()) {
      setErrorMsg('Article title is required.');
      return false;
    }
    if (!category.trim()) {
      setErrorMsg('Please select a category.');
      return false;
    }
    if (tags.length === 0) {
      setErrorMsg('Please add at least one tag.');
      return false;
    }
    if (!content.trim()) {
      setErrorMsg('Article content is required.');
      return false;
    }

    if (quizEnabled) {
      for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i];
        if (!q.question.trim()) {
          setErrorMsg(`Quiz Question ${i + 1} text is required.`);
          return false;
        }
        if (q.options.some((opt) => !opt.trim())) {
          setErrorMsg(`All 4 options are required for Quiz Question ${i + 1}.`);
          return false;
        }
        if (!q.correctAnswer) {
          setErrorMsg(`Please select a correct answer for Quiz Question ${i + 1}.`);
          return false;
        }
      }
    }

    return true;
  };
  const handleAnalyzeContent = async () => {
  setQualityError('');
  setQualityResult(null);

  if (!title.trim() && !content.trim()) {
    setQualityError(
      'Please enter an article title or content before analyzing.'
    );
    return;
  }

  setQualityLoading(true);

  const analysisSignature = getCurrentQualitySignature();
  try {
    const response = await contentQualityAPI.analyze({
      title: title.trim(),
      description: description.trim(),
      content: content.trim(),
      category: category.trim(),
      tags,
      articleId: id || null,
    });

    if (response.data?.success) {
      setQualityResult(response.data.analysis);
      setQualitySignature(analysisSignature);
    } else {
      setQualityError(
        response.data?.message ||
          'Failed to analyze article content.'
      );
    }
  } catch (error) {
    console.error(
      '[Content Quality Error]:',
      error
    );

    setQualityError(
      error.response?.data?.message ||
        'Unable to analyze content. Please try again.'
    );
  } finally {
    setQualityLoading(false);
  }
};

  const handleGenerateSuggestions = async () => {
    setSuggestionsError('');
    setSuggestionsResult(null);
    setSuggestionDecisions({});

    if (!content.trim()) {
      setSuggestionsError('Add article content before requesting AI suggestions.');
      return;
    }

    const suggestionSignature = getCurrentQualitySignature();
    setSuggestionsLoading(true);
    try {
      const response = await contentQualityAPI.suggest({
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        category: category.trim(),
        tags,
      });

      if (response.data?.success && response.data?.suggestions) {
        if (suggestionSignature !== getCurrentQualitySignature()) {
          setSuggestionsError(
            'The article changed while suggestions were generating. Request fresh suggestions for the current draft.'
          );
          return;
        }
        setSuggestionsResult(response.data.suggestions);
        setSuggestionsSignature(suggestionSignature);
      } else {
        setSuggestionsError(
          response.data?.message || 'Failed to generate AI suggestions.'
        );
      }
    } catch (error) {
      console.error('[AI Content Suggestions Error]:', error);
      setSuggestionsError(
        error.response?.data?.message ||
          'Unable to generate AI suggestions. Please try again.'
      );
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const decideSuggestion = (key, decision, applySuggestion) => {
    if (decision === 'accepted' && applySuggestion?.() === false) return;
    setSuggestionDecisions((previous) => ({
      ...previous,
      [key]: decision,
    }));
  };

  const acceptWritingSuggestion = (suggestion, key) => {
    const occurrences = content.split(suggestion.original).length - 1;
    if (occurrences !== 1) {
      setSuggestionsError(
        'This passage has changed since the suggestion was generated. Generate fresh suggestions to apply it.'
      );
      return false;
    }

    setContent(content.replace(suggestion.original, suggestion.replacement));
    setSuggestionsError('');
    return true;
  };

  const renderSuggestionActions = (key, applySuggestion) => {
    const decision = suggestionDecisions[key];
    if (decision) {
      return (
        <span className="text-xs font-semibold text-stone-500">
          {decision === 'accepted' ? 'Accepted' : 'Rejected'}
        </span>
      );
    }

    return (
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => decideSuggestion(key, 'accepted', applySuggestion)}
          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => decideSuggestion(key, 'rejected')}
          className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 text-xs font-semibold hover:bg-stone-200"
        >
          Reject
        </button>
      </div>
    );
  };

  const getArticleData = () => ({
    title: title.trim(),
    description: description.trim(),
    keyTakeaways,
    category: category.trim(),
    tags,
    content: content.trim(),
    videoUrl: videoUrl.trim(),
    quiz: {
      enabled: quizEnabled,
    },
  });

  const saveAssociatedQuiz = async (articleId) => {
    if (!quizEnabled || quizQuestions.length === 0) return;

    try {
      await quizAPI.createQuiz({
        title: `${title.trim()} — Knowledge Checkpoint`,
        description: `Quiz checkpoint for article: ${title.trim()}`,
        articleId,
        questions: quizQuestions,
      });
    } catch (qErr) {
      console.warn('[Save Quiz Warning]:', qErr.message);
    }
  };

  const handleSaveDraft = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!validateArticle()) return;

    setSaving(true);

    try {
      const articleData = getArticleData();
      let response;

      if (isEditMode) {
        response = await articleAPI.updateArticle(id, articleData);
      } else {
        response = await articleAPI.createArticle({
          ...articleData,
          status: 'draft',
        });
      }

      if (response.data.success) {
        const savedId = response.data.article?._id || id;
        await saveAssociatedQuiz(savedId);
        navigate('/profile');
      } else {
        setErrorMsg(response.data.message || 'Failed to save article.');
      }
    } catch (error) {
      console.error('[Save Article Error]:', error);
      setErrorMsg(
        error.response?.data?.message ||
          'Failed to save article. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!validateArticle()) return;

    setSubmitting(true);

    try {
      const articleData = getArticleData();
      let articleId = id;

      if (!isEditMode) {
        const createResponse = await articleAPI.createArticle({
          ...articleData,
          status: 'draft',
        });

        if (!createResponse.data.success) {
          setErrorMsg(createResponse.data.message || 'Failed to create article.');
          return;
        }

        articleId = createResponse.data.article._id;
      } else {
        const updateResponse = await articleAPI.updateArticle(articleId, articleData);
        if (!updateResponse.data.success) {
          setErrorMsg(updateResponse.data.message || 'Failed to update article.');
          return;
        }
      }

      await saveAssociatedQuiz(articleId);

      const submitResponse = await articleAPI.submitArticle(articleId);

      if (submitResponse.data.success) {
        navigate('/article-confirmation');
      } else {
        setErrorMsg(
          submitResponse.data.message ||
            'Article was saved but could not be submitted.'
        );
      }
    } catch (error) {
      console.error('[Submit Article Error]:', error);
      setErrorMsg(
        error.response?.data?.message ||
          'Failed to submit article. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingArticle) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-10 text-center">
          <p className="text-sm text-stone-500">Loading article...</p>
        </div>
      </div>
    );
  }

  const isPendingReview = isEditMode && articleStatus === 'pending';
  const contentWordCount = content.trim()
    ? content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const hasHeadings = /^#{1,6}\s+.+/m.test(content);
  const suggestionsAreCurrent =
    Boolean(suggestionsResult) &&
    suggestionsSignature === getCurrentQualitySignature();
  const qualityChecklist = [
    { label: 'Article title', complete: Boolean(title.trim()), required: true },
    { label: 'Category selected', complete: Boolean(category.trim()), required: true },
    { label: 'At least one tag', complete: tags.length > 0, required: true },
    { label: 'Article content added', complete: Boolean(content.trim()), required: true },
    { label: 'Short summary', complete: Boolean(description.trim()), required: false },
    { label: 'At least 300 words', complete: contentWordCount >= 300, required: false },
    { label: 'Section headings', complete: hasHeadings, required: false },
    {
      label: 'Grammar review',
      complete: qualityIsCurrent ? qualityResult.grammar?.issueCount === 0 : null,
      required: false,
    },
    {
      label: 'Readability review',
      complete: qualityIsCurrent ? qualityResult.readability?.score >= 60 : null,
      required: false,
    },
    {
      label: 'Clarity review',
      complete: qualityIsCurrent ? qualityResult.clarity?.score >= 70 : null,
      required: false,
    },
    {
      label: 'Repetition review',
      complete: qualityIsCurrent ? qualityResult.repetition?.issueCount === 0 : null,
      required: false,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              {isEditMode ? 'Edit Article' : 'Write an Article'}
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              {isEditMode
                ? 'Update your article and save your changes.'
                : 'Share your knowledge and ideas with the Lumen community.'}
            </p>
          </div>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Draft autosaved
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {isPendingReview && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-sm">
          This article is currently under admin review and cannot be edited until review is completed.
        </div>
      )}

      {/* Article Form */}
      <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-stone-900 mb-2">
            Article Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your article title..."
            maxLength={200}
            disabled={isPendingReview}
            className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#1A382B] disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-stone-900 mb-2">
            Summary <span className="font-normal text-stone-400">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a short summary of your article..."
            maxLength={500}
            rows={3}
            disabled={isPendingReview}
            className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-sm text-stone-900 leading-relaxed focus:outline-none focus:border-[#1A382B] resize-y disabled:opacity-60"
          />
          <p className="text-right mt-1 text-xs text-stone-400">
            {description.length}/500 characters
          </p>
        </div>

        {/* Category + Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-stone-900 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isPendingReview}
              className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#1A382B] disabled:opacity-60"
            >
              <option value="">Select category</option>
              <option value="Technology">Technology</option>
              <option value="Science">Science</option>
              <option value="History">History</option>
              <option value="Culture">Culture</option>
              <option value="Education">Education</option>
              <option value="Environment">Environment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-bold text-stone-900 mb-2">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag..."
                disabled={isPendingReview}
                className="flex-1 min-w-0 px-4 py-3 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#1A382B] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={isPendingReview}
                className="px-4 py-3 bg-[#EFECE6] border border-[#E2DDD3] rounded-xl text-stone-800 hover:bg-[#E7E2D9] disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F1EEE8] text-stone-700 rounded-full text-xs"
                  >
                    #{tag}
                    {!isPendingReview && (
                      <button type="button" onClick={() => handleRemoveTag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {keyTakeaways.length > 0 && (
          <div className="p-4 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl">
            <h3 className="text-sm font-bold text-stone-900 mb-3">Key Takeaways</h3>
            <ul className="space-y-2">
              {keyTakeaways.map((takeaway, index) => (
                <li key={`${takeaway}-${index}`} className="flex items-start gap-2 text-sm text-stone-700">
                  <span className="mt-1 text-[#D97736]">•</span>
                  <span className="flex-1">{takeaway}</span>
                  {!isPendingReview && (
                    <button
                      type="button"
                      onClick={() =>
                        setKeyTakeaways((previous) =>
                          previous.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                      aria-label={`Remove takeaway ${index + 1}`}
                      className="text-stone-400 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Content */}
        <div>
          <label className="block text-sm font-bold text-stone-900 mb-2">
            Article Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your article here..."
            rows={14}
            disabled={isPendingReview}
            className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-sm text-stone-900 leading-relaxed focus:outline-none focus:border-[#1A382B] resize-y disabled:opacity-60 font-serif"
          />
          <div className="flex justify-between mt-2 text-xs text-stone-400">
            <span>Average reading time is calculated automatically.</span>
            <span>{content.trim() ? content.trim().split(/\s+/).length : 0} words</span>
          </div>
        </div>

        {/* Optional Video */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-4 h-4 text-stone-500" />
            <label className="text-sm font-bold text-stone-900">
              Video <span className="font-normal text-stone-400">(Optional)</span>
            </label>
          </div>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Paste a YouTube or video URL..."
            disabled={isPendingReview}
            className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#1A382B] disabled:opacity-60"
          />
        </div>
{/* ------------------------------------------------ */}
{/* AI Writing Suggestions & Content Quality */}
{/* ------------------------------------------------ */}
<div className="pt-6 border-t border-[#F5F2EB]">
  <FreshnessAuditBox title={title} content={content} />
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
    <div>
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#D97736]" />
        <h3 className="font-serif font-bold text-stone-900">
          AI Writing Suggestions & Content Quality
        </h3>
      </div>

      <p className="text-xs text-stone-500 mt-1">
        Get editorial suggestions and review grammar, readability, clarity, repetition and structure.
      </p>
    </div>

    <div className="flex flex-col sm:flex-row gap-2">
      <button
        type="button"
        onClick={handleGenerateSuggestions}
        disabled={suggestionsLoading || isPendingReview || !content.trim()}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1A382B] hover:bg-[#11261D] text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-4 h-4" />
        {suggestionsLoading ? 'Generating...' : 'Get AI Suggestions'}
      </button>
      <button
        type="button"
        onClick={handleAnalyzeContent}
        disabled={
          qualityLoading ||
          isPendingReview ||
          (!title.trim() && !content.trim())
        }
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EFECE6] hover:bg-[#E7E2D9] text-stone-800 border border-[#E2DDD3] rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {qualityLoading ? 'Analyzing...' : 'Analyze Quality'}
      </button>
    </div>
  </div>

  {suggestionsError && (
    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {suggestionsError}
    </div>
  )}

  {suggestionsResult && !suggestionsAreCurrent && (
    <p className="mb-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
      The article changed after these suggestions were generated. Generate fresh suggestions before applying them.
    </p>
  )}

  {suggestionsResult && (
    <div className="mb-5 space-y-3">
      <div className="p-4 border border-[#EDE8DF] rounded-2xl bg-[#FAF7F2]">
        <h4 className="text-sm font-bold text-stone-900 mb-3">Alternative titles</h4>
        <div className="space-y-2">
          {suggestionsResult.titleSuggestions.map((suggestion, index) => {
            const key = `title-${index}`;
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#EDE8DF]">
                <p className="text-sm text-stone-800">{suggestion}</p>
                {renderSuggestionActions(key, () => setTitle(suggestion))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border border-[#EDE8DF] rounded-2xl bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-stone-900 mb-1">Suggested summary</h4>
            <p className="text-sm text-stone-700">{suggestionsResult.summary}</p>
          </div>
          {renderSuggestionActions('summary', () =>
            setDescription(suggestionsResult.summary)
          )}
        </div>
      </div>

      <div className="p-4 border border-[#EDE8DF] rounded-2xl bg-white">
        <h4 className="text-sm font-bold text-stone-900 mb-3">Key takeaways</h4>
        <div className="space-y-2">
          {suggestionsResult.keyTakeaways.map((takeaway, index) => {
            const key = `takeaway-${index}`;
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#FAF7F2] rounded-xl">
                <p className="text-sm text-stone-700">{takeaway}</p>
                {renderSuggestionActions(key, () =>
                  setKeyTakeaways((previous) =>
                    previous.length < 5 && !previous.includes(takeaway)
                      ? [...previous, takeaway]
                      : previous
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border border-[#EDE8DF] rounded-2xl bg-white">
        <h4 className="text-sm font-bold text-stone-900 mb-3">Relevant tags</h4>
        <div className="space-y-2">
          {suggestionsResult.tags.map((tag, index) => {
            const key = `tag-${index}`;
            return (
              <div key={key} className="flex items-center justify-between gap-3 p-3 bg-[#FAF7F2] rounded-xl">
                <span className="text-sm text-stone-700">#{tag}</span>
                {renderSuggestionActions(key, () =>
                  setTags((previous) =>
                    previous.some((currentTag) => currentTag.toLowerCase() === tag.toLowerCase())
                      ? previous
                      : [...previous, tag]
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border border-[#EDE8DF] rounded-2xl bg-white">
        <h4 className="text-sm font-bold text-stone-900 mb-3">Writing improvements</h4>
        {suggestionsResult.writingSuggestions.length === 0 ? (
          <p className="text-xs text-stone-500">No specific sentence edits were returned for this draft.</p>
        ) : (
          <div className="space-y-3">
            {suggestionsResult.writingSuggestions.map((suggestion, index) => {
              const key = `writing-${index}`;
              return (
                <div key={key} className="p-3 bg-[#FAF7F2] rounded-xl space-y-2">
                  <p className="text-xs text-stone-500">{suggestion.reason}</p>
                  <p className="text-sm text-stone-700">
                    <span className="line-through text-stone-400">{suggestion.original}</span>
                    <span className="mx-2 text-[#D97736]">→</span>
                    <span>{suggestion.replacement}</span>
                  </p>
                  <div className="flex justify-end">
                    {renderSuggestionActions(key, () =>
                      acceptWritingSuggestion(suggestion, key)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )}

  {/* Analysis Error */}
  {qualityError && (
    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {qualityError}
    </div>
  )}

  {/* Analysis Result */}
  {qualityResult && !qualityIsCurrent && (
    <p className="mb-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
      The article changed after this review. Analyze quality again to refresh the results.
    </p>
  )}

  {qualityIsCurrent && qualityResult && (
    <div className="space-y-4">

      {/* Overall Score */}
      <div className="p-5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Overall Quality Score
            </p>

            <p className="text-3xl font-bold text-[#1A382B] mt-1">
              {qualityResult.score}/100
            </p>
          </div>

          <div
            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-sm font-bold ${
              qualityResult.score >= 80
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                : qualityResult.score >= 60
                ? 'border-amber-500 text-amber-700 bg-amber-50'
                : 'border-rose-500 text-rose-700 bg-rose-50'
            }`}
          >
            {qualityResult.score}
          </div>
        </div>
      </div>

      {/* Quality Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">

        {/* Grammar */}
        <div className="p-4 border border-[#EDE8DF] rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-stone-900">
              Grammar
            </span>

            {qualityResult.grammar?.issueCount === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            )}
          </div>

          <p className="text-xs text-stone-500">
            {qualityResult.grammar?.issueCount || 0} issue(s) detected
          </p>
        </div>

        {/* Readability */}
        <div className="p-4 border border-[#EDE8DF] rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-stone-900">
              Readability
            </span>

            <span className="text-sm font-bold text-[#1A382B]">
              {qualityResult.readability?.score || 0}/100
            </span>
          </div>

          <p className="text-xs text-stone-500">
            {qualityResult.readability?.level || 'Not available'}
          </p>

          <p className="text-xs text-stone-400 mt-1">
            {qualityResult.readability?.wordCount || 0} words ·{' '}
            {qualityResult.readability?.sentenceCount || 0} sentences
          </p>
        </div>

        {/* Clarity */}
        <div className="p-4 border border-[#EDE8DF] rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-stone-900">Clarity</span>
            <span className="text-sm font-bold text-[#1A382B]">
              {qualityResult.clarity?.score || 0}/100
            </span>
          </div>
          <p className="text-xs text-stone-500">
            {qualityResult.clarity?.issueCount || 0} issue(s) detected
          </p>
        </div>

        {/* Repetition */}
        <div className="p-4 border border-[#EDE8DF] rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-stone-900">Repetition</span>
            {qualityResult.repetition?.issueCount === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <p className="text-xs text-stone-500">
            {qualityResult.repetition?.issueCount || 0} repeated term(s)
          </p>
        </div>

        {/* Structure */}
        <div className="p-4 border border-[#EDE8DF] rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-stone-900">
              Structure
            </span>

            <span className="text-sm font-bold text-[#1A382B]">
              {qualityResult.structure?.score || 0}/100
            </span>
          </div>

          <p className="text-xs text-stone-500">
            {qualityResult.structure?.checks?.filter(
              (check) => check.passed
            ).length || 0}{' '}
            checks passed
          </p>
        </div>
      </div>

      {/* Grammar Issues */}
      {qualityResult.grammar?.issues?.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <h4 className="text-sm font-bold text-amber-900 mb-3">
            Grammar & Writing Issues
          </h4>

          <ul className="space-y-2">
            {qualityResult.grammar.issues.map(
              (issue, index) => (
                <li
                  key={index}
                  className="text-xs text-amber-800 flex gap-2"
                >
                  <span>•</span>
                  <span>{issue.message}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {(qualityResult.clarity?.issues?.length > 0 ||
        qualityResult.repetition?.repeatedTerms?.length > 0) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <h4 className="text-sm font-bold text-amber-900 mb-3">
            Clarity & Repetition Findings
          </h4>
          <ul className="space-y-2">
            {qualityResult.clarity?.issues?.map((issue, index) => (
              <li key={`clarity-${index}`} className="text-xs text-amber-800">
                {issue.message}
              </li>
            ))}
            {qualityResult.repetition?.repeatedTerms?.map((item) => (
              <li key={`repeat-${item.word}`} className="text-xs text-amber-800">
                “{item.word}” appears {item.count} times; consider varying the wording where appropriate.
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Structure Checks */}
      {qualityResult.structure?.checks?.length > 0 && (
        <div className="p-4 border border-[#EDE8DF] rounded-2xl bg-white">
          <h4 className="text-sm font-bold text-stone-900 mb-3">
            Structure Checks
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {qualityResult.structure.checks.map(
              (check, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-2.5 rounded-xl ${
                    check.passed
                      ? 'bg-emerald-50'
                      : 'bg-amber-50'
                  }`}
                >
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}

                  <div>
                    <p className="text-xs font-semibold text-stone-800">
                      {check.name}
                    </p>

                    <p className="text-xs text-stone-500 mt-0.5">
                      {check.message}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Duplicate Detection */}
      <div
        className={`p-4 rounded-2xl border ${
          qualityResult.duplicates?.duplicateDetected
            ? 'bg-rose-50 border-rose-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          {qualityResult.duplicates?.duplicateDetected ? (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          )}

          <h4
            className={`text-sm font-bold ${
              qualityResult.duplicates?.duplicateDetected
                ? 'text-rose-900'
                : 'text-emerald-900'
            }`}
          >
            Duplicate Detection
          </h4>
        </div>

        <p
          className={`text-xs ${
            qualityResult.duplicates?.duplicateDetected
              ? 'text-rose-800'
              : 'text-emerald-800'
          }`}
        >
          {qualityResult.duplicates?.duplicateDetected
            ? 'Highly similar published content was detected. Review the articles below before submitting.'
            : 'No highly similar published article was detected.'}
        </p>
      </div>

      {/* Similar Articles */}
      {qualityResult.duplicates?.similarArticles?.length > 0 && (
        <div className="p-4 border border-[#EDE8DF] rounded-2xl bg-white">
          <h4 className="text-sm font-bold text-stone-900 mb-3">
            Similar Articles
          </h4>

          <div className="space-y-2">
            {qualityResult.duplicates.similarArticles.map(
              (article, index) => (
                <div
                  key={article.articleId || index}
                  className="flex items-center justify-between gap-3 p-3 bg-[#FAF7F2] rounded-xl"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">
                      {article.title}
                    </p>

                    {article.category && (
                      <p className="text-xs text-stone-500 mt-1">
                        {article.category}
                      </p>
                    )}
                  </div>

                  <span
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                      article.similarity >= 80
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {article.similarity}% similar
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {qualityResult.suggestions?.length > 0 && (
        <div className="p-4 bg-[#F1EEE8] border border-[#E2DDD3] rounded-2xl">
          <h4 className="text-sm font-bold text-stone-900 mb-3">
            Suggestions
          </h4>

          <ul className="space-y-2">
            {qualityResult.suggestions.map(
              (suggestion, index) => (
                <li
                  key={index}
                  className="text-xs text-stone-700 flex gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D97736] flex-shrink-0 mt-0.5" />
                  <span>{suggestion}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  )}
</div>
        {/* ------------------------------------------------ */}
        {/* Toggle-Gated Quiz Builder */}
        {/* ------------------------------------------------ */}
        <div className="pt-6 border-t border-[#F5F2EB] space-y-4">
          <div className="flex items-center justify-between bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE8DF]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#D97736] flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-sm">Attach Interactive Quiz</h3>
                <p className="text-xs text-stone-500">Embed a multiple-choice checkpoint at the end of your article</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={quizEnabled}
                onChange={(e) => setQuizEnabled(e.target.checked)}
                disabled={isPendingReview}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A382B]" />
            </label>
          </div>

          {/* Quiz Builder Controls */}
          {quizEnabled && (
            <div className="space-y-6 pt-2 animate-in fade-in">
              {quizQuestions.map((q, qIdx) => (
                <div key={qIdx} className="p-5 border border-[#EDE8DF] rounded-2xl space-y-4 bg-white shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-sm font-bold text-[#1A382B]">
                      Question {qIdx + 1}
                    </span>
                    {quizQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuizQuestion(qIdx)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Question Text */}
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    placeholder={`Enter Question ${qIdx + 1}...`}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#1A382B]"
                  />

                  {/* 4 Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = q.correctAnswer === opt && opt.trim() !== '';

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
                            isCorrect ? 'border-emerald-500 bg-emerald-50/50' : 'border-[#EDE8DF] bg-[#FAF7F2]'
                          }`}
                        >
                          <span className="font-bold text-xs text-stone-500 w-4">{letter}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${letter}`}
                            className="flex-1 bg-transparent text-xs text-stone-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSetCorrectAnswer(qIdx, opt)}
                            className={`p-1 rounded-full text-xs font-bold transition ${
                              isCorrect ? 'text-emerald-700 font-bold' : 'text-stone-300 hover:text-stone-500'
                            }`}
                            title="Mark as correct answer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddQuizQuestion}
                className="w-full py-3 bg-[#FAF7F2] hover:bg-[#EFECE6] border border-dashed border-[#EDE8DF] rounded-2xl text-xs font-bold text-[#1A382B] flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                Add Another Question
              </button>
            </div>
          )}
        </div>
      </div>

      {!isPendingReview && (
        <section className="p-5 bg-white border border-[#EDE8DF] rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Before you submit
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Review required details and optional quality recommendations.
              </p>
            </div>
            <span className="text-xs text-stone-500">
              Quality recommendations are advisory and do not block submission.
            </span>
            {!qualityIsCurrent && (
              <button
                type="button"
                onClick={handleAnalyzeContent}
                disabled={qualityLoading || (!title.trim() && !content.trim())}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#EFECE6] hover:bg-[#E7E2D9] text-stone-800 border border-[#E2DDD3] rounded-xl text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {qualityLoading ? 'Analyzing...' : 'Run quality review'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {qualityChecklist.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 p-2.5 rounded-xl ${
                  item.complete === true
                    ? 'bg-emerald-50'
                    : item.complete === false && item.required
                    ? 'bg-rose-50'
                    : 'bg-[#FAF7F2]'
                }`}
              >
                {item.complete === true ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : item.complete === false && item.required ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                ) : (
                  <span className="w-4 h-4 flex-shrink-0 rounded-full border border-stone-300" />
                )}
                <span className="text-xs text-stone-700">
                  {item.label}
                  {!item.required && (
                    <span className="text-stone-400"> (recommended)</span>
                  )}
                  {item.complete === null && (
                    <span className="text-stone-400"> — analyze to review</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action Buttons */}
      {!isPendingReview && (
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || submitting}
            className="inline-flex justify-center items-center gap-2 px-5 py-3 bg-[#EFECE6] hover:bg-[#E7E2D9] text-stone-800 border border-[#E2DDD3] rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isArticleComplete || saving || submitting}
            className={`inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition ${
              isArticleComplete
                ? 'bg-[#1A382B] hover:bg-[#11261D] text-white'
                : 'bg-[#DCE5DF] text-[#8B9B92] cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            {submitting
              ? 'Submitting...'
              : isEditMode && ['changes_requested', 'rejected'].includes(articleStatus)
              ? 'Resubmit Article'
              : 'Publish Article'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WriteArticle;