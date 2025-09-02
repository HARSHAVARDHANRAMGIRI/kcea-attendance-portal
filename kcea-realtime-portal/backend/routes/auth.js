/**
 * Authentication Routes - Email OTP System
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');
const { 
  generateToken, 
  setTokenCookie, 
  clearTokenCookie,
  authenticateToken 
} = require('../middleware/auth');

const router = express.Router();

// ================================
// RATE LIMITING
// ================================

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 registration attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many registration attempts',
    message: 'Please wait 15 minutes before trying again',
    code: 'REGISTRATION_RATE_LIMIT'
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many login attempts',
    message: 'Please wait 15 minutes before trying again',
    code: 'LOGIN_RATE_LIMIT'
  }
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 OTP requests per 15 minutes
  message: {
    success: false,
    error: 'Too many OTP requests',
    message: 'Please wait 15 minutes before requesting another OTP',
    code: 'OTP_RATE_LIMIT'
  }
});

// ================================
// VALIDATION RULES
// ================================

const registerValidation = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
    
  body('rollNumber')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Roll number must be between 3 and 20 characters')
    .matches(/^[A-Z0-9]+$/i)
    .withMessage('Roll number can only contain letters and numbers'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('phoneNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit phone number starting with 6-9'),
    
  body('class')
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Class must be between 5 and 50 characters'),
    
  body('semester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
    
  body('branch')
    .isIn(['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'CSE(DS)', 'IT', 'AERO', 'CHEM', 'BIOTECH'])
    .withMessage('Please select a valid branch'),
    
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const otpValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('otpCode')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number')
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

// ================================
// ROUTES
// ================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerLimiter, registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { fullName, rollNumber, email, phoneNumber, class: userClass, semester, branch, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { rollNumber: rollNumber.toUpperCase() }
      ]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'roll number';
      return res.status(400).json({
        success: false,
        error: 'User already exists',
        message: `A user with this ${field} already exists`,
        code: 'USER_EXISTS',
        field
      });
    }

    // Create new user
    const user = new User({
      fullName: fullName.trim(),
      rollNumber: rollNumber.toUpperCase(),
      email: email.toLowerCase(),
      phoneNumber,
      class: userClass.trim(),
      semester,
      branch,
      password,
      role: 'student' // Default role
    });

    await user.save();

    // Generate OTP for email verification
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(user.email, user.fullName, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't fail registration if email fails
    }

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('user_registered', {
      userId: user._id,
      fullName: user.fullName,
      rollNumber: user.rollNumber,
      branch: user.branch,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for OTP verification',
      data: {
        userId: user._id,
        fullName: user.fullName,
        rollNumber: user.rollNumber,
        email: user.email,
        class: user.class,
        semester: user.semester,
        branch: user.branch,
        isEmailVerified: user.isEmailVerified,
        otpSent: true
      },
      nextStep: 'verify-otp'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration. Please try again',
      code: 'REGISTRATION_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and send OTP
 * @access  Public
 */
router.post('/login', loginLimiter, loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +otpCode +otpExpires +loginAttempts +blockedUntil');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'No account found with this email address',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      return res.status(423).json({
        success: false,
        error: 'Account locked',
        message: 'Your account is temporarily locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED',
        blockedUntil: user.blockedUntil
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact administrator',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Incorrect password',
        code: 'INVALID_PASSWORD',
        remainingAttempts: Math.max(0, 5 - (user.loginAttempts + 1))
      });
    }

    // Reset login attempts on successful password verification
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Generate and send OTP
    const otp = user.generateOTP();
    await user.save();

    try {
      await sendOTPEmail(user.email, user.fullName, otp, 'login');
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Email service error',
        message: 'Failed to send OTP. Please try again',
        code: 'EMAIL_SEND_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email address',
      data: {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
        otpSent: true,
        otpExpiresIn: parseInt(process.env.OTP_EXPIRES_IN) || 60
      },
      nextStep: 'verify-otp'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login. Please try again',
      code: 'LOGIN_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and complete authentication
 * @access  Public
 */
router.post('/verify-otp', otpLimiter, otpValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    // Find user with OTP fields
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otpCode +otpExpires +otpAttempts');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No account found with this email address',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check OTP attempts
    if (user.otpAttempts >= (parseInt(process.env.MAX_OTP_ATTEMPTS) || 3)) {
      user.clearOTP();
      await user.save();
      
      return res.status(429).json({
        success: false,
        error: 'Too many OTP attempts',
        message: 'Maximum OTP attempts exceeded. Please request a new OTP',
        code: 'MAX_OTP_ATTEMPTS'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otpCode)) {
      user.otpAttempts += 1;
      await user.save();
      
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP',
        message: 'The OTP you entered is incorrect or has expired',
        code: 'INVALID_OTP',
        remainingAttempts: Math.max(0, (parseInt(process.env.MAX_OTP_ATTEMPTS) || 3) - user.otpAttempts)
      });
    }

    // OTP verified successfully
    user.clearOTP();
    user.isEmailVerified = true;
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('user_login', {
      userId: user._id,
      fullName: user.fullName,
      rollNumber: user.rollNumber,
      role: user.role,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Login successful! Welcome to KCEA Portal',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          rollNumber: user.rollNumber,
          email: user.email,
          phoneNumber: user.phoneNumber,
          class: user.class,
          semester: user.semester,
          branch: user.branch,
          role: user.role,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified,
          attendanceSummary: user.attendanceSummary,
          lastLogin: user.lastLogin
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'OTP verification failed',
      message: 'An error occurred during OTP verification. Please try again',
      code: 'OTP_VERIFICATION_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to user's email
 * @access  Public
 */
router.post('/resend-otp', otpLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address')
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+lastOtpRequest');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No account found with this email address',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check resend cooldown
    const cooldownPeriod = parseInt(process.env.OTP_RESEND_COOLDOWN) || 30; // seconds
    if (user.lastOtpRequest && (new Date() - user.lastOtpRequest) < cooldownPeriod * 1000) {
      const remainingTime = Math.ceil((cooldownPeriod * 1000 - (new Date() - user.lastOtpRequest)) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Resend cooldown active',
        message: `Please wait ${remainingTime} seconds before requesting another OTP`,
        code: 'RESEND_COOLDOWN',
        remainingTime
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(user.email, user.fullName, otp, 'resend');
    } catch (emailError) {
      console.error('Failed to resend OTP email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Email service error',
        message: 'Failed to send OTP. Please try again',
        code: 'EMAIL_SEND_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        email: user.email,
        otpExpiresIn: parseInt(process.env.OTP_EXPIRES_IN) || 60,
        nextResendIn: cooldownPeriod
      }
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Resend OTP failed',
      message: 'An error occurred while resending OTP. Please try again',
      code: 'RESEND_OTP_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Clear token cookie
    clearTokenCookie(res);

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('user_logout', {
      userId: req.user._id,
      fullName: req.user.fullName,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'An error occurred during logout',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          fullName: req.user.fullName,
          rollNumber: req.user.rollNumber,
          email: req.user.email,
          phoneNumber: req.user.phoneNumber,
          class: req.user.class,
          semester: req.user.semester,
          branch: req.user.branch,
          role: req.user.role,
          profilePicture: req.user.profilePicture,
          isEmailVerified: req.user.isEmailVerified,
          attendanceSummary: req.user.attendanceSummary,
          lastLogin: req.user.lastLogin,
          createdAt: req.user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      message: 'An error occurred while fetching profile',
      code: 'GET_PROFILE_ERROR'
    });
  }
});

module.exports = router;
