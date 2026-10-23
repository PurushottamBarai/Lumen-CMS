import React from 'react';
import { Sparkles, Info } from 'lucide-react';

/**
 * Lumen 2 Style "Why Recommended" Badge
 */
export const RecommendationBadge = ({ recommendation, className = '' }) => {
  if (!recommendation || !recommendation.explanation) {
    return null;
  }

  const { badgeText = 'Why Recommended', explanation } = recommendation;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/90 shadow-2xs transition-all hover:bg-blue-100 ${className}`}
      title={explanation}
    >
      <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />
      <span className="font-semibold text-blue-800">{badgeText}:</span>
      <span className="truncate max-w-[220px] text-blue-700 font-normal">{explanation}</span>
    </div>
  );
};

export default RecommendationBadge;