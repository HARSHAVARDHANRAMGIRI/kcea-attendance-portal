/**
 * Authentication & Authorization Middleware
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ================================
// JWT TOKEN AUTHENTICATION
// ================================

const authenticateToken = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password -otpCode -otpExpires');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account deactivated',
          message: 'Your account has been deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Check if user is blocked
      if (user.isAccountLocked()) {
        return res.status(401).json({
          success: false,
          error: 'Account locked',
          message: 'Your account is temporarily locked due to multiple failed login attempts',
          code: 'ACCOUNT_LOCKED',
          blockedUntil: user.blockedUntil
        });
      }

      // Attach user to request
      req.user = user;
      next();

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          message: 'Your session has expired. Please login again',
          code: 'TOKEN_EXPIRED'
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Authentication token is invalid',
          code: 'INVALID_TOKEN'
        });
      }

      throw jwtError;
    }

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

// ================================
// ROLE-BASED AUTHORIZATION
// ================================

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please authenticate first',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access forbidden',
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// ================================
// SPECIFIC ROLE MIDDLEWARES
// ================================

const requireAdmin = authorizeRoles('admin');
const requireFaculty = authorizeRoles('faculty', 'admin');
const requireStudent = authorizeRoles('student', 'faculty', 'admin');

// ================================
// RESOURCE OWNERSHIP AUTHORIZATION
// ================================

const authorizeOwnership = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Faculty can access students in their classes (implement as needed)
      if (req.user.role === 'faculty') {
        // Add faculty-specific authorization logic here
        return next();
      }

      // Students can only access their own resources
      if (req.user.role === 'student') {
        const resourceUserId = req.params.userId || req.body[resourceField] || req.query.userId;
        
        if (resourceUserId && resourceUserId !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            error: 'Access forbidden',
            message: 'You can only access your own resources',
            code: 'OWNERSHIP_REQUIRED'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization failed',
        message: 'Internal server error during authorization',
        code: 'AUTHZ_ERROR'
      });
    }
  };
};

// ================================
// EMAIL VERIFICATION MIDDLEWARE
// ================================

const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
      message: 'Please verify your email address to access this resource',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

// ================================
// OPTIONAL AUTHENTICATION
// ================================

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password -otpCode -otpExpires');
        
        if (user && user.isActive && !user.isAccountLocked()) {
          req.user = user;
        }
      } catch (jwtError) {
        // Ignore JWT errors for optional auth
        console.log('Optional auth failed:', jwtError.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue without authentication
  }
};

// ================================
// RATE LIMITING BY USER
// ================================

const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (userRequests.has(userId)) {
      const requests = userRequests.get(userId).filter(time => time > windowStart);
      userRequests.set(userId, requests);
    } else {
      userRequests.set(userId, []);
    }

    const userRequestCount = userRequests.get(userId).length;

    if (userRequestCount >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Maximum ${maxRequests} requests per ${windowMs / 1000 / 60} minutes`,
        code: 'USER_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    userRequests.get(userId).push(now);
    next();
  };
};

// ================================
// GENERATE JWT TOKEN
// ================================

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'kcea-portal',
      audience: 'kcea-users'
    }
  );
};

// ================================
// GENERATE REFRESH TOKEN
// ================================

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { 
      expiresIn: '30d',
      issuer: 'kcea-portal',
      audience: 'kcea-users'
    }
  );
};

// ================================
// SET TOKEN COOKIE
// ================================

const setTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('token', token, cookieOptions);
};

// ================================
// CLEAR TOKEN COOKIE
// ================================

const clearTokenCookie = (res) => {
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireAdmin,
  requireFaculty,
  requireStudent,
  authorizeOwnership,
  requireEmailVerification,
  optionalAuth,
  userRateLimit,
  generateToken,
  generateRefreshToken,
  setTokenCookie,
  clearTokenCookie
};
