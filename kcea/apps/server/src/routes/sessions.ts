import express from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { PrismaClient, Role, SessionStatus } from '@prisma/client';
import { asyncHandler, notFound, forbidden, badRequest } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';
import { createAuditLog } from '../services/audit';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const CreateSessionSchema = z.object({
  sectionId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  scheduledAt: z.string().datetime(),
  geofence: z.object({
    latitude: z.number(),
    longitude: z.number(),
    radius: z.number().min(10).max(1000) // 10m to 1km
  }).optional()
});

const UpdateSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.nativeEnum(SessionStatus).optional(),
  geofence: z.object({
    latitude: z.number(),
    longitude: z.number(),
    radius: z.number().min(10).max(1000)
  }).optional()
});

/**
 * @swagger
 * /api/v1/sessions:
 *   post:
 *     summary: Create a new session (faculty only)
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sectionId
 *               - title
 *               - scheduledAt
 *             properties:
 *               sectionId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               geofence:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   radius:
 *                     type: number
 *     responses:
 *       201:
 *         description: Session created successfully
 */
router.post('/', 
  requireRole([Role.faculty, Role.admin]),
  asyncHandler(async (req, res) => {
    const sessionData = CreateSessionSchema.parse(req.body);

    // Verify faculty has access to this section
    if (req.user!.role === Role.faculty) {
      const section = await prisma.section.findUnique({
        where: { id: sessionData.sectionId }
      });

      if (!section || section.facultyId !== req.user!.id) {
        throw forbidden('Cannot create session for this section');
      }
    }

    const session = await prisma.session.create({
      data: {
        ...sessionData,
        createdById: req.user!.id,
        scheduledAt: new Date(sessionData.scheduledAt)
      },
      include: {
        section: {
          include: {
            course: true
          }
        }
      }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'SESSION_CREATED',
      resource: 'session',
      resourceId: session.id,
      details: sessionData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: session
    });
  })
);

/**
 * @swagger
 * /api/v1/sessions/{sessionId}/start:
 *   post:
 *     summary: Start a session and generate QR code
 *     tags: [Sessions]
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
 *         description: Session started successfully
 */
router.post('/:sessionId/start',
  requireRole([Role.faculty, Role.admin]),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { section: true }
    });

    if (!session) {
      throw notFound('Session not found');
    }

    // Check permissions
    if (req.user!.role === Role.faculty && session.section.facultyId !== req.user!.id) {
      throw forbidden('Cannot start this session');
    }

    if (session.status !== SessionStatus.scheduled) {
      throw badRequest('Session is not in scheduled state');
    }

    // Generate QR code data
    const qrData = {
      sessionId: session.id,
      timestamp: Date.now(),
      expires: Date.now() + (30 * 1000) // 30 seconds
    };

    const qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64');
    const qrExpiresAt = new Date(qrData.expires);

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrCode);

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.active,
        startedAt: new Date(),
        qrCode,
        qrExpiresAt
      },
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
                    rollNumber: true
                  }
                }
              }
            }
          }
        }
      }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'SESSION_STARTED',
      resource: 'session',
      resourceId: sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Session started successfully',
      data: {
        session: updatedSession,
        qrCode: qrCodeImage,
        qrExpiresAt
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/sessions/{sessionId}/qr:
 *   get:
 *     summary: Get current QR code for session
 *     tags: [Sessions]
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
 *         description: QR code retrieved successfully
 */
router.get('/:sessionId/qr',
  requireRole([Role.faculty, Role.admin]),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { section: true }
    });

    if (!session) {
      throw notFound('Session not found');
    }

    // Check permissions
    if (req.user!.role === Role.faculty && session.section.facultyId !== req.user!.id) {
      throw forbidden('Cannot access this session');
    }

    if (session.status !== SessionStatus.active) {
      throw badRequest('Session is not active');
    }

    // Check if QR code is expired and generate new one
    let qrCode = session.qrCode;
    let qrExpiresAt = session.qrExpiresAt;

    if (!qrCode || !qrExpiresAt || new Date() >= qrExpiresAt) {
      const qrData = {
        sessionId: session.id,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 1000) // 30 seconds
      };

      qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64');
      qrExpiresAt = new Date(qrData.expires);

      await prisma.session.update({
        where: { id: sessionId },
        data: { qrCode, qrExpiresAt }
      });
    }

    const qrCodeImage = await QRCode.toDataURL(qrCode);

    res.json({
      success: true,
      data: {
        qrCode: qrCodeImage,
        qrData: qrCode,
        expiresAt: qrExpiresAt
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/sessions/{sessionId}/end:
 *   post:
 *     summary: End a session
 *     tags: [Sessions]
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
 *         description: Session ended successfully
 */
router.post('/:sessionId/end',
  requireRole([Role.faculty, Role.admin]),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { section: true }
    });

    if (!session) {
      throw notFound('Session not found');
    }

    // Check permissions
    if (req.user!.role === Role.faculty && session.section.facultyId !== req.user!.id) {
      throw forbidden('Cannot end this session');
    }

    if (session.status !== SessionStatus.active) {
      throw badRequest('Session is not active');
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ended,
        endedAt: new Date(),
        qrCode: null,
        qrExpiresAt: null
      }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'SESSION_ENDED',
      resource: 'session',
      resourceId: sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Session ended successfully',
      data: updatedSession
    });
  })
);

/**
 * @swagger
 * /api/v1/sessions/active:
 *   get:
 *     summary: Get active sessions for current user
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 */
router.get('/active', asyncHandler(async (req, res) => {
  let where: any = { status: SessionStatus.active };

  if (req.user!.role === Role.student) {
    // Students see sessions for their enrolled sections
    where.section = {
      enrollments: {
        some: { studentId: req.user!.id }
      }
    };
  } else if (req.user!.role === Role.faculty) {
    // Faculty see sessions for their sections
    where.section = {
      facultyId: req.user!.id
    };
  }

  const sessions = await prisma.session.findMany({
    where,
    include: {
      section: {
        include: {
          course: true,
          faculty: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      attendance: req.user!.role === Role.student ? {
        where: { studentId: req.user!.id }
      } : undefined
    },
    orderBy: { scheduledAt: 'asc' }
  });

  res.json({
    success: true,
    data: sessions
  });
}));

export default router;
