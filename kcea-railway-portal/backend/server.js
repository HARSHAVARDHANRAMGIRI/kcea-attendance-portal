const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
require('dotenv').config();

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

// Rate limiting - Railway style
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Railway apps need higher limits for better UX
  message: {
    error: '🚂 Too many requests',
    message: 'Please slow down and try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://kcea-railway-portal.vercel.app',
      'https://portal.kcea.in'
    ];
    
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

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kcea-railway';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('🚂 Connected to MongoDB - Railway Express Ready!');
  console.log('📊 Database: KCEA Railway Portal');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: '🚂 Railway Express Running',
    service: 'KCEA Attendance Portal API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: '🚂 Welcome to KCEA Railway Portal API',
    service: 'Smart Attendance Management System',
    college: {
      name: 'Kshatriya College of Engineering',
      established: '2001',
      location: 'NH-16, 30km from Nizamabad',
      affiliation: 'JNTUH',
      certification: 'ISO 9001:2008',
      campus: '40 acres',
      placements: '1500+ students placed'
    },
    features: [
      '🎨 Railway/IRCTC Style UI',
      '📱 Mobile-First Design',
      '⚡ Real-time Attendance Tracking',
      '👨‍💼 Admin Dashboard',
      '📢 News & Events Management',
      '📊 CSV/PDF Export',
      '🔒 Secure Authentication'
    ],
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      attendance: '/api/attendance',
      admin: '/api/admin',
      news: '/api/news',
      student: '/api/student'
    },
    developer: {
      name: 'Harshavardhan Ramgir',
      github: 'https://github.com/HARSHAVARDHANRAMGIR'
    },
    timestamp: new Date().toISOString()
  });
});

// Import and use routes
try {
  const authRoutes = require('./routes/auth');
  const attendanceRoutes = require('./routes/attendance');
  const adminRoutes = require('./routes/admin');
  const newsRoutes = require('./routes/news');
  const studentRoutes = require('./routes/student');

  app.use('/api/auth', authRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/news', newsRoutes);
  app.use('/api/student', studentRoutes);
} catch (error) {
  console.log('⚠️ Routes not found, running in basic mode');
}

// 404 handler
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
      'GET /api/admin/dashboard - Admin dashboard'
    ],
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Railway Error:', err);
  
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
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: '🚂 Invalid Ticket',
      message: 'Please login again to get a valid ticket',
      timestamp: new Date().toISOString()
    });
  }
  
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
      stack: err.stack 
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

// Start server
app.listen(PORT, () => {
  console.log('🚂 KCEA Railway Express is now running!');
  console.log(`🌐 Station: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🎓 College: Kshatriya College of Engineering`);
  console.log(`🎨 Style: Railway/IRCTC Inspired`);
  console.log(`👨‍💻 Developer: Harshavardhan Ramgir`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
