import express from 'express';
import { z } from 'zod';
import { PrismaClient, Role } from '@prisma/client';
import { asyncHandler, notFound, forbidden } from '../middleware/errorHandler';
import { requireRole, requireOwnershipOrRole } from '../middleware/auth';
import { createAuditLog } from '../services/audit';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional()
});

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
router.get('/profile', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      department: true,
      enrollments: {
        include: {
          section: {
            include: {
              course: {
                include: {
                  program: true
                }
              },
              faculty: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw notFound('User not found');
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      rollNumber: user.rollNumber,
      role: user.role,
      department: user.department,
      enrollments: user.enrollments,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }
  });
}));

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', asyncHandler(async (req, res) => {
  const updateData = UpdateProfileSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: updateData,
    include: { department: true }
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'PROFILE_UPDATED',
    resource: 'user',
    resourceId: req.user!.id,
    details: updateData,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      department: user.department
    }
  });
}));

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   get:
 *     summary: Get user by ID (admin/faculty only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.get('/:userId', 
  requireOwnershipOrRole([Role.admin, Role.faculty]),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        enrollments: {
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

    if (!user) {
      throw notFound('User not found');
    }

    // Students can only see their own full profile
    if (req.user!.role === Role.student && req.user!.id !== userId) {
      throw forbidden('Cannot access other user profiles');
    }

    res.json({
      success: true,
      data: user
    });
  })
);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, faculty, admin]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
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
 *           default: 20
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/', 
  requireRole(Role.admin),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (req.query.role) {
      where.role = req.query.role;
    }
    
    if (req.query.department) {
      where.departmentId = req.query.department;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { department: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

export default router;
