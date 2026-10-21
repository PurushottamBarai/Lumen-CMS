const express = require('express');

const router = express.Router();

const {
  getReports,
  createReport,
  updateReportStatus,
} = require('../controllers/reportController');

const { authenticateUser, authorizeRole } = require('../middleware/auth');

// ======================================================
// Create Report
// Logged-in users can submit reports
// ======================================================
router.post('/', authenticateUser, createReport);

// ======================================================
// Admin Report Management
// ======================================================
router.get('/', authenticateUser, authorizeRole('admin'), getReports);

router.patch('/:id/status', authenticateUser, authorizeRole('admin'), updateReportStatus);

router.put('/:id', authenticateUser, authorizeRole('admin'), updateReportStatus);

module.exports = router;