import express from 'express';
import { z } from 'zod';
import { PrismaClient, Role, AttendanceStatus, AttendanceMethod } from '@prisma/client';
import { asyncHandler, notFound, badRequest, forbidden } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';
import { createAuditLog } from '../services/audit';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const MarkAttendanceSchema = z.object({
  sessionId: z.string().cuid(),
  method: z.nativeEnum(AttendanceMethod),
  location: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional(),
  qrCode: z.string().optional(),
  otp: z.string().length(6).optional()
});

/**
 * @swagger
 * /api/v1/attendance/student/{studentId}:
 *   get:
 *     summary: Get student attendance summary
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Attendance summary retrieved successfully
 */
router.get('/student/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { sectionId, startDate, endDate } = req.query;

  // Check permissions
  if (req.user!.role === Role.student && req.user!.id !== studentId) {
    throw forbidden('Cannot access other student attendance');
  }

  const where: any = { studentId };
  
  if (sectionId) {
    where.session = { sectionId };
  }
  
  if (startDate || endDate) {
    where.markedAt = {};
    if (startDate) where.markedAt.gte = new Date(startDate as string);
    if (endDate) where.markedAt.lte = new Date(endDate as string);
  }

  // Get attendance records
  const attendance = await prisma.attendance.findMany({
    where,
    include: {
      session: {
        include: {
          section: {
            include: {
              course: true
            }
          }
        }
      }
    },
    orderBy: { markedAt: 'desc' }
  });

  // Calculate statistics
  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === AttendanceStatus.present).length,
    absent: attendance.filter(a => a.status === AttendanceStatus.absent).length,
    late: attendance.filter(a => a.status === AttendanceStatus.late).length,
    excused: attendance.filter(a => a.status === AttendanceStatus.excused).length
  };

  const percentage = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;

  // Group by course
  const byCourse = attendance.reduce((acc, record) => {
    const courseId = record.session.section.courseId;
    if (!acc[courseId]) {
      acc[courseId] = {
        course: record.session.section.course,
        total: 0,
        present: 0,
        percentage: 0
      };
    }
    acc[courseId].total++;
    if (record.status === AttendanceStatus.present) {
      acc[courseId].present++;
    }
    acc[courseId].percentage = (acc[courseId].present / acc[courseId].total) * 100;
    return acc;
  }, {} as any);

  res.json({
    success: true,
    data: {
      attendance,
      statistics: {
        ...stats,
        percentage: Math.round(percentage * 100) / 100
      },
      byCourse: Object.values(byCourse)
    }
  });
}));

/**
 * @swagger
 * /api/v1/attendance/mark:
 *   post:
 *     summary: Mark attendance for a session
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - method
 *             properties:
 *               sessionId:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [qr_code, geofence, manual, otp]
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               qrCode:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance marked successfully
 *       400:
 *         description: Invalid request or session not active
 */
router.post('/mark', 
  requireRole(Role.student),
  asyncHandler(async (req, res) => {
    const { sessionId, method, location, qrCode, otp } = MarkAttendanceSchema.parse(req.body);
    const studentId = req.user!.id;

    // Get session details
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        section: {
          include: {
            enrollments: {
              where: { studentId }
            }
          }
        }
      }
    });

    if (!session) {
      throw notFound('Session not found');
    }

    // Check if student is enrolled in this section
    if (session.section.enrollments.length === 0) {
      throw forbidden('Not enrolled in this section');
    }

    // Check if session is active
    if (session.status !== 'active') {
      throw badRequest('Session is not active');
    }

    // Check if attendance already marked
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        studentId_sessionId: {
          studentId,
          sessionId
        }
      }
    });

    if (existingAttendance) {
      throw badRequest('Attendance already marked for this session');
    }

    // Validate attendance method
    let isValid = false;
    const sectionSettings = session.section.settings as any;

    switch (method) {
      case AttendanceMethod.qr_code:
        if (qrCode && session.qrCode === qrCode && session.qrExpiresAt && new Date() < session.qrExpiresAt) {
          isValid = true;
        }
        break;
      
      case AttendanceMethod.geofence:
        if (location && session.geofence) {
          const geofence = session.geofence as any;
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            geofence.latitude,
            geofence.longitude
          );
          isValid = distance <= geofence.radius;
        }
        break;
      
      case AttendanceMethod.otp:
        // Implement OTP validation logic
        isValid = true; // Placeholder
        break;
      
      default:
        throw badRequest('Invalid attendance method');
    }

    if (!isValid) {
      throw badRequest('Invalid attendance credentials');
    }

    // Mark attendance
    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        sessionId,
        status: AttendanceStatus.present,
        method,
        location,
        markedAt: new Date(),
        deviceInfo: {
          userAgent: req.get('User-Agent'),
          ip: req.ip
        }
      },
      include: {
        session: {
          include: {
            section: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    await createAuditLog({
      userId: studentId,
      action: 'ATTENDANCE_MARKED',
      resource: 'attendance',
      resourceId: attendance.id,
      details: { sessionId, method, location },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  })
);

/**
 * @swagger
 * /api/v1/attendance/session/{sessionId}:
 *   get:
 *     summary: Get attendance for a session (faculty/admin only)
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session attendance retrieved successfully
 */
router.get('/session/:sessionId',
  requireRole([Role.faculty, Role.admin]),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        section: {
          include: {
            course: true,
            enrollments: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    rollNumber: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        attendance: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                rollNumber: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      throw notFound('Session not found');
    }

    // Create attendance summary
    const enrolledStudents = session.section.enrollments.map(e => e.student);
    const attendanceMap = new Map(session.attendance.map(a => [a.studentId, a]));

    const attendanceList = enrolledStudents.map(student => {
      const attendance = attendanceMap.get(student.id);
      return {
        student,
        attendance: attendance || null,
        status: attendance?.status || 'absent'
      };
    });

    const stats = {
      total: enrolledStudents.length,
      present: session.attendance.filter(a => a.status === AttendanceStatus.present).length,
      absent: enrolledStudents.length - session.attendance.length,
      late: session.attendance.filter(a => a.status === AttendanceStatus.late).length
    };

    res.json({
      success: true,
      data: {
        session,
        attendance: attendanceList,
        statistics: stats
      }
    });
  })
);

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default router;
