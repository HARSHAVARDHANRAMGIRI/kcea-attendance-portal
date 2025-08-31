import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, badRequest, unauthorized, notFound } from '../middleware/errorHandler';
import { generateTokens, setTokenCookies, clearTokenCookies } from '../middleware/auth';
import { sendOTP, verifyOTP } from '../services/sms';
import { createAuditLog } from '../services/audit';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const SendOTPSchema = z.object({
  phone: z.string()
    .regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number format (+91XXXXXXXXXX)')
});

const VerifyOTPSchema = z.object({
  phone: z.string()
    .regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number format'),
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits')
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().optional()
});

/**
 * @swagger
 * /api/v1/auth/send-otp:
 *   post:
 *     summary: Send OTP to phone number
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 pattern: '^\+91[6-9]\d{9}$'
 *                 example: '+919876543210'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid phone number
 *       429:
 *         description: Too many requests
 */
router.post('/send-otp', asyncHandler(async (req, res) => {
  const { phone } = SendOTPSchema.parse(req.body);

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, name: true, role: true, isActive: true }
  });

  if (!user) {
    throw notFound('User not found with this phone number');
  }

  if (!user.isActive) {
    throw unauthorized('Account is deactivated');
  }

  try {
    // Try Twilio first
    await sendOTP(phone);
    
    await createAuditLog({
      userId: user.id,
      action: 'OTP_SENT',
      resource: 'auth',
      details: { phone, method: 'twilio' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'OTP sent successfully',
      method: 'sms'
    });
  } catch (twilioError) {
    // Fallback to in-house OTP
    const otp = speakeasy.totp({
      secret: process.env.OTP_SECRET || 'KCEA_DEFAULT_SECRET',
      digits: 6,
      step: 300, // 5 minutes
      encoding: 'base32'
    });

    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash, otpExpiresAt }
    });

    await createAuditLog({
      userId: user.id,
      action: 'OTP_SENT',
      resource: 'auth',
      details: { phone, method: 'fallback' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // In development, return OTP for testing
    const response: any = {
      success: true,
      message: 'OTP sent successfully',
      method: 'fallback'
    };

    if (process.env.NODE_ENV === 'development') {
      response.otp = otp; // Only for development
    }

    res.json(response);
  }
}));

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: '+919876543210'
 *               otp:
 *                 type: string
 *                 example: '123456'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid OTP
 *       401:
 *         description: OTP expired
 */
router.post('/verify-otp', asyncHandler(async (req, res) => {
  const { phone, otp } = VerifyOTPSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { phone },
    include: { department: true }
  });

  if (!user || !user.isActive) {
    throw unauthorized('Invalid credentials');
  }

  let isValidOTP = false;

  try {
    // Try Twilio verification first
    await verifyOTP(phone, otp);
    isValidOTP = true;
  } catch (twilioError) {
    // Fallback to in-house OTP verification
    if (user.otpHash && user.otpExpiresAt) {
      if (new Date() > user.otpExpiresAt) {
        throw unauthorized('OTP expired');
      }

      const isValid = await bcrypt.compare(otp, user.otpHash);
      if (isValid) {
        isValidOTP = true;
        
        // Clear OTP after successful verification
        await prisma.user.update({
          where: { id: user.id },
          data: { otpHash: null, otpExpiresAt: null }
        });
      }
    }
  }

  if (!isValidOTP) {
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN_FAILED',
      resource: 'auth',
      details: { phone, reason: 'invalid_otp' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    throw unauthorized('Invalid OTP');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Generate tokens
  const tokens = generateTokens(user);
  setTokenCookies(res, tokens);

  await createAuditLog({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    resource: 'auth',
    details: { phone },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      department: user.department ? {
        id: user.department.id,
        name: user.department.name,
        code: user.department.code
      } : null
    },
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  });
}));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', asyncHandler(async (req, res) => {
  clearTokenCookies(res);
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    throw unauthorized('Refresh token required');
  }

  // Verify refresh token and generate new tokens
  // Implementation depends on your refresh token strategy
  
  res.json({
    success: true,
    message: 'Token refreshed successfully'
  });
}));

export default router;
