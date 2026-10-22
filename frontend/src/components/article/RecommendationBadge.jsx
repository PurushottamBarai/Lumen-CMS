import React, { useState, useEffect } from 'react';
import { Info, Link2, TrendingUp, Sparkles } from 'lucide-react';
import { articleAPI } from '../../services/api';

const RecommendationBadge = ({
  type = 'trending',
  articleId,
  customText,
  sourceTitle,
  category,
  variant = 'blue'
}) => {
  const [explanation, setExplanation] = useState(customText || '');

  useEffect(() => {
    if (customText) {
      setExplanation(customText);
      return;
    }

    if (!articleId) {
      // Default fallback explanations based on type
      if (type === 'trending') {
        setExplanation('High engagement velocity and consistent reader saves this week.');
      } else if (type === 'linked') {
        setExplanation('Shares technical concepts and complementary system architectures.');
      } else {
        setExplanation(`Top rated piece in ${category || 'Technology'} with high retention.`);
      }
      return;
    }

    let isMounted = true;
    const fetchExplanation = async () => {
      try {
        const response = await articleAPI.getRecommendationExplanation(articleId, {
          type,
          sourceTitle,
          category
        });
        if (isMounted && response.data && response.data.explanation) {
          setExplanation(response.data.explanation);
        }
      } catch (err) {
        if (isMounted) {
          if (type === 'trending') {
            setExplanation('Surging reader interest and strong peer recommendations.');
          } else if (type === 'linked') {
            setExplanation('Direct conceptual relation and architectural continuity.');
          } else {
            setExplanation(`Popular editorial selection in ${category || 'Technology'}.`);
          }
        }
      }
    };

    fetchExplanation();
    return () => {
      isMounted = false;
    };
  }, [articleId, type, customText, sourceTitle, category]);

  if (!explanation) return null;

  const isSlate = variant === 'slate';
  const label = type === 'linked' ? 'Why Linked:' : type === 'trending' ? 'Why Trending:' : 'Why Recommended:';

  return (
    <div
      className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 shadow-2xs my-2 transition-all ${
        isSlate
          ? 'bg-slate-50 border-slate-200/90 text-slate-700'
          : 'bg-blue-50/80 border-blue-100/90 text-blue-900'
      }`}
    >
      {type === 'linked' ? (
        <Link2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
      ) : type === 'trending' ? (
        <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
      ) : (
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <strong className={`font-semibold mr-1 ${isSlate ? 'text-slate-900' : 'text-blue-950'}`}>
          {label}
        </strong>
        <span>{explanation}</span>
      </div>
    </div>
  );
};

export default RecommendationBadge;
