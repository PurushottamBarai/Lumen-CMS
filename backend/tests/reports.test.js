const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');

const jwtSecret = process.env.JWT_SECRET || 'lumen_super_secret_jwt_key_2026_cms_platform';
const adminToken = jwt.sign({ id: '66c9f1a00000000000000001', role: 'admin' }, jwtSecret);

describe('Reports API Tests', () => {
  it('POST /api/reports - should allow submitting a content report', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'Article',
        item: 'Test Reported Article',
        reason: 'Inaccurate facts',
        description: 'Detailing inaccurate claims in test article',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/reports - should fetch content reports for admin', async () => {
    const res = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.reports)).toBe(true);
  });

  it('PATCH /api/reports/:id/status - should allow admin to update report status', async () => {
    const res = await request(app)
      .patch('/api/reports/report-1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'resolved' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.report).toBeDefined();
    expect(res.body.report.status).toBe('resolved');
  });
});
