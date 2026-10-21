const mongoose = require('mongoose');
const Report = require('../models/Report');

const initialReports = [
  {
    _id: 'report-1',
    id: 1,
    type: 'Article',
    item: 'The Psychology of Success',
    reportedBy: 'Priya Sharma',
    reason: 'Misleading information',
    description:
      'Some of the claims in this article appear to be misleading and should be reviewed.',
    date: 'Sep 05, 2026',
    status: 'pending',
  },
  {
    _id: 'report-2',
    id: 2,
    type: 'Comment',
    item: 'Comment by Rohan Patil',
    reportedBy: 'Aarav Mehta',
    reason: 'Inappropriate content',
    description:
      'The comment contains language that may violate the platform community guidelines.',
    date: 'Sep 04, 2026',
    status: 'pending',
  },
  {
    _id: 'report-3',
    id: 3,
    type: 'Article',
    item: 'Understanding Human Behavior',
    reportedBy: 'Neha Joshi',
    reason: 'Incorrect information',
    description:
      'The reported article contains information that the user believes is factually incorrect.',
    date: 'Sep 03, 2026',
    status: 'resolved',
  },
  {
    _id: 'report-4',
    id: 4,
    type: 'Comment',
    item: 'Comment by Vikram Singh',
    reportedBy: 'Priya Sharma',
    reason: 'Spam',
    description:
      'The reported comment appears to contain repetitive promotional content.',
    date: 'Sep 02, 2026',
    status: 'dismissed',
  },
  {
    _id: 'report-5',
    id: 5,
    type: 'Article',
    item: 'Technology and Society',
    reportedBy: 'Rohan Patil',
    reason: 'Copyright concern',
    description:
      'The user has reported that some content may have been used without proper attribution.',
    date: 'Sep 01, 2026',
    status: 'pending',
  },
];

let inMemoryReports = [...initialReports];

const isMongoConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

/**
 * Simple safe local analysis.
 *
 * This is intentionally deterministic and does not claim to be
 * an external AI provider. A real AI provider can be integrated
 * later using an environment variable/API key.
 */
const analyzeReportContent = ({ reason, description }) => {
  const text = `${reason || ''} ${description || ''}`.toLowerCase();

  let label = 'review_required';
  let summary = 'The report requires administrator review.';
  let confidence = 0.5;

  if (
    text.includes('spam') ||
    text.includes('promotional') ||
    text.includes('advertisement')
  ) {
    label = 'possible_spam';
    summary = 'The report contains indicators commonly associated with spam.';
    confidence = 0.8;
  } else if (
    text.includes('inappropriate') ||
    text.includes('abuse') ||
    text.includes('offensive')
  ) {
    label = 'possible_inappropriate_content';
    summary =
      'The report contains indicators of potentially inappropriate content.';
    confidence = 0.75;
  } else if (
    text.includes('copyright') ||
    text.includes('plagiarism')
  ) {
    label = 'possible_copyright_issue';
    summary =
      'The report mentions a possible copyright or plagiarism concern.';
    confidence = 0.7;
  } else if (
    text.includes('misleading') ||
    text.includes('incorrect') ||
    text.includes('false')
  ) {
    label = 'possible_misinformation';
    summary =
      'The report contains indicators of potentially inaccurate or misleading information.';
    confidence = 0.7;
  }

  return {
    status: 'completed',
    label,
    confidence,
    summary,
    analyzedAt: new Date(),
  };
};

/**
 * GET /api/reports
 * Admin only.
 */
const getReports = async (req, res) => {
  try {
    const { status, type } = req.query;

    if (isMongoConnected()) {
      const filter = {};

      if (status && status !== 'all') {
        filter.status = status;
      }

      if (type && type !== 'all') {
        filter.type = type;
      }

      let reports = await Report.find(filter)
        .sort({ createdAt: -1 })
        .populate('reporterId', 'name email');

      if (reports.length === 0 && !status && !type) {
        await Report.insertMany(
          initialReports.map((report) => ({
            type: report.type,
            item: report.item,
            reportedBy: report.reportedBy,
            reason: report.reason,
            description: report.description,
            status: report.status,
          }))
        );

        reports = await Report.find()
          .sort({ createdAt: -1 })
          .populate('reporterId', 'name email');
      }

      return res.status(200).json({
        success: true,
        count: reports.length,
        reports,
      });
    }

    let filtered = [...inMemoryReports];

    if (status && status !== 'all') {
      filtered = filtered.filter((report) => report.status === status);
    }

    if (type && type !== 'all') {
      filtered = filtered.filter((report) => report.type === type);
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      reports: filtered,
    });
  } catch (error) {
    console.error('Get reports error:', error);

    return res.status(200).json({
      success: true,
      count: inMemoryReports.length,
      reports: inMemoryReports,
    });
  }
};

/**
 * POST /api/reports
 *
 * Create a content report.
 */
const createReport = async (req, res) => {
  try {
    const {
      type,
      item,
      reason,
      description,
      targetId,
    } = req.body;

    if (!item || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Item and reason are required.',
      });
    }

    const reporterName = req.user?.name || 'Anonymous User';
    const reporterId = req.user?._id || req.user?.id || null;

    const aiAnalysis = analyzeReportContent({
      reason,
      description,
    });

    if (isMongoConnected()) {
      const report = await Report.create({
        type: type || 'Article',
        item,
        targetId: targetId || '',
        reportedBy: reporterName,
        reporterId,
        reason,
        description: description || '',
        status: 'pending',
        aiAnalysis,
      });

      return res.status(201).json({
        success: true,
        message: 'Report submitted successfully.',
        report,
      });
    }

    const newReport = {
      _id: `report-${Date.now()}`,
      id: Date.now(),
      type: type || 'Article',
      item,
      targetId: targetId || '',
      reportedBy: reporterName,
      reporterId,
      reason,
      description: description || '',
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      status: 'pending',
      aiAnalysis,
      adminReview: {
        reviewedBy: null,
        reviewedAt: null,
        action: '',
        notes: '',
      },
    };

    inMemoryReports.unshift(newReport);

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully.',
      report: newReport,
    });
  } catch (error) {
    console.error('Create report error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to submit report.',
    });
  }
};

/**
 * PATCH /api/reports/:id/status
 * PUT /api/reports/:id
 *
 * Admin updates report status and optional review/action information.
 */
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      status,
      action,
      notes,
    } = req.body;

    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value.',
      });
    }

    const adminId = req.user?._id || req.user?.id || null;

    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(id)) {
      const report = await Report.findByIdAndUpdate(
        id,
        {
          status,
          adminReview: {
            reviewedBy: adminId,
            reviewedAt: new Date(),
            action: action || 'none',
            notes: notes || '',
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (report) {
        return res.status(200).json({
          success: true,
          message: `Report status updated to ${status}.`,
          report,
        });
      }
    }

    const found = inMemoryReports.find(
      (report) =>
        report._id === id ||
        report.id === Number(id) ||
        report.id === id
    );

    if (found) {
      found.status = status;

      found.adminReview = {
        reviewedBy: adminId,
        reviewedAt: new Date(),
        action: action || 'none',
        notes: notes || '',
      };

      return res.status(200).json({
        success: true,
        message: `Report status updated to ${status}.`,
        report: found,
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Report not found.',
    });
  } catch (error) {
    console.error('Update report status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update report status.',
    });
  }
};

module.exports = {
  getReports,
  createReport,
  updateReportStatus,
};