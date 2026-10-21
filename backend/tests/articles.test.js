const request = require('supertest');
const app = require('../server');

jest.setTimeout(15000);

describe('Articles API Tests', () => {

  it('GET /api/articles - should fetch all published articles', async () => {
    const res = await request(app).get('/api/articles');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.articles)).toBe(true);
  });

  it('GET /api/articles?search=CRISPR - should filter articles by query', async () => {
    const res = await request(app).get('/api/articles?search=CRISPR');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.articles)).toBe(true);
  });

  it('GET /api/articles/:id/recommendations - should fetch article recommendations', async () => {
    const res = await request(app).get('/api/articles/66c9f2b00000000000000001/recommendations');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });

  it('GET /api/articles - public requests should not include non-published articles', async () => {
    const res = await request(app).get('/api/articles');
    expect(res.statusCode).toBe(200);
    const nonPublished = res.body.articles.filter(a => a.status !== 'published');
    expect(nonPublished.length).toBe(0);
  });
});
