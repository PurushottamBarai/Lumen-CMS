const request = require('supertest');
const app = require('../server');

jest.setTimeout(20000);

describe('Comments API Tests', () => {
  it('GET /api/comments/target/:targetId - should fetch comments for article', async () => {
    const res = await request(app).get('/api/comments/target/66c9f2b00000000000000001');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.comments)).toBe(true);
  });
});
