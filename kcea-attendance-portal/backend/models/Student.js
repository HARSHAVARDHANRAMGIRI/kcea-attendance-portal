const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[0-9]{2}[A-Z]{2,4}[0-9]{3}$/, 'Invalid roll number format (e.g., 20CS001)']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[6-9]\d{9}$/, 'Invalid phone number format (10 digits starting with 6-9)']
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    enum: {
      values: ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'CSE(DS)'],
      message: 'Branch must be one of: CSE, ECE, MECH, CIVIL, EEE, CSE(DS)'
    }
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1, 'Year must be between 1 and 4'],
    max: [4, 'Year must be between 1 and 4']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Railway-style attendance tracking
  attendanceStats: {
    totalClasses: {
      type: Number,
      default: 0
    },
    attendedClasses: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  // Railway-style preferences
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'te'],
      default: 'en'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes for Railway-style performance
studentSchema.index({ rollNo: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ branch: 1, year: 1 });
studentSchema.index({ 'attendanceStats.percentage': -1 });
studentSchema.index({ createdAt: -1 });
studentSchema.index({ lastLogin: -1 });

// Hash password before saving - Railway security
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password - Railway authentication
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update attendance percentage - Railway style calculation
studentSchema.methods.updateAttendanceStats = function() {
  const { totalClasses, attendedClasses } = this.attendanceStats;
  
  if (totalClasses === 0) {
    this.attendanceStats.percentage = 0;
  } else {
    this.attendanceStats.percentage = Math.round((attendedClasses / totalClasses) * 100);
  }
  
  this.attendanceStats.lastUpdated = new Date();
  return this.save();
};

// Method to increment attendance - Railway style tracking
studentSchema.methods.markAttendance = function(status = 'Present') {
  this.attendanceStats.totalClasses += 1;
  
  if (status === 'Present') {
    this.attendanceStats.attendedClasses += 1;
  }
  
  return this.updateAttendanceStats();
};

// Static method to get branch statistics - Railway analytics
studentSchema.statics.getBranchStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$branch',
        totalStudents: { $sum: 1 },
        activeStudents: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        avgAttendance: { $avg: '$attendanceStats.percentage' },
        highPerformers: {
          $sum: { $cond: [{ $gte: ['$attendanceStats.percentage', 85] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        branch: '$_id',
        totalStudents: 1,
        activeStudents: 1,
        avgAttendance: { $round: ['$avgAttendance', 2] },
        highPerformers: 1,
        performanceRate: {
          $round: [
            { $multiply: [{ $divide: ['$highPerformers', '$totalStudents'] }, 100] },
            2
          ]
        }
      }
    },
    { $sort: { branch: 1 } }
  ]);
};

// Static method to get year-wise statistics - Railway insights
studentSchema.statics.getYearStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$year',
        totalStudents: { $sum: 1 },
        avgAttendance: { $avg: '$attendanceStats.percentage' },
        branches: { $addToSet: '$branch' }
      }
    },
    {
      $project: {
        year: '$_id',
        totalStudents: 1,
        avgAttendance: { $round: ['$avgAttendance', 2] },
        branchCount: { $size: '$branches' }
      }
    },
    { $sort: { year: 1 } }
  ]);
};

// Static method to get top performers - Railway leaderboard
studentSchema.statics.getTopPerformers = async function(limit = 10) {
  return this.find({ isActive: true })
    .select('rollNo name branch year attendanceStats')
    .sort({ 'attendanceStats.percentage': -1, 'attendanceStats.totalClasses': -1 })
    .limit(limit);
};

// Static method to get low attendance students - Railway alerts
studentSchema.statics.getLowAttendanceStudents = async function(threshold = 75) {
  return this.find({
    isActive: true,
    'attendanceStats.percentage': { $lt: threshold },
    'attendanceStats.totalClasses': { $gte: 10 } // Only consider students with at least 10 classes
  })
  .select('rollNo name branch year attendanceStats phone email')
  .sort({ 'attendanceStats.percentage': 1 });
};

// Virtual for full display name - Railway style
studentSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.rollNo})`;
});

// Virtual for branch full name - Railway information
studentSchema.virtual('branchFullName').get(function() {
  const branchNames = {
    'CSE': 'Computer Science & Engineering',
    'ECE': 'Electronics & Communication Engineering',
    'MECH': 'Mechanical Engineering',
    'CIVIL': 'Civil Engineering',
    'EEE': 'Electrical & Electronics Engineering',
    'CSE(DS)': 'Computer Science & Engineering (Data Science)'
  };
  return branchNames[this.branch] || this.branch;
});

// Virtual for year name - Railway classification
studentSchema.virtual('yearName').get(function() {
  const yearNames = {
    1: 'First Year',
    2: 'Second Year', 
    3: 'Third Year',
    4: 'Fourth Year'
  };
  return yearNames[this.year] || `Year ${this.year}`;
});

// Virtual for attendance status - Railway indicators
studentSchema.virtual('attendanceStatus').get(function() {
  const percentage = this.attendanceStats.percentage;
  
  if (percentage >= 90) return { status: 'Excellent', color: 'green', icon: '🟢' };
  if (percentage >= 80) return { status: 'Good', color: 'blue', icon: '🔵' };
  if (percentage >= 70) return { status: 'Average', color: 'yellow', icon: '🟡' };
  if (percentage >= 60) return { status: 'Below Average', color: 'orange', icon: '🟠' };
  return { status: 'Poor', color: 'red', icon: '🔴' };
});

// Method to get Railway-style profile summary
studentSchema.methods.getProfileSummary = function() {
  return {
    basic: {
      rollNo: this.rollNo,
      name: this.name,
      branch: this.branch,
      branchFullName: this.branchFullName,
      year: this.year,
      yearName: this.yearName
    },
    attendance: {
      percentage: this.attendanceStats.percentage,
      totalClasses: this.attendanceStats.totalClasses,
      attendedClasses: this.attendanceStats.attendedClasses,
      status: this.attendanceStatus,
      lastUpdated: this.attendanceStats.lastUpdated
    },
    account: {
      isActive: this.isActive,
      lastLogin: this.lastLogin,
      joinedDate: this.createdAt,
      preferences: this.preferences
    }
  };
};

module.exports = mongoose.model('Student', studentSchema);
