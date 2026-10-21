const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'test') return 'lumen_super_secret_jwt_key_2026_cms_platform';
  return null;
};

module.exports = { getJwtSecret };
