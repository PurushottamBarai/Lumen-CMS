const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

jest.mock('../models/userStore', () => ({
  isDBConnected: jest.fn(() => true),
  findByEmail: jest.fn(),
  findByEmailPersistent: jest.fn(),
  findById: jest.fn(),
  findByIdPersistent: jest.fn(),
  createUser: jest.fn(),
  createUserPersistent: jest.fn(),
}));

const userStore = require('../models/userStore');
const app = require('../server');

describe('authentication API flows', () => {
  beforeEach(() => jest.clearAllMocks());

  test('registers a regular user and stores a bcrypt hash through the user store', async () => {
    userStore.findByEmailPersistent.mockResolvedValue(null);
    userStore.createUserPersistent.mockImplementation(async (user) => ({
      ...user,
      id: 'test-user-1',
      createdAt: new Date('2026-10-21T00:00:00.000Z'),
    }));

    const response = await request(app).post('/api/auth/register').send({
      name: 'Test Reader',
      email: ' TEST@EXAMPLE.COM ',
      password: 'test-password',
      role: 'reader',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.user.role).toBe('reader');
    expect(response.body.token).toEqual(expect.any(String));
    expect(userStore.createUserPersistent).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com',
      role: 'reader',
    }));
    expect(userStore.createUserPersistent.mock.calls[0][0].password).not.toBe('test-password');
  });

  test('rejects missing registration fields and duplicate accounts', async () => {
    const missing = await request(app).post('/api/auth/register').send({});
    expect(missing.status).toBe(400);
    expect(userStore.findByEmailPersistent).not.toHaveBeenCalled();

    userStore.findByEmailPersistent.mockResolvedValue({ email: 'taken@example.com' });
    const duplicate = await request(app).post('/api/auth/register').send({
      name: 'Existing User', email: 'TAKEN@example.com', password: 'test-password',
    });
    expect(duplicate.status).toBe(400);
  });

  test('rejects malformed field types and public admin registration', async () => {
    const malformed = await request(app).post('/api/auth/register').send({ name: {}, email: 'x@example.com', password: 'password' });
    expect(malformed.status).toBe(400);

    const admin = await request(app).post('/api/auth/register').send({
      name: 'Admin', email: 'admin@example.com', password: 'test-password', role: 'admin',
    });
    expect(admin.status).toBe(403);
  });

  test('authenticates a user, rejects invalid credentials, and protects the session route', async () => {
    const user = {
      id: 'test-user-2', name: 'Test Author', email: 'author@example.com', role: 'author', bio: '',
      matchPassword: jest.fn().mockResolvedValue(true),
    };
    userStore.findByEmailPersistent.mockResolvedValue(user);
    const login = await request(app).post('/api/auth/login').send({ email: ' AUTHOR@example.com ', password: 'test-password' });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('author');

    user.matchPassword.mockResolvedValue(false);
    const invalid = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong-password' });
    expect(invalid.status).toBe(401);

    const unauthenticated = await request(app).get('/api/auth/me');
    expect(unauthenticated.status).toBe(401);

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'lumen_super_secret_jwt_key_2026_cms_platform');
    userStore.findByIdPersistent.mockResolvedValue(user);
    const session = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(session.status).toBe(200);
    expect(session.body.user.email).toBe(user.email);
  });

  test('reports missing preset demo accounts without treating them as invalid credentials', async () => {
    userStore.findByEmailPersistent.mockResolvedValue(null);

    const demo = await request(app).post('/api/auth/login').send({
      email: 'admin@lumen.com', password: 'not-printed',
    });
    expect(demo.status).toBe(409);
    expect(demo.body.code).toBe('DEMO_ACCOUNT_NOT_CONFIGURED');

    const regular = await request(app).post('/api/auth/login').send({
      email: 'someone@example.com', password: 'not-printed',
    });
    expect(regular.status).toBe(401);
    expect(regular.body.code).toBeUndefined();
  });

  test('demo email addresses still require their actual stored bcrypt password', async () => {
    const hashedPassword = await bcrypt.hash('correct-demo-password', 4);
    const matchPassword = User.schema.methods.matchPassword;
    const user = { email: 'admin@lumen.com', password: hashedPassword };

    await expect(matchPassword.call(user, 'correct-demo-password')).resolves.toBe(true);
    await expect(matchPassword.call(user, 'wrong-password')).resolves.toBe(false);
  });

  test('returns service unavailable instead of silently using memory when the database is down', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousFallback = process.env.ALLOW_IN_MEMORY_FALLBACK;
    const previousState = mongoose.connection.readyState;
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOW_IN_MEMORY_FALLBACK;
    mongoose.connection.readyState = 0;
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();
    const { requireDatabase } = require('../middleware/requireDatabase');

    requireDatabase(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'DATABASE_UNAVAILABLE' }));
    expect(next).not.toHaveBeenCalled();

    mongoose.connection.readyState = previousState;
    process.env.NODE_ENV = previousNodeEnv;
    if (previousFallback === undefined) delete process.env.ALLOW_IN_MEMORY_FALLBACK;
    else process.env.ALLOW_IN_MEMORY_FALLBACK = previousFallback;
  });
});
