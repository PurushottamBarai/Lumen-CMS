const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

jest.setTimeout(15000);

describe('Personal Chat & Messaging API Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'lumen_super_secret_jwt_key_2026_cms_platform';

  // Test accounts from userStore
  const adminId = '66c9f1a00000000000000001'; // Amara Silva
  const authorId = '66c9f1a00000000000000002'; // Thomas Okeke
  const readerId = '66c9f1a00000000000000004'; // Lena Kaufmann

  const adminToken = jwt.sign({ id: adminId, role: 'admin' }, jwtSecret, { expiresIn: '1h' });
  const authorToken = jwt.sign({ id: authorId, role: 'author' }, jwtSecret, { expiresIn: '1h' });
  const readerToken = jwt.sign({ id: readerId, role: 'reader' }, jwtSecret, { expiresIn: '1h' });

  it('GET /api/messages/:userId - should reject unauthenticated request with 401', async () => {
    const res = await request(app).get(`/api/messages/${authorId}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/messages - should reject unauthenticated send with 401', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ receiver: authorId, text: 'Hello' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/messages - should reject empty message with 400', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ receiver: authorId, text: '   ' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/messages - should reject sending message to self with 400', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ receiver: adminId, text: 'Self message' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/messages - should reject message to non-existent user with 404', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ receiver: '66c9f1a00000000000000999', text: 'Ghost message' });
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/messages - should successfully send message from Admin to Author', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ receiver: authorId, text: 'Editorial review is ready for your submission.' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBeDefined();
    expect(res.body.message.text).toBe('Editorial review is ready for your submission.');
    expect(res.body.message.sender).toBe(adminId);
    expect(res.body.message.receiver).toBe(authorId);
  });

  it('GET /api/messages/:userId - should fetch conversation history between Admin and Author', async () => {
    const res = await request(app)
      .get(`/api/messages/${authorId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages.length).toBeGreaterThanOrEqual(1);

    const found = res.body.messages.some(
      (m) => m.text === 'Editorial review is ready for your submission.'
    );
    expect(found).toBe(true);
  });

  it('POST /api/messages - Author should successfully reply to Admin', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ receiver: adminId, text: 'Thank you Amara, making the updates now.' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message.sender).toBe(authorId);
    expect(res.body.message.receiver).toBe(adminId);
  });

  it('GET /api/messages/:userId - Conversation between Admin and Author should be isolated from Reader', async () => {
    const res = await request(app)
      .get(`/api/messages/${adminId}`)
      .set('Authorization', `Bearer ${readerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify messages between Admin and Author do NOT appear in Reader's conversation
    const leaked = (res.body.messages || []).some(
      (m) => m.text.includes('Editorial review') || m.text.includes('making the updates')
    );
    expect(leaked).toBe(false);
  });
});
