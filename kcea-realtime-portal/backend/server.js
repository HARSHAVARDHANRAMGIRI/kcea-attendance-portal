/**
 * KCEA Real-time Attendance Portal - Backend Server
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 * Email: r.harsha0541@gmail.com
 * 
 * Production-ready Node.js/Express server with:
 * - MongoDB Atlas integration
 * - Socket.IO for real-time updates
 * - JWT authentication with email OTP
 * - Role-based access control
 * - Comprehensive security middleware
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');

// Import middleware
const { authenticateToken, authorizeRoles } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { connectDB } = require('./config/database');

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// ================================
// SECURITY MIDDLEWARE
// ================================

// Helmet for security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
      connectSrc: ["'self'", "https:", "wss:", "ws:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
});

// Prevent parameter pollution
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Specific rate limiting for OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.OTP_RATE_LIMIT) || 5,
  message: {
    error: 'Too many OTP requests',
    message: 'Please wait before requesting another OTP',
    retryAfter: '15 minutes'
  },
  skip: (req) => !req.path.includes('/otp')
});
app.use('/api/auth', otpLimiter);

// ================================
// CORS CONFIGURATION
// ================================

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
    
    // Allow requests with no origin (mobile apps, etc.)
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

// ================================
// BODY PARSING MIDDLEWARE
// ================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================================
// LOGGING
// ================================

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ================================
// DATABASE CONNECTION
// ================================

connectDB();

// ================================
// SOCKET.IO REAL-TIME FEATURES
// ================================

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Handle user authentication for socket
  socket.on('authenticate', (data) => {
    const { userId, role } = data;
    connectedUsers.set(socket.id, { userId, role, socketId: socket.id });
    socket.join(`user_${userId}`);
    socket.join(`role_${role}`);
    
    console.log(`✅ User authenticated: ${userId} (${role})`);
  });

  // Handle attendance marking
  socket.on('attendance_marked', (data) => {
    // Broadcast to all admin and faculty users
    socket.to('role_admin').emit('attendance_update', data);
    socket.to('role_faculty').emit('attendance_update', data);
    
    console.log(`📊 Attendance marked: ${data.studentId} - ${data.subject}`);
  });

  // Handle bulk attendance updates
  socket.on('bulk_attendance_update', (data) => {
    // Broadcast to all connected users
    io.emit('attendance_bulk_update', data);
    
    console.log(`📊 Bulk attendance update: ${data.length} records`);
  });

  // Handle user profile updates
  socket.on('profile_updated', (data) => {
    socket.to(`user_${data.userId}`).emit('profile_update', data);
  });

  // Handle notifications
  socket.on('send_notification', (data) => {
    const { targetUserId, notification } = data;
    socket.to(`user_${targetUserId}`).emit('notification', notification);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// ================================
// HEALTH CHECK ENDPOINT
// ================================

app.get('/health', (req, res) => {
  res.json({ 
    status: '🚀 KCEA Real-time Portal API Running',
    service: 'KCEA Attendance Management System',
    timestamp: new Date().toISOString(),
    version: '2.0.0 - Production Ready',
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    connectedUsers: connectedUsers.size,
    developer: {
      name: 'Harshavardhan Ramgiri',
      company: 'AUTOFLOW AGENCY',
      email: 'r.harsha0541@gmail.com'
    }
  });
});

// ================================
// WELCOME ROUTE
// ================================

app.get('/', (req, res) => {
  res.json({
    message: '🎓 Welcome to KCEA Real-time Attendance Portal API',
    service: 'Smart Attendance Management System',
    college: {
      name: process.env.COLLEGE_NAME || 'Kshatriya College of Engineering',
      established: process.env.COLLEGE_ESTABLISHED || '2001',
      location: process.env.COLLEGE_LOCATION || 'NH-16, 30km from Nizamabad',
      affiliation: process.env.COLLEGE_AFFILIATION || 'JNTUH',
      certification: 'ISO 9001:2008',
      campus: '40 acres',
      placements: '1500+ students placed'
    },
    features: [
      '🔐 Email OTP Authentication',
      '📊 Real-time Attendance Tracking',
      '👥 Role-based Dashboards',
      '📱 Mobile-First Design',
      '🔄 WebSocket Live Updates',
      '📧 Email Notifications',
      '📈 Advanced Analytics',
      '📋 CSV/Excel Export',
      '🔒 Enterprise Security'
    ],
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      attendance: '/api/attendance',
      dashboard: '/api/dashboard',
      notifications: '/api/notifications'
    },
    developer: {
      name: 'Harshavardhan Ramgiri',
      company: 'AUTOFLOW AGENCY',
      email: 'r.harsha0541@gmail.com',
      github: 'https://github.com/HARSHAVARDHANRAMGIRI',
      description: 'Full-stack developer passionate about educational technology and real-time systems'
    },
    timestamp: new Date().toISOString()
  });
});

// ================================
// API ROUTES
// ================================

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// ================================
// 404 HANDLER
// ================================

app.use('*', (req, res) => {
  res.status(404).json({
    error: '🔍 Endpoint Not Found',
    message: `The route ${req.originalUrl} does not exist on this server`,
    suggestion: 'Check the available routes below',
    availableRoutes: [
      'GET / - Welcome message',
      'GET /health - Health check',
      'POST /api/auth/register - User registration',
      'POST /api/auth/login - User login',
      'POST /api/auth/verify-otp - OTP verification',
      'GET /api/dashboard/admin - Admin dashboard',
      'POST /api/attendance/mark - Mark attendance'
    ],
    timestamp: new Date().toISOString()
  });
});

// ================================
// GLOBAL ERROR HANDLER
// ================================

app.use(errorHandler);

// ================================
// GRACEFUL SHUTDOWN
// ================================

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('🔌 HTTP server closed');
    mongoose.connection.close(() => {
      console.log('📊 Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('🔌 HTTP server closed');
    mongoose.connection.close(() => {
      console.log('📊 Database connection closed');
      process.exit(0);
    });
  });
});

// ================================
// START SERVER
// ================================

server.listen(PORT, () => {
  console.log('🚀 KCEA Real-time Attendance Portal API Started!');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🎓 College: ${process.env.COLLEGE_NAME || 'Kshatriya College of Engineering'}`);
  console.log(`🎨 Real-time Features: Socket.IO Enabled`);
  console.log(`👨‍💻 Developer: Harshavardhan Ramgiri - AUTOFLOW AGENCY`);
  console.log(`📧 Contact: r.harsha0541@gmail.com`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 Connected Users: ${connectedUsers.size}`);
});

module.exports = { app, server, io };
