import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        phone: string;
        name: string;
        departmentId?: string;
      };
      requestId?: string;
    }
  }
}

// JWT payload schema
const JWTPayloadSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(Role),
  phone: z.string(),
  name: z.string(),
  departmentId: z.string().optional(),
  iat: z.number(),
  exp: z.number()
});

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.access_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const payload = JWTPayloadSchema.parse(decoded);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        role: true,
        phone: true,
        name: true,
        departmentId: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found or inactive'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role,
      phone: user.phone,
      name: user.name,
      departmentId: user.departmentId || undefined
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (roles: Role | Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user owns resource or has admin/faculty role
export const requireOwnershipOrRole = (roles: Role | Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const userId = req.params.userId || req.params.id;

    // Allow if user has required role or owns the resource
    if (allowedRoles.includes(req.user.role) || req.user.id === userId) {
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions'
    });
  };
};

// Generate JWT tokens
export const generateTokens = (user: {
  id: string;
  role: Role;
  phone: string;
  name: string;
  departmentId?: string | null;
}) => {
  const payload = {
    userId: user.id,
    role: user.role,
    phone: user.phone,
    name: user.name,
    departmentId: user.departmentId || undefined
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m'
  });

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Set secure cookies
export const setTokenCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('access_token', tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// Clear auth cookies
export const clearTokenCookies = (res: Response) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
};
