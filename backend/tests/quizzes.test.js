const request = require('supertest');
const app = require('../server');

describe('Quizzes API Tests', () => {
  it('GET /api/quizzes - should fetch list of quizzes', async () => {
    const res = await request(app).get('/api/quizzes');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.quizzes)).toBe(true);
  });

  it('GET /api/quizzes/article/:articleId - should fetch quiz by article ID', async () => {
    const res = await request(app).get('/api/quizzes/article/66c9f2b00000000000000001');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
