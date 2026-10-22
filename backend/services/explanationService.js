const getTrendingExplanation = (article) => {
  if (!article) return 'High engagement velocity across the platform.';

  const views = article.views || 0;
  const likes = article.likes || 0;
  const category = article.category || 'Technology';

  if (views > 1000 || likes > 50) {
    return `High engagement velocity from ${category.toLowerCase()} readers with ${likes} peer endorsements.`;
  }

  return `Surging popularity in ${category} with consistent reader retention this week.`;
};

const getLinkedExplanation = (sourceTitle, targetArticle) => {
  if (!targetArticle) return 'Contextually related based on semantic content similarity.';

  const targetCategory = targetArticle.category || 'Engineering';
  return `Complements ${sourceTitle ? `"${sourceTitle}"` : 'this research'} with architectural depth and practical invariants in ${targetCategory}.`;
};

const getRecommendedExplanation = (article, preferredCategory) => {
  if (!article) return 'Recommended based on top editorial engagement.';

  const category = article.category || 'Engineering';
  if (preferredCategory && preferredCategory.toLowerCase() === category.toLowerCase()) {
    return `Matched to your interest in ${category} and recent reading history.`;
  }

  return `Recommended based on high peer-review ratings and topic relevance in ${category}.`;
};

module.exports = {
  getTrendingExplanation,
  getLinkedExplanation,
  getRecommendedExplanation
};
