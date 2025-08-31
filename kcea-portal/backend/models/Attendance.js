const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    uppercase: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    enum: {
      values: [
        'Mathematics-I', 'Mathematics-II', 'Mathematics-III',
        'Physics', 'Chemistry', 'English',
        'Programming in C', 'Data Structures', 'Algorithms',
        'Database Management Systems', 'Computer Networks',
        'Operating Systems', 'Software Engineering',
        'Web Technologies', 'Mobile Computing',
        'Machine Learning', 'Artificial Intelligence',
        'Digital Electronics', 'Microprocessors',
        'Signal Processing', 'Communication Systems',
        'Thermodynamics', 'Fluid Mechanics',
        'Manufacturing Technology', 'CAD/CAM',
        'Structural Analysis', 'Concrete Technology',
        'Surveying', 'Environmental Engineering',
        'Electrical Machines', 'Power Systems',
        'Control Systems', 'Power Electronics'
      ],
      message: 'Invalid subject'
    }
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    match: [/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:MM:SS format']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['Present', 'Absent', 'Late'],
      message: 'Status must be Present, Absent, or Late'
    },
    default: 'Present'
  },
  location: {
    type: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    default: null
  },
  deviceInfo: {
    type: {
      userAgent: String,
      platform: String,
      ip: String
    },
    default: null
  },
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters'],
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
attendanceSchema.index({ studentId: 1, date: 1, subject: 1 }, { unique: true });
attendanceSchema.index({ rollNo: 1, date: -1 });
attendanceSchema.index({ date: -1, subject: 1 });
attendanceSchema.index({ createdAt: -1 });

// Static method to get attendance statistics for a student
attendanceSchema.statics.getStudentStats = async function(studentId) {
  const stats = await this.aggregate([
    { $match: { studentId: mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: null,
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
        },
        absentClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
        },
        lateClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalClasses: 1,
        presentClasses: 1,
        absentClasses: 1,
        lateClasses: 1,
        attendancePercentage: {
          $cond: [
            { $eq: ['$totalClasses', 0] },
            0,
            { $multiply: [{ $divide: ['$presentClasses', '$totalClasses'] }, 100] }
          ]
        }
      }
    }
  ]);

  return stats[0] || {
    totalClasses: 0,
    presentClasses: 0,
    absentClasses: 0,
    lateClasses: 0,
    attendancePercentage: 0
  };
};

// Static method to get subject-wise attendance for a student
attendanceSchema.statics.getSubjectWiseStats = async function(studentId) {
  return this.aggregate([
    { $match: { studentId: mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: '$subject',
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        subject: '$_id',
        totalClasses: 1,
        presentClasses: 1,
        attendancePercentage: {
          $cond: [
            { $eq: ['$totalClasses', 0] },
            0,
            { $multiply: [{ $divide: ['$presentClasses', '$totalClasses'] }, 100] }
          ]
        }
      }
    },
    { $sort: { subject: 1 } }
  ]);
};

// Static method to get daily attendance report
attendanceSchema.statics.getDailyReport = async function(date) {
  return this.aggregate([
    { $match: { date: date } },
    {
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    {
      $group: {
        _id: {
          subject: '$subject',
          status: '$status'
        },
        count: { $sum: 1 },
        students: {
          $push: {
            rollNo: '$rollNo',
            name: '$student.name',
            branch: '$student.branch',
            year: '$student.year',
            time: '$time'
          }
        }
      }
    },
    {
      $group: {
        _id: '$_id.subject',
        statusCounts: {
          $push: {
            status: '$_id.status',
            count: '$count',
            students: '$students'
          }
        },
        totalStudents: { $sum: '$count' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get attendance trends (last 30 days)
attendanceSchema.statics.getAttendanceTrends = async function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  return this.aggregate([
    { $match: { date: { $gte: thirtyDaysAgoStr } } },
    {
      $group: {
        _id: '$date',
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        date: '$_id',
        totalClasses: 1,
        presentClasses: 1,
        attendancePercentage: {
          $cond: [
            { $eq: ['$totalClasses', 0] },
            0,
            { $multiply: [{ $divide: ['$presentClasses', '$totalClasses'] }, 100] }
          ]
        }
      }
    },
    { $sort: { date: 1 } }
  ]);
};

// Method to check if attendance already exists for today
attendanceSchema.statics.checkDuplicateAttendance = async function(studentId, subject, date) {
  return this.findOne({
    studentId: studentId,
    subject: subject,
    date: date
  });
};

module.exports = mongoose.model('Attendance', attendanceSchema);
