import express from 'express';
import { z } from 'zod';
import { PrismaClient, Role } from '@prisma/client';
import { asyncHandler, notFound, badRequest } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';
import { createAuditLog } from '../services/audit';

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require admin role
router.use(requireRole(Role.admin));

// Validation schemas
const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role),
  rollNumber: z.string().optional(),
  departmentId: z.string().cuid().optional()
});

const CreateDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(10).toUpperCase()
});

const CreateProgramSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(10).toUpperCase(),
  duration: z.number().min(1).max(6),
  departmentId: z.string().cuid()
});

const CreateCourseSchema = z.object({
  code: z.string().min(2).max(20).toUpperCase(),
  title: z.string().min(2).max(200),
  credits: z.number().min(1).max(10),
  semester: z.number().min(1).max(8),
  programId: z.string().cuid()
});

/**
 * @swagger
 * /api/v1/admin/users:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [student, faculty, admin]
 *               rollNumber:
 *                 type: string
 *               departmentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/users', asyncHandler(async (req, res) => {
  const userData = CreateUserSchema.parse(req.body);

  const user = await prisma.user.create({
    data: userData,
    include: { department: true }
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'USER_CREATED',
    resource: 'user',
    resourceId: user.id,
    details: userData,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user
  });
}));

/**
 * @swagger
 * /api/v1/admin/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Departments retrieved successfully
 */
router.get('/departments', asyncHandler(async (req, res) => {
  const departments = await prisma.department.findMany({
    include: {
      programs: {
        include: {
          courses: {
            include: {
              sections: {
                include: {
                  _count: {
                    select: {
                      enrollments: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      _count: {
        select: {
          users: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: departments
  });
}));

/**
 * @swagger
 * /api/v1/admin/departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created successfully
 */
router.post('/departments', asyncHandler(async (req, res) => {
  const departmentData = CreateDepartmentSchema.parse(req.body);

  const department = await prisma.department.create({
    data: departmentData
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'DEPARTMENT_CREATED',
    resource: 'department',
    resourceId: department.id,
    details: departmentData,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    data: department
  });
}));

/**
 * @swagger
 * /api/v1/admin/programs:
 *   post:
 *     summary: Create a new program
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - duration
 *               - departmentId
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               duration:
 *                 type: integer
 *               departmentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Program created successfully
 */
router.post('/programs', asyncHandler(async (req, res) => {
  const programData = CreateProgramSchema.parse(req.body);

  const program = await prisma.program.create({
    data: programData,
    include: { department: true }
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'PROGRAM_CREATED',
    resource: 'program',
    resourceId: program.id,
    details: programData,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({
    success: true,
    message: 'Program created successfully',
    data: program
  });
}));

/**
 * @swagger
 * /api/v1/admin/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - title
 *               - credits
 *               - semester
 *               - programId
 *             properties:
 *               code:
 *                 type: string
 *               title:
 *                 type: string
 *               credits:
 *                 type: integer
 *               semester:
 *                 type: integer
 *               programId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created successfully
 */
router.post('/courses', asyncHandler(async (req, res) => {
  const courseData = CreateCourseSchema.parse(req.body);

  const course = await prisma.course.create({
    data: courseData,
    include: {
      program: {
        include: {
          department: true
        }
      }
    }
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'COURSE_CREATED',
    resource: 'course',
    resourceId: course.id,
    details: courseData,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: course
  });
}));

/**
 * @swagger
 * /api/v1/admin/analytics:
 *   get:
 *     summary: Get system analytics
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  const [
    userCounts,
    departmentCounts,
    attendanceStats,
    recentSessions
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ['role'],
      _count: true
    }),
    prisma.department.count(),
    prisma.attendance.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.session.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        section: {
          include: {
            course: true
          }
        },
        createdBy: {
          select: {
            name: true
          }
        }
      }
    })
  ]);

  const analytics = {
    users: {
      total: userCounts.reduce((sum, item) => sum + item._count, 0),
      byRole: userCounts.reduce((acc, item) => {
        acc[item.role] = item._count;
        return acc;
      }, {} as any)
    },
    departments: departmentCounts,
    attendance: {
      total: attendanceStats.reduce((sum, item) => sum + item._count, 0),
      byStatus: attendanceStats.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as any)
    },
    recentSessions
  };

  res.json({
    success: true,
    data: analytics
  });
}));

/**
 * @swagger
 * /api/v1/admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 */
router.get('/audit-logs', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (req.query.action) {
    where.action = req.query.action;
  }
  
  if (req.query.userId) {
    where.userId = req.query.userId;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.auditLog.count({ where })
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

export default router;
