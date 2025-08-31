const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news');
const studentRoutes = require('./routes/student');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
    },
  },
}));

app.use(compression());
app.use(cookieParser());

// Rate limiting - Railway style (more lenient for better UX)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs (Railway apps need higher limits)
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Auth rate limiting (more restrictive)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  }
});

// CORS configuration - Railway style (support multiple origins)
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:19006', // Expo dev server
      'https://portal.kcea.in',
      'https://kcea-portal.vercel.app',
      'https://kcea-attendance-portal.vercel.app'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// MongoDB connection with Railway-style error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('🚂 Connected to MongoDB Atlas - Railway Style!');
  console.log('📊 Database ready for KCEA Attendance Portal');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Health check endpoint - Railway style
app.get('/health', (req, res) => {
  res.json({ 
    status: '🚂 Railway Express Running',
    service: 'KCEA Attendance Portal API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Welcome route - Railway style
app.get('/', (req, res) => {
  res.json({
    message: '🚂 Welcome to KCEA Attendance Portal API - Railway Style',
    service: 'Smart Attendance Management System',
    college: {
      name: 'Kshatriya College of Engineering',
      established: '2001',
      location: 'NH-16, 30km from Nizamabad',
      affiliation: 'JNTUH',
      certification: 'ISO 9001:2008'
    },
    features: [
      'Railway/IRCTC Style UI',
      'Mobile-First Design',
      'Real-time Attendance Tracking',
      'Admin Dashboard',
      'News & Events Management',
      'CSV/PDF Export'
    ],
    endpoints: {
      auth: '/api/auth',
      attendance: '/api/attendance',
      admin: '/api/admin',
      news: '/api/news',
      student: '/api/student',
      health: '/health'
    },
    documentation: 'https://portal.kcea.in/docs'
  });
});

// API routes with Railway-style prefixes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/student', studentRoutes);

// 404 handler - Railway style
app.use('*', (req, res) => {
  res.status(404).json({
    error: '🚂 Station Not Found',
    message: `The route ${req.originalUrl} does not exist on this railway line`,
    suggestion: 'Check the available routes below',
    availableRoutes: [
      'GET / - Welcome message',
      'GET /health - Health check',
      'POST /api/auth/register - Student registration',
      'POST /api/auth/login - Student/Admin login',
      'POST /api/attendance/mark - Mark attendance',
      'GET /api/admin/dashboard - Admin dashboard',
      'GET /api/news - Latest news'
    ],
    timestamp: new Date().toISOString()
  });
});

// Global error handler - Railway style
app.use((err, req, res, next) => {
  console.error('🚨 Railway Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    return res.status(400).json({
      error: '🚂 Validation Failed',
      message: 'Please check your input data',
      details: errors,
      timestamp: new Date().toISOString()
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(400).json({
      error: '🚂 Duplicate Entry',
      message: `${field} '${value}' already exists`,
      field: field,
      timestamp: new Date().toISOString()
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: '🚂 Invalid Ticket',
      message: 'Please login again to get a valid ticket',
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: '🚂 Ticket Expired',
      message: 'Your session has expired, please login again',
      timestamp: new Date().toISOString()
    });
  }
  
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: '🚂 Access Denied',
      message: 'This origin is not allowed to access the railway system',
      timestamp: new Date().toISOString()
    });
  }
  
  // Default error - Railway style
  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? '🚂 Something went wrong on the railway line' 
    : err.message;
  
  res.status(statusCode).json({
    error: '🚂 Railway System Error',
    message: message,
    statusCode: statusCode,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      details: err 
    })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🚂 Railway system shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📊 Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🚂 Railway system interrupted, shutting down...');
  mongoose.connection.close(() => {
    console.log('📊 Database connection closed');
    process.exit(0);
  });
});

// Start server - Railway style
app.listen(PORT, () => {
  console.log('🚂 KCEA Railway Express is now running!');
  console.log(`🌐 Station: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🎓 College: Kshatriya College of Engineering`);
  console.log(`🎨 Style: Railway/IRCTC Inspired`);
  console.log(`📱 Mobile-First: Optimized for all devices`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
