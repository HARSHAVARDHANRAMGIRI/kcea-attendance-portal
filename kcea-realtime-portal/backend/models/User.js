/**
 * User Model - MongoDB Schema
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]+$/, 'Roll number must contain only letters and numbers']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
  },
  
  // Academic Information
  class: {
    type: String,
    required: [true, 'Class is required'],
    trim: true,
    // Examples: "B.Tech 1st Year CSE", "B.Tech 2nd Year ECE"
  },
  
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  },
  
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    enum: {
      values: ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'CSE(DS)', 'IT', 'AERO', 'CHEM', 'BIOTECH'],
      message: 'Please select a valid branch'
    }
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student'
  },
  
  // Profile Information
  profilePicture: {
    type: String,
    default: null // Cloudinary URL
  },
  
  // Email Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: {
    type: String,
    select: false
  },
  
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  
  // OTP for login
  otpCode: {
    type: String,
    select: false
  },
  
  otpExpires: {
    type: Date,
    select: false
  },
  
  otpAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  
  lastOtpRequest: {
    type: Date,
    select: false
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  blockedUntil: {
    type: Date,
    select: false
  },
  
  // Login Information
  lastLogin: {
    type: Date
  },
  
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  
  // Attendance Summary (calculated fields)
  attendanceSummary: {
    totalClasses: {
      type: Number,
      default: 0
    },
    attendedClasses: {
      type: Number,
      default: 0
    },
    attendancePercentage: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Notification Preferences
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  
  // FCM Token for push notifications
  fcmToken: {
    type: String,
    select: false
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ================================
// INDEXES
// ================================

userSchema.index({ rollNumber: 1 });
userSchema.index({ email: 1 });
userSchema.index({ class: 1, semester: 1 });
userSchema.index({ branch: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ================================
// VIRTUAL FIELDS
// ================================

// Full academic info
userSchema.virtual('academicInfo').get(function() {
  return `${this.class} - Semester ${this.semester}`;
});

// Display name
userSchema.virtual('displayName').get(function() {
  return `${this.fullName} (${this.rollNumber})`;
});

// ================================
// MIDDLEWARE
// ================================

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update attendance summary before saving
userSchema.pre('save', function(next) {
  if (this.isModified('attendanceSummary.totalClasses') || this.isModified('attendanceSummary.attendedClasses')) {
    const { totalClasses, attendedClasses } = this.attendanceSummary;
    this.attendanceSummary.attendancePercentage = totalClasses > 0 ? 
      Math.round((attendedClasses / totalClasses) * 100 * 100) / 100 : 0;
    this.attendanceSummary.lastUpdated = new Date();
  }
  next();
});

// ================================
// INSTANCE METHODS
// ================================

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpCode = otp;
  this.otpExpires = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRES_IN) || 60) * 1000);
  this.lastOtpRequest = new Date();
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function(candidateOTP) {
  if (!this.otpCode || !this.otpExpires) {
    return false;
  }
  
  if (this.otpExpires < new Date()) {
    return false;
  }
  
  return this.otpCode === candidateOTP;
};

// Clear OTP
userSchema.methods.clearOTP = function() {
  this.otpCode = undefined;
  this.otpExpires = undefined;
  this.otpAttempts = 0;
};

// Check if account is locked
userSchema.methods.isAccountLocked = function() {
  return this.isBlocked && this.blockedUntil && this.blockedUntil > new Date();
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.blockedUntil && this.blockedUntil < new Date()) {
    return this.updateOne({
      $unset: { blockedUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have exceeded max attempts and it's not locked already, lock it
  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = {
      blockedUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      isBlocked: true
    };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, blockedUntil: 1 },
    $set: { isBlocked: false }
  });
};

// Update attendance summary
userSchema.methods.updateAttendanceSummary = async function(totalClasses, attendedClasses) {
  this.attendanceSummary.totalClasses = totalClasses;
  this.attendanceSummary.attendedClasses = attendedClasses;
  this.attendanceSummary.attendancePercentage = totalClasses > 0 ? 
    Math.round((attendedClasses / totalClasses) * 100 * 100) / 100 : 0;
  this.attendanceSummary.lastUpdated = new Date();
  
  return await this.save();
};

// ================================
// STATIC METHODS
// ================================

// Find by roll number
userSchema.statics.findByRollNumber = function(rollNumber) {
  return this.findOne({ rollNumber: rollNumber.toUpperCase() });
};

// Find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Get students by class and semester
userSchema.statics.getStudentsByClass = function(className, semester) {
  return this.find({ 
    class: className, 
    semester: semester, 
    role: 'student',
    isActive: true 
  }).select('-password');
};

// Get attendance statistics
userSchema.statics.getAttendanceStats = function() {
  return this.aggregate([
    { $match: { role: 'student', isActive: true } },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        averageAttendance: { $avg: '$attendanceSummary.attendancePercentage' },
        studentsAbove85: {
          $sum: {
            $cond: [{ $gte: ['$attendanceSummary.attendancePercentage', 85] }, 1, 0]
          }
        },
        studentsBelow75: {
          $sum: {
            $cond: [{ $lt: ['$attendanceSummary.attendancePercentage', 75] }, 1, 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema);
