/**
 * Global Error Handler Middleware
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('🚨 Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = {
      message,
      statusCode: 400,
      code: 'INVALID_ID'
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    error = {
      message,
      statusCode: 400,
      code: 'DUPLICATE_FIELD',
      field,
      value
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      errors: Object.values(err.errors).map(val => ({
        field: val.path,
        message: val.message,
        value: val.value
      }))
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid authentication token',
      statusCode: 401,
      code: 'INVALID_TOKEN'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Authentication token has expired',
      statusCode: 401,
      code: 'TOKEN_EXPIRED'
    };
  }

  // Rate limiting error
  if (err.status === 429) {
    error = {
      message: 'Too many requests, please try again later',
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED'
    };
  }

  // CORS error
  if (err.message && err.message.includes('CORS')) {
    error = {
      message: 'Cross-origin request blocked',
      statusCode: 403,
      code: 'CORS_ERROR'
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'File size too large',
      statusCode: 400,
      code: 'FILE_TOO_LARGE'
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: 'Unexpected file field',
      statusCode: 400,
      code: 'UNEXPECTED_FILE'
    };
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError') {
    error = {
      message: 'Database connection failed',
      statusCode: 503,
      code: 'DATABASE_CONNECTION_ERROR'
    };
  }

  if (err.name === 'MongoTimeoutError') {
    error = {
      message: 'Database operation timed out',
      statusCode: 503,
      code: 'DATABASE_TIMEOUT'
    };
  }

  // Email service errors
  if (err.code === 'EAUTH' || err.responseCode === 535) {
    error = {
      message: 'Email service authentication failed',
      statusCode: 500,
      code: 'EMAIL_AUTH_ERROR'
    };
  }

  if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT') {
    error = {
      message: 'Email service connection failed',
      statusCode: 500,
      code: 'EMAIL_CONNECTION_ERROR'
    };
  }

  // Default error response
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'INTERNAL_ERROR';

  // Prepare error response
  const errorResponse = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add additional error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = error;
  }

  // Add validation errors if present
  if (error.errors) {
    errorResponse.validationErrors = error.errors;
  }

  // Add field and value for duplicate errors
  if (error.field && error.value) {
    errorResponse.duplicateField = {
      field: error.field,
      value: error.value
    };
  }

  // Log error details for monitoring
  if (statusCode >= 500) {
    console.error('🔥 Server Error:', {
      message,
      code,
      path: req.originalUrl,
      method: req.method,
      user: req.user ? req.user._id : 'Anonymous',
      timestamp: new Date().toISOString(),
      stack: err.stack
    });
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
