const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userStore = require('../models/userStore');
const { getJwtSecret } = require('../config/jwt');

/**
 * Generate signed JWT token
 */
const generateToken = (userId, role) => {
  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    const error = new Error('Authentication signing key is not configured.');
    error.code = 'AUTH_CONFIGURATION_MISSING';
    throw error;
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId, role }, jwtSecret, { expiresIn });
};

const logAuthError = (operation, error) => {
  console.error(`[Auth ${operation} Error]`, {
    name: error.name,
    code: error.code || 'UNKNOWN',
  });
};

const databaseIsUnavailable = (error) =>
  error.code === 'DATABASE_UNAVAILABLE' ||
  error.name === 'DatabaseUnavailableError' ||
  (process.env.NODE_ENV !== 'test' &&
    process.env.ALLOW_IN_MEMORY_FALLBACK !== 'true' &&
    !userStore.isDBConnected());

const authConfigurationIsUnavailable = (error) =>
  error.code === 'AUTH_CONFIGURATION_MISSING' || !getJwtSecret();

const DEMO_ACCOUNT_EMAILS = new Set([
  'admin@lumen.com',
  'author@lumen.com',
  'reader@lumen.com',
  'priya.mehta@lumen.com',
]);

/**
 * @desc    Register a new user (Reader or Author)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const { name, email, password, role, bio } = body;

    // 1. Basic validation
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !name.trim() || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot exceed 100 characters.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (body.confirmPassword && password !== body.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please re-enter your password.',
      });
    }

    // 2. Enforce role restrictions: public registration cannot create admin accounts
    let assignedRole = 'reader';
    if (role !== undefined && typeof role !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a valid account role.' });
    }
    if (bio !== undefined && typeof bio !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a valid bio.' });
    }
    if (role) {
      const normalizedRole = role.toLowerCase().trim();
      if (normalizedRole === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin accounts cannot be created via public registration.',
        });
      }
      if (['reader', 'author'].includes(normalizedRole)) {
        assignedRole = normalizedRole;
      }
    }

    // 3. Check for existing user with this email
    const existingUser = await userStore.findByEmailPersistent(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.',
      });
    }

    // 4. Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create user via userStore (persists to MongoDB if connected, or memory store)
    const newUser = await userStore.createUserPersistent({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      bio: bio ? bio.trim() : '',
    });

    // 6. Generate JWT
    const userId = newUser.id || newUser._id;
    const token = generateToken(userId, newUser.role);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        bio: newUser.bio,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    logAuthError('Register', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.',
      });
    }
    if (databaseIsUnavailable(error)) {
      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        message: 'The database is unavailable. Please try again when the CMS database connection is restored.',
      });
    }
    if (authConfigurationIsUnavailable(error)) {
      return res.status(503).json({
        success: false,
        code: 'AUTH_CONFIGURATION_MISSING',
        message: 'Authentication is not configured. Ask the administrator to check the server configuration.',
      });
    }
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors || {}).map((entry) => entry.message).join(' ');
      return res.status(400).json({ success: false, message: message || 'Please check the account details and try again.' });
    }
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again later.',
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const { email, password } = body;

    // 1. Validate inputs
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find user by email
    const user = await userStore.findByEmailPersistent(normalizedEmail, true);

    if (!user) {
      if (DEMO_ACCOUNT_EMAILS.has(normalizedEmail)) {
        return res.status(409).json({
          success: false,
          code: 'DEMO_ACCOUNT_NOT_CONFIGURED',
          message: 'This demo account is not set up in the connected database. Ask an administrator to provision it. Reader and author demo accounts can be created with the opt-in backend setup script.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 3. Compare password with bcrypt
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 4. Generate JWT
    const userId = user.id || user._id;
    const token = generateToken(userId, user.role);

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logAuthError('Login', error);
    if (databaseIsUnavailable(error)) {
      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        message: 'The database is unavailable. Please try again when the CMS database connection is restored.',
      });
    }
    if (authConfigurationIsUnavailable(error)) {
      return res.status(503).json({
        success: false,
        code: 'AUTH_CONFIGURATION_MISSING',
        message: 'Authentication is not configured. Ask the administrator to check the server configuration.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'An error occurred during sign in. Please try again later.',
    });
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private (Protected by authenticateUser)
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    return res.status(200).json({
      success: true,
      user: {
        id: userId,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        bio: req.user.bio,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    logAuthError('GetMe', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve current user session.',
    });
  }
};

/**
 * @desc    Logout user (Session invalidation response)
 * @route   POST /api/auth/logout
 * @access  Public / Private
 */
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
