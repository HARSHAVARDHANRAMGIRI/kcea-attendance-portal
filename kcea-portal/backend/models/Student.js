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
  attendancePercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalClasses: {
    type: Number,
    default: 0
  },
  attendedClasses: {
    type: Number,
    default: 0
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

// Indexes for better query performance
studentSchema.index({ rollNo: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ branch: 1, year: 1 });
studentSchema.index({ createdAt: -1 });

// Hash password before saving
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

// Method to compare password
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update attendance percentage
studentSchema.methods.updateAttendancePercentage = function() {
  if (this.totalClasses === 0) {
    this.attendancePercentage = 0;
  } else {
    this.attendancePercentage = Math.round((this.attendedClasses / this.totalClasses) * 100);
  }
  return this.save();
};

// Static method to get branch statistics
studentSchema.statics.getBranchStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$branch',
        count: { $sum: 1 },
        avgAttendance: { $avg: '$attendancePercentage' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Static method to get year-wise statistics
studentSchema.statics.getYearStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$year',
        count: { $sum: 1 },
        avgAttendance: { $avg: '$attendancePercentage' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Virtual for full name with roll number
studentSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.rollNo})`;
});

// Virtual for branch full name
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

// Virtual for year name
studentSchema.virtual('yearName').get(function() {
  const yearNames = {
    1: 'First Year',
    2: 'Second Year',
    3: 'Third Year',
    4: 'Fourth Year'
  };
  return yearNames[this.year] || `Year ${this.year}`;
});

module.exports = mongoose.model('Student', studentSchema);
