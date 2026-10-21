const mongoose = require('mongoose');
const userStore = require('../models/userStore');
const { requireDatabase } = require('../middleware/requireDatabase');

describe('database-required operations', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousFallback = process.env.ALLOW_IN_MEMORY_FALLBACK;
  let previousReadyState;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOW_IN_MEMORY_FALLBACK;
    previousReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 0;
  });

  afterAll(() => {
    process.env.NODE_ENV = previousNodeEnv;
    if (previousFallback === undefined) delete process.env.ALLOW_IN_MEMORY_FALLBACK;
    else process.env.ALLOW_IN_MEMORY_FALLBACK = previousFallback;
    mongoose.connection.readyState = previousReadyState;
  });

  test('does not use the in-memory store for registration or login when MongoDB is disconnected', async () => {
    await expect(userStore.findByEmailPersistent('probe@example.test')).rejects.toMatchObject({
      code: 'DATABASE_UNAVAILABLE',
    });
    await expect(userStore.createUserPersistent({})).rejects.toMatchObject({
      code: 'DATABASE_UNAVAILABLE',
    });
  });

  test('returns a safe 503 response when a database-backed route is unavailable', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    requireDatabase({}, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'DATABASE_UNAVAILABLE' }));
    expect(next).not.toHaveBeenCalled();
  });
});
