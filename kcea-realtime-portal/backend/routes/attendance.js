/**
 * Attendance Routes - Real-time Period-wise Attendance System
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { authorizeRoles, authorizeOwnership } = require('../middleware/auth');

const router = express.Router();

// ================================
// VALIDATION RULES
// ================================

const markAttendanceValidation = [
  body('period')
    .isInt({ min: 1, max: 8 })
    .withMessage('Period must be between 1 and 8'),
    
  body('subject')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&().,]+$/)
    .withMessage('Subject name contains invalid characters'),
    
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in valid ISO format'),
    
  body('status')
    .optional()
    .isIn(['Present', 'Absent', 'Late'])
    .withMessage('Status must be Present, Absent, or Late')
];

const bulkAttendanceValidation = [
  body('attendanceRecords')
    .isArray({ min: 1 })
    .withMessage('Attendance records must be a non-empty array'),
    
  body('attendanceRecords.*.userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
    
  body('attendanceRecords.*.period')
    .isInt({ min: 1, max: 8 })
    .withMessage('Period must be between 1 and 8'),
    
  body('attendanceRecords.*.subject')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject name must be between 2 and 100 characters'),
    
  body('attendanceRecords.*.status')
    .isIn(['Present', 'Absent', 'Late'])
    .withMessage('Status must be Present, Absent, or Late')
];

// ================================
// HELPER FUNCTIONS
// ================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input and try again',
      code: 'VALIDATION_ERROR',
      validationErrors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const getDeviceInfo = (req) => {
  return {
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip || req.connection.remoteAddress,
    platform: req.get('sec-ch-ua-platform') || 'Unknown'
  };
};

// ================================
// ROUTES
// ================================

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance for current user
 * @access  Private (Student, Faculty, Admin)
 */
router.post('/mark', markAttendanceValidation, handleValidationErrors, async (req, res) => {
  try {
    const { period, subject, date, status = 'Present' } = req.body;
    const userId = req.user._id;
    const attendanceDate = date ? new Date(date) : new Date();
    
    // Set time to start of day for consistent date comparison
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this user, date, and period
    const existingAttendance = await Attendance.findOne({
      userId,
      date: attendanceDate,
      period
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        error: 'Attendance already marked',
        message: `Attendance for Period ${period} on ${attendanceDate.toDateString()} is already marked as ${existingAttendance.status}`,
        code: 'ATTENDANCE_EXISTS',
        existingRecord: {
          id: existingAttendance._id,
          period: existingAttendance.period,
          subject: existingAttendance.subject,
          status: existingAttendance.status,
          markedAt: existingAttendance.markedAt
        }
      });
    }

    // Create new attendance record
    const attendance = new Attendance({
      userId,
      date: attendanceDate,
      period,
      subject: subject.trim(),
      status,
      markedBy: userId,
      markedByRole: req.user.role,
      deviceInfo: getDeviceInfo(req)
    });

    await attendance.save();

    // Populate user information
    await attendance.populate('userId', 'fullName rollNumber class semester branch');

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('attendance_marked', {
      attendanceId: attendance._id,
      userId: attendance.userId._id,
      studentName: attendance.userId.fullName,
      rollNumber: attendance.userId.rollNumber,
      class: attendance.userId.class,
      semester: attendance.userId.semester,
      branch: attendance.userId.branch,
      period,
      subject,
      status,
      date: attendanceDate,
      markedAt: attendance.markedAt,
      markedBy: req.user.fullName,
      markedByRole: req.user.role
    });

    res.status(201).json({
      success: true,
      message: `Attendance marked successfully for Period ${period}`,
      data: {
        attendance: {
          id: attendance._id,
          period: attendance.period,
          subject: attendance.subject,
          status: attendance.status,
          date: attendance.formattedDate,
          time: attendance.formattedTime,
          periodDisplay: attendance.periodDisplay,
          statusColor: attendance.statusColor
        },
        student: {
          name: attendance.userId.fullName,
          rollNumber: attendance.userId.rollNumber,
          class: attendance.userId.class,
          semester: attendance.userId.semester
        }
      }
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate attendance',
        message: 'Attendance for this period is already marked',
        code: 'DUPLICATE_ATTENDANCE'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to mark attendance',
      message: 'An error occurred while marking attendance',
      code: 'MARK_ATTENDANCE_ERROR'
    });
  }
});

/**
 * @route   POST /api/attendance/bulk
 * @desc    Mark bulk attendance (Faculty/Admin only)
 * @access  Private (Faculty, Admin)
 */
router.post('/bulk', authorizeRoles('faculty', 'admin'), bulkAttendanceValidation, handleValidationErrors, async (req, res) => {
  try {
    const { attendanceRecords, date } = req.body;
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const processedRecords = [];
    const errors = [];

    for (const record of attendanceRecords) {
      try {
        // Check if attendance already exists
        const existing = await Attendance.findOne({
          userId: record.userId,
          date: attendanceDate,
          period: record.period
        });

        if (existing) {
          errors.push({
            userId: record.userId,
            period: record.period,
            error: 'Attendance already exists'
          });
          continue;
        }

        // Create attendance record
        const attendance = new Attendance({
          userId: record.userId,
          date: attendanceDate,
          period: record.period,
          subject: record.subject.trim(),
          status: record.status,
          markedBy: req.user._id,
          markedByRole: req.user.role,
          deviceInfo: getDeviceInfo(req)
        });

        await attendance.save();
        processedRecords.push(attendance);

      } catch (recordError) {
        errors.push({
          userId: record.userId,
          period: record.period,
          error: recordError.message
        });
      }
    }

    // Populate user information for processed records
    await Attendance.populate(processedRecords, {
      path: 'userId',
      select: 'fullName rollNumber class semester branch'
    });

    // Emit real-time event for bulk update
    const io = req.app.get('io');
    io.emit('attendance_bulk_update', {
      date: attendanceDate,
      recordsCount: processedRecords.length,
      markedBy: req.user.fullName,
      markedByRole: req.user.role,
      records: processedRecords.map(record => ({
        studentName: record.userId.fullName,
        rollNumber: record.userId.rollNumber,
        period: record.period,
        subject: record.subject,
        status: record.status
      }))
    });

    res.status(201).json({
      success: true,
      message: `Bulk attendance processed: ${processedRecords.length} records created`,
      data: {
        processed: processedRecords.length,
        errors: errors.length,
        date: attendanceDate.toDateString(),
        records: processedRecords.map(record => ({
          id: record._id,
          student: {
            name: record.userId.fullName,
            rollNumber: record.userId.rollNumber
          },
          period: record.period,
          subject: record.subject,
          status: record.status
        })),
        errors
      }
    });

  } catch (error) {
    console.error('Bulk attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Bulk attendance failed',
      message: 'An error occurred while processing bulk attendance',
      code: 'BULK_ATTENDANCE_ERROR'
    });
  }
});

/**
 * @route   GET /api/attendance/my
 * @desc    Get current user's attendance records
 * @access  Private (Student, Faculty, Admin)
 */
router.get('/my', [
  query('startDate').optional().isISO8601().withMessage('Start date must be valid'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid'),
  query('period').optional().isInt({ min: 1, max: 8 }).withMessage('Period must be between 1 and 8'),
  query('subject').optional().trim().isLength({ min: 1 }).withMessage('Subject filter cannot be empty'),
  query('status').optional().isIn(['Present', 'Absent', 'Late']).withMessage('Invalid status filter'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], handleValidationErrors, async (req, res) => {
  try {
    const { startDate, endDate, period, subject, status, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    // Build query
    const query = { userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (period) query.period = parseInt(period);
    if (subject) query.subject = new RegExp(subject, 'i');
    if (status) query.status = status;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get attendance records
    const [attendanceRecords, totalRecords] = await Promise.all([
      Attendance.find(query)
        .sort({ date: -1, period: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(query)
    ]);

    // Get subject-wise statistics
    const subjectStats = await Attendance.getSubjectWiseAttendance(userId, query);

    res.json({
      success: true,
      data: {
        attendance: attendanceRecords.map(record => ({
          id: record._id,
          date: record.formattedDate,
          time: record.formattedTime,
          period: record.period,
          periodDisplay: record.periodDisplay,
          subject: record.subject,
          status: record.status,
          statusColor: record.statusColor,
          isModified: record.isModified
        })),
        subjectStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRecords / parseInt(limit)),
          totalRecords,
          hasNext: skip + parseInt(limit) < totalRecords,
          hasPrev: parseInt(page) > 1
        },
        summary: {
          totalClasses: totalRecords,
          presentClasses: attendanceRecords.filter(r => r.status === 'Present').length,
          absentClasses: attendanceRecords.filter(r => r.status === 'Absent').length,
          lateClasses: attendanceRecords.filter(r => r.status === 'Late').length
        }
      }
    });

  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance',
      message: 'An error occurred while fetching your attendance records',
      code: 'GET_ATTENDANCE_ERROR'
    });
  }
});

/**
 * @route   GET /api/attendance/student/:userId
 * @desc    Get specific student's attendance (Faculty/Admin only)
 * @access  Private (Faculty, Admin)
 */
router.get('/student/:userId', authorizeRoles('faculty', 'admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, period, subject, status } = req.query;

    // Verify student exists
    const student = await User.findById(userId).select('fullName rollNumber class semester branch attendanceSummary');
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        message: 'No student found with the provided ID',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    // Build query
    const query = { userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (period) query.period = parseInt(period);
    if (subject) query.subject = new RegExp(subject, 'i');
    if (status) query.status = status;

    // Get attendance records
    const attendanceRecords = await Attendance.find(query).sort({ date: -1, period: 1 });

    // Get subject-wise statistics
    const subjectStats = await Attendance.getSubjectWiseAttendance(userId, query);

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          class: student.class,
          semester: student.semester,
          branch: student.branch,
          attendanceSummary: student.attendanceSummary
        },
        attendance: attendanceRecords.map(record => ({
          id: record._id,
          date: record.formattedDate,
          time: record.formattedTime,
          period: record.period,
          periodDisplay: record.periodDisplay,
          subject: record.subject,
          status: record.status,
          statusColor: record.statusColor,
          isModified: record.isModified
        })),
        subjectStats,
        summary: {
          totalClasses: attendanceRecords.length,
          presentClasses: attendanceRecords.filter(r => r.status === 'Present').length,
          absentClasses: attendanceRecords.filter(r => r.status === 'Absent').length,
          lateClasses: attendanceRecords.filter(r => r.status === 'Late').length
        }
      }
    });

  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student attendance',
      message: 'An error occurred while fetching student attendance records',
      code: 'GET_STUDENT_ATTENDANCE_ERROR'
    });
  }
});

/**
 * @route   PUT /api/attendance/:attendanceId
 * @desc    Update attendance record (Faculty/Admin only)
 * @access  Private (Faculty, Admin)
 */
router.put('/:attendanceId', authorizeRoles('faculty', 'admin'), [
  body('status').isIn(['Present', 'Absent', 'Late']).withMessage('Status must be Present, Absent, or Late'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status, reason } = req.body;

    const attendance = await Attendance.findById(attendanceId).populate('userId', 'fullName rollNumber');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found',
        message: 'No attendance record found with the provided ID',
        code: 'ATTENDANCE_NOT_FOUND'
      });
    }

    // Check if record can be modified
    if (!attendance.canBeModified()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify attendance',
        message: 'Attendance records can only be modified within 7 days',
        code: 'MODIFICATION_NOT_ALLOWED'
      });
    }

    const previousStatus = attendance.status;
    attendance.markAsModified(req.user._id, previousStatus, status, reason);
    await attendance.save();

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('attendance_updated', {
      attendanceId: attendance._id,
      studentName: attendance.userId.fullName,
      rollNumber: attendance.userId.rollNumber,
      period: attendance.period,
      subject: attendance.subject,
      previousStatus,
      newStatus: status,
      modifiedBy: req.user.fullName,
      modifiedAt: new Date(),
      reason
    });

    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: {
        attendance: {
          id: attendance._id,
          period: attendance.period,
          subject: attendance.subject,
          status: attendance.status,
          previousStatus,
          isModified: attendance.isModified,
          modificationReason: reason
        }
      }
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update attendance',
      message: 'An error occurred while updating the attendance record',
      code: 'UPDATE_ATTENDANCE_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/attendance/:attendanceId
 * @desc    Delete attendance record (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:attendanceId', authorizeRoles('admin'), async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const attendance = await Attendance.findById(attendanceId).populate('userId', 'fullName rollNumber');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found',
        message: 'No attendance record found with the provided ID',
        code: 'ATTENDANCE_NOT_FOUND'
      });
    }

    await Attendance.findByIdAndDelete(attendanceId);

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('attendance_deleted', {
      attendanceId,
      studentName: attendance.userId.fullName,
      rollNumber: attendance.userId.rollNumber,
      period: attendance.period,
      subject: attendance.subject,
      deletedBy: req.user.fullName,
      deletedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Attendance record deleted successfully',
      data: {
        deletedRecord: {
          id: attendanceId,
          studentName: attendance.userId.fullName,
          rollNumber: attendance.userId.rollNumber,
          period: attendance.period,
          subject: attendance.subject
        }
      }
    });

  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete attendance',
      message: 'An error occurred while deleting the attendance record',
      code: 'DELETE_ATTENDANCE_ERROR'
    });
  }
});

module.exports = router;
