const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock the database models because tests intentionally run without MongoDB.
jest.mock('../models/Article', () => ({
  find: jest.fn(),
}));

jest.mock('../models/Quiz', () => ({
  find: jest.fn(),
}));

const Article = require('../models/Article');
const Quiz = require('../models/Quiz');
const app = require('../server');

const jwtSecret =
  process.env.JWT_SECRET ||
  'lumen_super_secret_jwt_key_2026_cms_platform';

const adminToken = jwt.sign(
  { id: '66c9f1a00000000000000001' },
  jwtSecret
);

jest.setTimeout(30000);

describe('AI Moderation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Article.find() query chain
    Article.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });

    // Mock Quiz.find() query chain
    Quiz.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });
  });

  test('Admin can get AI moderation statistics', async () => {
    const res = await request(app)
      .get('/api/moderation/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats).toHaveProperty('totalScanned');
    expect(res.body.stats).toHaveProperty('lowRisk');
    expect(res.body.stats).toHaveProperty('moderateRisk');
    expect(res.body.stats).toHaveProperty('highRisk');
  });

  test('Admin can get moderated content', async () => {
    const res = await request(app)
      .get('/api/moderation/content')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('Unauthenticated user cannot access moderation stats', async () => {
    const res = await request(app)
      .get('/api/moderation/stats');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
