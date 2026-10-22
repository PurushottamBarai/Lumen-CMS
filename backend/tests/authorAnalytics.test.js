const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');

const jwtSecret = process.env.JWT_SECRET || 'lumen_super_secret_jwt_key_2026_cms_platform';
// Seeded Author 1: Thomas Okeke ('66c9f1a00000000000000002')
const authorToken = jwt.sign({ id: '66c9f1a00000000000000002', role: 'author' }, jwtSecret);
// Seeded Author 2: Priya Mehta ('66c9f1a00000000000000003')
const author2Token = jwt.sign({ id: '66c9f1a00000000000000003', role: 'author' }, jwtSecret);

jest.setTimeout(15000);

describe('Author Performance Analytics API Tests', () => {

  it('GET /api/author-analytics/me - should require authentication', async () => {
    const res = await request(app).get('/api/author-analytics/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/author-analytics/me - should return comprehensive metrics for author', async () => {
    const res = await request(app)
      .get('/api/author-analytics/me')
      .set('Authorization', `Bearer ${authorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data).toBeDefined();

    // Author profile info
    expect(data.author).toBeDefined();
    expect(data.author.name).toBeDefined();
    expect(data.author.contributorStanding).toBeDefined();

    // Overview KPIs
    expect(data.overview).toBeDefined();
    expect(typeof data.overview.totalViews).toBe('number');
    expect(typeof data.overview.totalLikes).toBe('number');
    expect(typeof data.overview.totalShares).toBe('number');
    expect(typeof data.overview.totalComments).toBe('number');
    expect(typeof data.overview.engagementRate).toBe('number');
    expect(typeof data.overview.likeRatio).toBe('number');

    // Best Performing Articles
    expect(Array.isArray(data.bestPerformingArticles)).toBe(true);
    expect(data.bestPerformingArticles.length).toBeGreaterThan(0);
    const topArticle = data.bestPerformingArticles[0];
    expect(topArticle.rank).toBe(1);
    expect(topArticle.title).toBeDefined();
    expect(typeof topArticle.views).toBe('number');
    expect(typeof topArticle.engagementRate).toBe('number');
    expect(topArticle.performanceTier).toBeDefined();

    // Popular Topics
    expect(Array.isArray(data.popularTopics)).toBe(true);
    expect(data.popularTopics.length).toBeGreaterThan(0);
    const topTopic = data.popularTopics[0];
    expect(topTopic.name).toBeDefined();
    expect(typeof topTopic.percentage).toBe('number');
    expect(typeof topTopic.count).toBe('number');

    // Trend History
    expect(Array.isArray(data.trendHistory)).toBe(true);
    expect(data.trendHistory.length).toBe(6);
  });

  it('GET /api/author-analytics/author/:authorId - should retrieve author analytics by ID', async () => {
    const res = await request(app).get('/api/author-analytics/author/66c9f1a00000000000000003');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overview.totalArticles).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.bestPerformingArticles)).toBe(true);
    expect(Array.isArray(res.body.data.popularTopics)).toBe(true);
  });

  it('GET /api/author-analytics/me?timeframe=30d - should apply timeframe filter', async () => {
    const res = await request(app)
      .get('/api/author-analytics/me?timeframe=30d')
      .set('Authorization', `Bearer ${authorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appliedFilters.timeframe).toBe('30d');
  });

  it('PATCH /api/articles/:id/share - should record article share and increment count', async () => {
    const targetArticleId = '66c9f2b00000000000000001';
    const res = await request(app)
      .patch(`/api/articles/${targetArticleId}/share`)
      .send({ platform: 'twitter' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.shares).toBe('number');
    expect(res.body.shares).toBeGreaterThan(0);
  });

  it('POST /api/author-analytics/articles/:id/share - should record share via analytics route', async () => {
    const targetArticleId = '66c9f2b00000000000000002';
    const res = await request(app)
      .post(`/api/author-analytics/articles/${targetArticleId}/share`)
      .send({ platform: 'linkedin' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.shares).toBe('number');
  });
});
