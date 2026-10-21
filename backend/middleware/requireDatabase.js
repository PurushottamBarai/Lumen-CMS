const mongoose = require('mongoose');

const canUseMemoryFallback = () =>
  process.env.NODE_ENV === 'test' ||
  (process.env.NODE_ENV !== 'production' && process.env.ALLOW_IN_MEMORY_FALLBACK === 'true');

const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState === 1 || canUseMemoryFallback()) {
    return next();
  }

  return res.status(503).json({
    success: false,
    code: 'DATABASE_UNAVAILABLE',
    message: 'The database is unavailable. Please try again when the CMS database connection is restored.',
  });
};

module.exports = { requireDatabase, canUseMemoryFallback };
