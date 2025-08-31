import express from 'express';
import { z } from 'zod';
import { PrismaClient, Role } from '@prisma/client';
import { asyncHandler, notFound } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/v1/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: programId
 *         schema:
 *           type: string
 *       - in: query
 *         name: semester
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 */
router.get('/', asyncHandler(async (req, res) => {
  const where: any = { isActive: true };
  
  if (req.query.programId) {
    where.programId = req.query.programId;
  }
  
  if (req.query.semester) {
    where.semester = parseInt(req.query.semester as string);
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      program: {
        include: {
          department: true
        }
      },
      sections: {
        where: { isActive: true },
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      }
    },
    orderBy: [
      { semester: 'asc' },
      { code: 'asc' }
    ]
  });

  res.json({
    success: true,
    data: courses
  });
}));

/**
 * @swagger
 * /api/v1/courses/{courseId}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *       404:
 *         description: Course not found
 */
router.get('/:courseId', asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      program: {
        include: {
          department: true
        }
      },
      sections: {
        where: { isActive: true },
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
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
          },
          sessions: {
            orderBy: { scheduledAt: 'desc' },
            take: 10
          }
        }
      }
    }
  });

  if (!course) {
    throw notFound('Course not found');
  }

  res.json({
    success: true,
    data: course
  });
}));

/**
 * @swagger
 * /api/v1/courses/my-courses:
 *   get:
 *     summary: Get courses for current user
 *     tags: [Courses]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User courses retrieved successfully
 */
router.get('/my-courses', asyncHandler(async (req, res) => {
  let courses;

  if (req.user!.role === Role.student) {
    // Get enrolled courses for student
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user!.id },
      include: {
        section: {
          include: {
            course: {
              include: {
                program: {
                  include: {
                    department: true
                  }
                }
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
    });

    courses = enrollments.map(e => ({
      ...e.section.course,
      section: {
        id: e.section.id,
        name: e.section.name,
        faculty: e.section.faculty,
        schedule: e.section.schedule
      }
    }));
  } else if (req.user!.role === Role.faculty) {
    // Get assigned sections for faculty
    const sections = await prisma.section.findMany({
      where: { 
        facultyId: req.user!.id,
        isActive: true
      },
      include: {
        course: {
          include: {
            program: {
              include: {
                department: true
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
            sessions: true
          }
        }
      }
    });

    courses = sections.map(section => ({
      ...section.course,
      section: {
        id: section.id,
        name: section.name,
        enrollmentCount: section._count.enrollments,
        sessionCount: section._count.sessions,
        schedule: section.schedule
      }
    }));
  } else {
    // Admin gets all courses
    courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        program: {
          include: {
            department: true
          }
        },
        sections: {
          where: { isActive: true },
          include: {
            faculty: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                enrollments: true
              }
            }
          }
        }
      }
    });
  }

  res.json({
    success: true,
    data: courses
  });
}));

export default router;
