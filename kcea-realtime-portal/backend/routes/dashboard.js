/**
 * Dashboard Routes - Role-based Dashboard Data
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// ================================
// HELPER FUNCTIONS
// ================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      validationErrors: errors.array()
    });
  }
  next();
};

// ================================
// STUDENT DASHBOARD
// ================================

/**
 * @route   GET /api/dashboard/student
 * @desc    Get student dashboard data
 * @access  Private (Student)
 */
router.get('/student', authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Get recent attendance (last 10 records)
    const recentAttendance = await Attendance.find({
      userId,
      ...dateFilter
    })
    .sort({ date: -1, period: 1 })
    .limit(10)
    .select('date period subject status markedAt');

    // Get subject-wise statistics
    const subjectStats = await Attendance.getSubjectWiseAttendance(userId, dateFilter);

    // Get overall statistics
    const overallStats = await Attendance.aggregate([
      { $match: { userId, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          },
          absentClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
          },
          lateClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get weekly attendance trend
    const weeklyTrend = await Attendance.aggregate([
      { 
        $match: { 
          userId,
          date: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const summary = overallStats[0] || {
      totalClasses: 0,
      presentClasses: 0,
      absentClasses: 0,
      lateClasses: 0
    };

    res.json({
      success: true,
      data: {
        student: {
          id: req.user._id,
          fullName: req.user.fullName,
          rollNumber: req.user.rollNumber,
          class: req.user.class,
          semester: req.user.semester,
          branch: req.user.branch,
          attendanceSummary: req.user.attendanceSummary
        },
        recentAttendance: recentAttendance.map(record => ({
          id: record._id,
          date: record.formattedDate,
          time: record.formattedTime,
          period: record.period,
          periodDisplay: record.periodDisplay,
          subject: record.subject,
          status: record.status,
          statusColor: record.statusColor
        })),
        subjectStats,
        summary,
        weeklyTrend,
        insights: {
          attendancePercentage: summary.totalClasses > 0 ? 
            Math.round((summary.presentClasses / summary.totalClasses) * 100) : 0,
          totalSubjects: subjectStats.length,
          bestSubject: subjectStats.length > 0 ? 
            subjectStats.reduce((best, current) => 
              current.attendancePercentage > best.attendancePercentage ? current : best
            ) : null,
          worstSubject: subjectStats.length > 0 ? 
            subjectStats.reduce((worst, current) => 
              current.attendancePercentage < worst.attendancePercentage ? current : worst
            ) : null
        }
      }
    });

  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: 'An error occurred while loading your dashboard'
    });
  }
});

// ================================
// FACULTY DASHBOARD
// ================================

/**
 * @route   GET /api/dashboard/faculty
 * @desc    Get faculty dashboard data
 * @access  Private (Faculty)
 */
router.get('/faculty', authorizeRoles('faculty', 'admin'), async (req, res) => {
  try {
    const { date, class: className, semester } = req.query;
    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);

    // Build student filter
    const studentFilter = { role: 'student', isActive: true };
    if (className) studentFilter.class = className;
    if (semester) studentFilter.semester = parseInt(semester);

    // Get students in faculty's classes
    const students = await User.find(studentFilter)
      .select('fullName rollNumber class semester branch attendanceSummary')
      .sort({ rollNumber: 1 });

    // Get today's attendance for these students
    const studentIds = students.map(s => s._id);
    const todayAttendance = await Attendance.find({
      userId: { $in: studentIds },
      date: today
    }).populate('userId', 'fullName rollNumber');

    // Get daily attendance summary
    const dailySummary = await Attendance.getDailyAttendanceSummary(today, {
      userId: { $in: studentIds }
    });

    // Get class-wise statistics
    const classStats = await User.aggregate([
      { $match: studentFilter },
      {
        $group: {
          _id: { class: '$class', semester: '$semester' },
          totalStudents: { $sum: 1 },
          averageAttendance: { $avg: '$attendanceSummary.attendancePercentage' },
          studentsAbove85: {
            $sum: {
              $cond: [{ $gte: ['$attendanceSummary.attendancePercentage', 85] }, 1, 0]
            }
          },
          studentsBelow75: {
            $sum: {
              $cond: [{ $lt: ['$attendanceSummary.attendancePercentage', 75] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get recent attendance activities
    const recentActivities = await Attendance.find({
      userId: { $in: studentIds },
      markedAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    })
    .populate('userId', 'fullName rollNumber')
    .sort({ markedAt: -1 })
    .limit(20);

    res.json({
      success: true,
      data: {
        faculty: {
          id: req.user._id,
          fullName: req.user.fullName,
          role: req.user.role
        },
        students: students.map(student => ({
          id: student._id,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          class: student.class,
          semester: student.semester,
          branch: student.branch,
          attendancePercentage: student.attendanceSummary.attendancePercentage,
          totalClasses: student.attendanceSummary.totalClasses,
          attendedClasses: student.attendanceSummary.attendedClasses,
          todayAttendance: todayAttendance.filter(a => 
            a.userId._id.toString() === student._id.toString()
          )
        })),
        todayAttendance: todayAttendance.map(record => ({
          id: record._id,
          student: {
            name: record.userId.fullName,
            rollNumber: record.userId.rollNumber
          },
          period: record.period,
          subject: record.subject,
          status: record.status,
          markedAt: record.markedAt
        })),
        dailySummary,
        classStats,
        recentActivities: recentActivities.map(activity => ({
          id: activity._id,
          student: {
            name: activity.userId.fullName,
            rollNumber: activity.userId.rollNumber
          },
          period: activity.period,
          subject: activity.subject,
          status: activity.status,
          markedAt: activity.markedAt
        })),
        summary: {
          totalStudents: students.length,
          todayPresentCount: todayAttendance.filter(a => a.status === 'Present').length,
          todayAbsentCount: todayAttendance.filter(a => a.status === 'Absent').length,
          averageClassAttendance: classStats.length > 0 ? 
            classStats.reduce((sum, stat) => sum + stat.averageAttendance, 0) / classStats.length : 0
        }
      }
    });

  } catch (error) {
    console.error('Faculty dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: 'An error occurred while loading the faculty dashboard'
    });
  }
});

// ================================
// ADMIN DASHBOARD
// ================================

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard data
 * @access  Private (Admin)
 */
router.get('/admin', authorizeRoles('admin'), async (req, res) => {
  try {
    // Get overall system statistics
    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalAttendanceRecords,
      todayAttendance,
      systemStats
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'faculty', isActive: true }),
      Attendance.countDocuments(),
      Attendance.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      User.getAttendanceStats()
    ]);

    // Get branch-wise statistics
    const branchStats = await User.aggregate([
      { $match: { role: 'student', isActive: true } },
      {
        $group: {
          _id: '$branch',
          totalStudents: { $sum: 1 },
          averageAttendance: { $avg: '$attendanceSummary.attendancePercentage' }
        }
      },
      { $sort: { totalStudents: -1 } }
    ]);

    // Get recent registrations
    const recentRegistrations = await User.find({
      role: 'student',
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    })
    .select('fullName rollNumber class branch createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

    // Get attendance trends (last 30 days)
    const attendanceTrends = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get low attendance students
    const lowAttendanceStudents = await User.find({
      role: 'student',
      isActive: true,
      'attendanceSummary.attendancePercentage': { $lt: 75 }
    })
    .select('fullName rollNumber class branch attendanceSummary')
    .sort({ 'attendanceSummary.attendancePercentage': 1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        admin: {
          id: req.user._id,
          fullName: req.user.fullName,
          role: req.user.role
        },
        systemOverview: {
          totalUsers,
          totalStudents,
          totalFaculty,
          totalAttendanceRecords,
          todayAttendance,
          systemHealth: 'Excellent',
          uptime: Math.floor(process.uptime()),
          averageAttendance: systemStats[0]?.averageAttendance || 0
        },
        branchStats,
        recentRegistrations: recentRegistrations.map(user => ({
          id: user._id,
          fullName: user.fullName,
          rollNumber: user.rollNumber,
          class: user.class,
          branch: user.branch,
          registeredAt: user.createdAt
        })),
        attendanceTrends,
        lowAttendanceStudents: lowAttendanceStudents.map(student => ({
          id: student._id,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          class: student.class,
          branch: student.branch,
          attendancePercentage: student.attendanceSummary.attendancePercentage,
          totalClasses: student.attendanceSummary.totalClasses,
          attendedClasses: student.attendanceSummary.attendedClasses
        })),
        alerts: [
          ...(lowAttendanceStudents.length > 0 ? [{
            type: 'warning',
            title: 'Low Attendance Alert',
            message: `${lowAttendanceStudents.length} students have attendance below 75%`,
            count: lowAttendanceStudents.length
          }] : []),
          {
            type: 'info',
            title: 'System Status',
            message: 'All systems operational',
            count: 1
          }
        ]
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: 'An error occurred while loading the admin dashboard'
    });
  }
});

module.exports = router;
