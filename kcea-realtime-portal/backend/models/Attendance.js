/**
 * Attendance Model - MongoDB Schema
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // Student Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    uppercase: true,
    index: true
  },
  
  studentName: {
    type: String,
    required: [true, 'Student name is required']
  },
  
  // Academic Information
  class: {
    type: String,
    required: [true, 'Class is required'],
    index: true
  },
  
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8
  },
  
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    enum: ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'CSE(DS)', 'IT', 'AERO', 'CHEM', 'BIOTECH']
  },
  
  // Attendance Details
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  
  period: {
    type: Number,
    required: [true, 'Period is required'],
    min: [1, 'Period must be between 1 and 8'],
    max: [8, 'Period must be between 1 and 8'],
    index: true
  },
  
  subject: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  
  status: {
    type: String,
    required: [true, 'Attendance status is required'],
    enum: {
      values: ['Present', 'Absent', 'Late'],
      message: 'Status must be Present, Absent, or Late'
    },
    default: 'Present'
  },
  
  // Timing Information
  markedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Marked by user ID is required']
  },
  
  markedByRole: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    required: [true, 'Marked by role is required']
  },
  
  // Additional Information
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    platform: String
  },
  
  // Modification History
  isModified: {
    type: Boolean,
    default: false
  },
  
  modificationHistory: [{
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    previousStatus: String,
    newStatus: String,
    reason: String
  }],
  
  // Notes
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ================================
// INDEXES
// ================================

// Compound indexes for efficient queries
attendanceSchema.index({ userId: 1, date: -1 });
attendanceSchema.index({ rollNumber: 1, date: -1 });
attendanceSchema.index({ date: -1, period: 1 });
attendanceSchema.index({ class: 1, semester: 1, date: -1 });
attendanceSchema.index({ subject: 1, date: -1 });
attendanceSchema.index({ markedBy: 1, markedAt: -1 });

// Unique constraint to prevent duplicate attendance for same student, date, and period
attendanceSchema.index({ userId: 1, date: 1, period: 1 }, { unique: true });

// ================================
// VIRTUAL FIELDS
// ================================

// Format date for display
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Format time for display
attendanceSchema.virtual('formattedTime').get(function() {
  return this.markedAt.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
});

// Period display name
attendanceSchema.virtual('periodDisplay').get(function() {
  const periodNames = {
    1: '1st Period (9:00-10:00)',
    2: '2nd Period (10:00-11:00)',
    3: '3rd Period (11:15-12:15)',
    4: '4th Period (12:15-1:15)',
    5: '5th Period (2:00-3:00)',
    6: '6th Period (3:00-4:00)',
    7: '7th Period (4:00-5:00)',
    8: '8th Period (5:00-6:00)'
  };
  return periodNames[this.period] || `Period ${this.period}`;
});

// Status color for UI
attendanceSchema.virtual('statusColor').get(function() {
  const colors = {
    'Present': 'green',
    'Absent': 'red',
    'Late': 'yellow'
  };
  return colors[this.status] || 'gray';
});

// ================================
// MIDDLEWARE
// ================================

// Pre-save middleware to populate student information
attendanceSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('userId')) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.userId).select('fullName rollNumber class semester branch');
      
      if (user) {
        this.rollNumber = user.rollNumber;
        this.studentName = user.fullName;
        this.class = user.class;
        this.semester = user.semester;
        this.branch = user.branch;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Post-save middleware to update user attendance summary
attendanceSchema.post('save', async function(doc) {
  try {
    const User = mongoose.model('User');
    const Attendance = mongoose.model('Attendance');
    
    // Calculate attendance summary for this user
    const stats = await Attendance.aggregate([
      { $match: { userId: doc.userId } },
      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          attendedClasses: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Present'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    if (stats.length > 0) {
      const { totalClasses, attendedClasses } = stats[0];
      await User.findByIdAndUpdate(doc.userId, {
        'attendanceSummary.totalClasses': totalClasses,
        'attendanceSummary.attendedClasses': attendedClasses,
        'attendanceSummary.attendancePercentage': totalClasses > 0 ? 
          Math.round((attendedClasses / totalClasses) * 100 * 100) / 100 : 0,
        'attendanceSummary.lastUpdated': new Date()
      });
    }
  } catch (error) {
    console.error('Error updating attendance summary:', error);
  }
});

// ================================
// INSTANCE METHODS
// ================================

// Mark as modified
attendanceSchema.methods.markAsModified = function(modifiedBy, previousStatus, newStatus, reason) {
  this.isModified = true;
  this.modificationHistory.push({
    modifiedBy,
    modifiedAt: new Date(),
    previousStatus,
    newStatus,
    reason
  });
  this.status = newStatus;
};

// Check if attendance can be modified
attendanceSchema.methods.canBeModified = function() {
  const now = new Date();
  const attendanceDate = new Date(this.date);
  const daysDifference = Math.floor((now - attendanceDate) / (1000 * 60 * 60 * 24));
  
  // Allow modification within 7 days
  return daysDifference <= 7;
};

// ================================
// STATIC METHODS
// ================================

// Get attendance by date range
attendanceSchema.statics.getByDateRange = function(startDate, endDate, filters = {}) {
  const query = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    ...filters
  };
  
  return this.find(query)
    .populate('userId', 'fullName rollNumber class semester branch')
    .populate('markedBy', 'fullName role')
    .sort({ date: -1, period: 1 });
};

// Get attendance by student
attendanceSchema.statics.getByStudent = function(userId, startDate, endDate) {
  const query = { userId };
  
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.find(query)
    .sort({ date: -1, period: 1 });
};

// Get attendance statistics
attendanceSchema.statics.getStatistics = function(filters = {}) {
  return this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
        },
        lateCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        totalRecords: 1,
        presentCount: 1,
        absentCount: 1,
        lateCount: 1,
        attendancePercentage: {
          $round: [
            { $multiply: [{ $divide: ['$presentCount', '$totalRecords'] }, 100] },
            2
          ]
        }
      }
    }
  ]);
};

// Get subject-wise attendance
attendanceSchema.statics.getSubjectWiseAttendance = function(userId, filters = {}) {
  return this.aggregate([
    { $match: { userId, ...filters } },
    {
      $group: {
        _id: '$subject',
        totalClasses: { $sum: 1 },
        attendedClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
        },
        lateClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        subject: '$_id',
        totalClasses: 1,
        attendedClasses: 1,
        lateClasses: 1,
        attendancePercentage: {
          $round: [
            { $multiply: [{ $divide: ['$attendedClasses', '$totalClasses'] }, 100] },
            2
          ]
        }
      }
    },
    { $sort: { subject: 1 } }
  ]);
};

// Get daily attendance summary
attendanceSchema.statics.getDailyAttendanceSummary = function(date, filters = {}) {
  return this.aggregate([
    { 
      $match: { 
        date: new Date(date),
        ...filters 
      } 
    },
    {
      $group: {
        _id: { period: '$period', subject: '$subject' },
        totalStudents: { $sum: 1 },
        presentStudents: {
          $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
        },
        absentStudents: {
          $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
        },
        lateStudents: {
          $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        period: '$_id.period',
        subject: '$_id.subject',
        totalStudents: 1,
        presentStudents: 1,
        absentStudents: 1,
        lateStudents: 1,
        attendancePercentage: {
          $round: [
            { $multiply: [{ $divide: ['$presentStudents', '$totalStudents'] }, 100] },
            2
          ]
        }
      }
    },
    { $sort: { period: 1 } }
  ]);
};

// Bulk insert attendance records
attendanceSchema.statics.bulkInsertAttendance = async function(attendanceRecords) {
  try {
    const result = await this.insertMany(attendanceRecords, { ordered: false });
    return {
      success: true,
      inserted: result.length,
      records: result
    };
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const duplicates = error.writeErrors ? error.writeErrors.length : 0;
      const inserted = attendanceRecords.length - duplicates;
      
      return {
        success: true,
        inserted,
        duplicates,
        message: `${inserted} records inserted, ${duplicates} duplicates skipped`
      };
    }
    throw error;
  }
};

module.exports = mongoose.model('Attendance', attendanceSchema);
