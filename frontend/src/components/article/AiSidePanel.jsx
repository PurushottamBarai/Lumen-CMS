import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MoreVertical,
  Send,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { articleAPI } from '../../services/api';

const AiSparkleIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 2C10 6.418 6.418 10 2 10C6.418 10 10 13.582 10 18C10 13.582 13.582 10 18 10C13.582 10 10 6.418 10 2Z"
      fill="#38BDF8"
    />
    <path
      d="M18 14C18 16.209 16.209 18 14 18C16.209 18 18 19.791 18 22C18 19.791 19.791 18 22 18C19.791 18 18 16.209 18 14Z"
      fill="#A78BFA"
    />
  </svg>
);

const AiSidePanel = ({ articleId, title = 'Article', initialSummary = null, onClose }) => {
  const [summary, setSummary] = useState(initialSummary);
  const [isLoadingSummary, setIsLoadingSummary] = useState(!initialSummary);
  const [summaryError, setSummaryError] = useState(null);
  const [showMore, setShowMore] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (initialSummary) {
      setSummary(initialSummary);
      setIsLoadingSummary(false);
      return;
    }

    if (!articleId) return;

    let isMounted = true;
    const fetchSummary = async () => {
      try {
        setIsLoadingSummary(true);
        setSummaryError(null);
        const response = await articleAPI.getArticleSummary(articleId);

        if (!isMounted) return;

        if (response.data && response.data.summary) {
          setSummary(response.data.summary);
        } else {
          handleGenerateSummary(false);
          return;
        }
      } catch (err) {
        if (!isMounted) return;
        handleGenerateSummary(false);
      } finally {
        if (isMounted) setIsLoadingSummary(false);
      }
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [articleId, initialSummary]);

  const handleGenerateSummary = async (force = false) => {
    if (!articleId) return;
    try {
      setIsLoadingSummary(true);
      setSummaryError(null);
      const response = await articleAPI.generateArticleSummary(articleId, force);
      if (response.data && response.data.summary) {
        setSummary(response.data.summary);
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setSummaryError(serverMessage || 'Unable to generate summary, please try again later.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleSendMessage = async (queryText) => {
    const messageToSend = (queryText || inputQuery).trim();
    if (!messageToSend || isChatLoading) return;

    const userMessage = { role: 'user', content: messageToSend };
    const updatedHistory = [...chatMessages, userMessage];

    setChatMessages(updatedHistory);
    setInputQuery('');
    setChatError(null);
    setIsChatLoading(true);

    try {
      const response = await articleAPI.chatWithArticle(articleId, {
        message: messageToSend,
        history: updatedHistory.slice(-6)
      });

      if (response.data && response.data.reply) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.data.reply }
        ]);
      }
    } catch (err) {
      setChatError('Unable to answer right now, please try again.');
    } finally {
      setIsChatLoading(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const quickActionPrompts = [
    'Explain key takeaways in simple terms',
    'What are the core technical tradeoffs?',
    'Summarize this into 3 actionable points'
  ];

  const visibleTakeaways = summary?.keyTakeaways
    ? (showMore ? summary.keyTakeaways : summary.keyTakeaways.slice(0, 2))
    : [];

  return (
    <aside className="w-full bg-[#1E2024] text-stone-200 rounded-3xl border border-[#32363C] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sticky top-24 transition-all">
      {/* Top Header */}
      <div className="px-5 py-4 border-b border-[#2F3238] flex items-center justify-between shrink-0 bg-[#25282D]/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <AiSparkleIcon className="w-5 h-5" />
          <h3 className="font-semibold text-white text-sm sm:text-base tracking-tight">
            Summary
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-stone-400">
          <button
            onClick={() => handleGenerateSummary(true)}
            title="Regenerate Summary"
            className="p-1.5 hover:text-white hover:bg-stone-800 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close Panel"
              className="p-1.5 hover:text-white hover:bg-stone-800 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-xs sm:text-sm leading-relaxed scrollbar-thin scrollbar-thumb-stone-700">
        {/* Loading Summary */}
        {isLoadingSummary && (
          <div className="space-y-3 py-3 animate-pulse">
            <div className="h-4 bg-stone-700/60 rounded w-4/5"></div>
            <div className="h-3 bg-stone-700/40 rounded w-full"></div>
            <div className="h-3 bg-stone-700/40 rounded w-3/4"></div>
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-stone-800 rounded w-2/3"></div>
              <div className="h-3 bg-stone-800 rounded w-5/6"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {summaryError && !summary && (
          <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700 text-stone-300 space-y-2">
            <p className="text-xs">{summaryError}</p>
            <button
              onClick={() => handleGenerateSummary(true)}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Structured Summary Body */}
        {summary && (
          <div className="space-y-4">
            <p className="text-stone-300 leading-relaxed font-normal">
              {summary.executiveSummary ||
                `Here is a structured overview and key analysis of ${title}:`}
            </p>

            {/* Hierarchical Bullet Points */}
            {visibleTakeaways.length > 0 && (
              <ul className="space-y-3 pl-1">
                {visibleTakeaways.map((item, idx) => (
                  <li key={item.id || idx} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-sky-400 font-bold">•</span>
                      <strong className="text-white font-semibold">
                        {item.title}
                      </strong>
                    </div>
                    <div className="flex items-start gap-2 pl-4 text-stone-300">
                      <span className="text-stone-500 font-bold">◦</span>
                      <p className="leading-relaxed">{item.point}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Show More / Show Less Toggle */}
            {summary.keyTakeaways && summary.keyTakeaways.length > 2 && (
              <button
                onClick={() => setShowMore(!showMore)}
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition flex items-center gap-1 pt-1"
              >
                <span>{showMore ? 'Show less' : 'Show more'}</span>
                {showMore ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Quick Action Suggestion Chips */}
        <div className="space-y-2 pt-2 border-t border-[#2F3238]">
          <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
            Suggested Queries
          </span>
          <div className="space-y-1.5">
            {quickActionPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isChatLoading}
                className="w-full text-left p-3 rounded-2xl bg-[#272A2F] hover:bg-[#31353B] border border-[#363A42] text-xs text-stone-200 transition-colors shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Message History */}
        {chatMessages.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-[#2F3238]">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
              Conversation
            </span>
            <div className="space-y-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs sm:text-sm max-w-[90%] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-sky-600 text-white rounded-br-xs'
                        : 'bg-[#2A2D33] text-stone-200 border border-[#383C44] rounded-bl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#2A2D33] text-stone-400 text-xs border border-[#383C44]">
                  <AiSparkleIcon className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}

              {chatError && (
                <p className="text-xs text-rose-400">{chatError}</p>
              )}

              <div ref={chatBottomRef} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Chat Input & Feedback Area */}
      <div className="p-3.5 bg-[#25282D] border-t border-[#2F3238] shrink-0 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about this article..."
            className="w-full pl-4 pr-11 py-2.5 rounded-full bg-[#181A1D] border border-[#363A42] text-xs text-white placeholder-stone-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isChatLoading}
            className="absolute right-1.5 p-2 rounded-full bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white transition shadow-xs"
            title="Send query"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>


      </div>
    </aside>
  );
};

export default AiSidePanel;
