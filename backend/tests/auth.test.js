const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');

const jwtSecret = process.env.JWT_SECRET || 'lumen_super_secret_jwt_key_2026_cms_platform';
const testToken = jwt.sign({ id: '66c9f1a00000000000000001' }, jwtSecret);

jest.setTimeout(15000);

describe('Auth & User API Tests', () => {

  it('GET /api/health - should return online status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('online');
  });

  it('GET /api/users - should fetch user list with auth header', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('POST /api/auth/login - should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@lumen.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
