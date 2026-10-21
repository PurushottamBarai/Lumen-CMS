const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  getUserById,
  getAllUsers,
  createUserByAdmin,
  updateUserRole,
  deleteUser,
} = require('../controllers/userController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

// Protected profile endpoints for the authenticated user
router.get('/profile', authenticateUser, getProfile);
router.put('/profile', authenticateUser, updateProfile);
router.put('/change-password', authenticateUser, changePassword);

// User directory (for chat and admin management)
router.get('/', authenticateUser, getAllUsers);

router.post('/', authenticateUser, authorizeRole('admin'), createUserByAdmin);
router.put('/:id/role', authenticateUser, authorizeRole('admin'), updateUserRole);
router.delete('/:id', authenticateUser, authorizeRole('admin'), deleteUser);

// Public / Protected user lookup by ID
router.get('/:id', getUserById);

module.exports = router;
