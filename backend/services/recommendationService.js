const Article = require('../models/Article');
const UserActivity = require('../models/UserActivity');

/**
 * Multi-Factor Recommendation & Explanation Engine
 */
class RecommendationService {
  /**
   * Tracks an article view for a user.
   */
  async trackArticleView(userId, articleId) {
    if (!userId || !articleId) return null;

    const article = await Article.findById(articleId).select('category tags');
    if (!article) return null;

    let activity = await UserActivity.findOne({ user: userId });
    if (!activity) {
      activity = new UserActivity({ user: userId, readingHistory: [] });
    }

    return await activity.recordView(article._id, article.category, article.tags);
  }

  /**
   * Computes personalized recommendations with dynamic explanations.
   */
  async getPersonalizedFeed(userId, { limit = 8, page = 1 } = {}) {
    // 1. Fetch user's activity profile if logged in
    let activity = null;
    if (userId) {
      activity = await UserActivity.findOne({ user: userId });
    }

    // 2. Cold-start fallback: If no user or empty history, return community trending articles
    if (!activity || !activity.readingHistory || activity.readingHistory.length === 0) {
      return this.getColdStartFeed(limit, page);
    }

    // 3. Extract user preferences from reading history
    const readArticleIds = activity.readingHistory.map((item) => item.article.toString());
    const categoryFrequency = {};
    const tagFrequency = {};

    activity.readingHistory.forEach((item) => {
      if (item.category) {
        categoryFrequency[item.category] = (categoryFrequency[item.category] || 0) + 1;
      }
      if (Array.isArray(item.tags)) {
        item.tags.forEach((tag) => {
          const lower = tag.toLowerCase();
          tagFrequency[lower] = (tagFrequency[lower] || 0) + 1;
        });
      }
    });

    const topCategories = Object.keys(categoryFrequency).sort(
      (a, b) => categoryFrequency[b] - categoryFrequency[a]
    );
    const topTags = Object.keys(tagFrequency).sort(
      (a, b) => tagFrequency[b] - tagFrequency[a]
    );

    // 4. Query candidate published articles (excluding ones already read)
    const candidateQuery = {
      status: 'published',
      _id: { $nin: readArticleIds },
    };

    let candidates = await Article.find(candidateQuery)
      .populate('author', 'name avatar trustScore')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(50)
      .lean();

    // Fallback if user has read all candidates: allow re-reading from catalog
    if (candidates.length === 0) {
      candidates = await Article.find({ status: 'published' })
        .populate('author', 'name avatar trustScore')
        .sort({ views: -1, likes: -1 })
        .limit(20)
        .lean();
    }

    // 5. Score candidates and compute explanations
    const scoredArticles = candidates.map((article) => {
      let score = 0;
      let dominantReason = 'general';
      let dominantFactor = '';

      // Factor A: Category Match (up to 40 pts)
      const catIndex = topCategories.indexOf(article.category);
      if (catIndex === 0) {
        score += 40;
        dominantReason = 'category';
        dominantFactor = article.category;
      } else if (catIndex > 0) {
        score += 25;
      }

      // Factor B: Tag Overlap (up to 35 pts)
      let matchedTag = null;
      if (Array.isArray(article.tags)) {
        for (const tag of article.tags) {
          const lower = tag.toLowerCase();
          if (topTags.includes(lower)) {
            score += 15;
            if (!matchedTag) matchedTag = tag;
          }
        }
      }

      if (matchedTag && (score >= 30 || dominantReason !== 'category')) {
        dominantReason = 'tag';
        dominantFactor = matchedTag;
      }

      // Factor C: Popularity & Recency (up to 25 pts)
      const viewScore = Math.min(15, (article.views || 0) / 10);
      const likeScore = Math.min(10, (article.likes || 0) * 2);
      score += viewScore + likeScore;

      // 6. Generate human-readable explanation badge
      const explanation = this.formatExplanation(dominantReason, dominantFactor, article);

      return {
        ...article,
        recommendation: {
          score: Math.round(score),
          reasonType: dominantReason,
          explanation: explanation.text,
          badgeText: explanation.badge,
        },
      };
    });

    // 7. Sort by highest score first
    scoredArticles.sort((a, b) => b.recommendation.score - a.recommendation.score);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedArticles = scoredArticles.slice(startIndex, startIndex + limit);

    return {
      articles: paginatedArticles,
      total: scoredArticles.length,
      page,
      limit,
    };
  }

  /**
   * Cold-start fallback for guest users or new signups.
   */
  async getColdStartFeed(limit = 8, page = 1) {
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      Article.find({ status: 'published' })
        .populate('author', 'name avatar trustScore')
        .sort({ views: -1, likes: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments({ status: 'published' }),
    ]);

    const enriched = articles.map((art) => ({
      ...art,
      recommendation: {
        score: 75,
        reasonType: 'trending',
        explanation: `Trending dispatch in ${art.category || 'CMS'}`,
        badgeText: 'Popular Choice',
      },
    }));

    return {
      articles: enriched,
      total,
      page,
      limit,
    };
  }

  /**
   * Generates dynamic explanation strings.
   */
  formatExplanation(reasonType, factor, article) {
    switch (reasonType) {
      case 'tag':
        return {
          badge: 'Why Recommended',
          text: `Because you read #${factor}`,
        };
      case 'category':
        return {
          badge: 'Why Recommended',
          text: `Based on your interest in ${factor}`,
        };
      default:
        return {
          badge: 'Featured',
          text: `High community engagement in ${article.category || 'Editorial'}`,
        };
    }
  }
}

module.exports = new RecommendationService();