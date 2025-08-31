# 🎓 KCEA Attendance Portal & Mobile App

A complete attendance management system for Kshatriya College of Engineering with web portal and mobile app.

## 🚀 Features

### 👨‍🎓 Student Portal
- **Registration**: Roll No, Name, Email, Phone, Branch, Year, Password
- **Login**: Roll No + Password authentication
- **Dashboard**: Profile, Attendance %, Mark Attendance, News/Events
- **Attendance Tracking**: One-click attendance marking with duplicate prevention

### 👨‍💼 Admin/Founder Dashboard
- **Student Management**: View all students with filters (Branch/Year)
- **Attendance Reports**: Daily reports with date/time stamps
- **Export Features**: CSV/PDF attendance reports
- **News Management**: Post announcements and events
- **Analytics**: Attendance statistics and insights

### 📱 Mobile App (React Native)
- **Student Login**: Simple authentication
- **One-Tap Attendance**: Quick attendance marking
- **News Feed**: Latest college announcements
- **Railway-style UI**: Clean, modern interface

## 🛠️ Tech Stack

### Backend
- **Node.js + Express.js**: RESTful API server
- **MongoDB Atlas**: Cloud database
- **JWT Authentication**: Secure token-based auth
- **bcrypt**: Password hashing
- **Mongoose**: MongoDB ODM

### Frontend (Web)
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client
- **React Router**: Client-side routing
- **Chart.js**: Attendance analytics

### Mobile App
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform
- **AsyncStorage**: Local data persistence
- **React Navigation**: Mobile navigation

### Deployment
- **Frontend**: Vercel (portal.kcea.in)
- **Backend**: Render/Railway
- **Database**: MongoDB Atlas
- **Mobile**: Expo/App Store/Play Store

## 📊 Database Schemas

### Student Schema
```javascript
{
  rollNo: String (unique),
  name: String,
  email: String (unique),
  phone: String,
  branch: String, // CSE, ECE, MECH, CIVIL, EEE, CSE(DS)
  year: Number,   // 1, 2, 3, 4
  passwordHash: String,
  createdAt: Date,
  isActive: Boolean
}
```

### Attendance Schema
```javascript
{
  studentId: ObjectId,
  rollNo: String,
  subject: String,
  date: String,     // YYYY-MM-DD
  time: String,     // HH:MM:SS
  status: String,   // "Present", "Absent"
  location: String, // Optional geolocation
  createdAt: Date
}
```

### News Schema
```javascript
{
  title: String,
  content: String,
  author: String,
  date: Date,
  priority: String, // "high", "medium", "low"
  isActive: Boolean
}
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Student/Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile

### Student APIs
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/student/:rollNo` - Get student attendance
- `GET /api/news` - Get latest news/events

### Admin APIs
- `GET /api/admin/students` - Get all students (with filters)
- `GET /api/admin/attendance-report` - Get attendance reports
- `POST /api/admin/news` - Post news/events
- `GET /api/admin/analytics` - Get attendance analytics
- `GET /api/admin/export/csv` - Export attendance as CSV
- `GET /api/admin/export/pdf` - Export attendance as PDF

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/kcea/attendance-portal
cd kcea-portal

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install mobile app dependencies
cd ../mobile
npm install
```

### Environment Setup

#### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kcea
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
ADMIN_EMAIL=admin@kcea.edu
ADMIN_PASSWORD=admin123
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_COLLEGE_NAME=Kshatriya College of Engineering
```

### Development

```bash
# Start backend server
cd backend
npm run dev

# Start frontend (new terminal)
cd frontend
npm start

# Start mobile app (new terminal)
cd mobile
npx expo start
```

## 📱 Mobile App Features

### Student App
- **Quick Login**: Roll number + password
- **Dashboard**: Attendance percentage, profile info
- **One-Tap Attendance**: Large, prominent button
- **News Feed**: Scrollable list of announcements
- **Offline Support**: Cache data for offline viewing

### UI Design (Railway-style)
- **Clean Interface**: Minimal, focused design
- **Bold Typography**: Clear, readable fonts
- **Color Scheme**: KCEA blue (#1e40af) primary
- **Card-based Layout**: Modern card components
- **Smooth Animations**: Subtle transitions

## 🎨 Design System

### Colors
- **Primary**: #1e40af (KCEA Blue)
- **Secondary**: #dc2626 (KCEA Red)
- **Success**: #059669 (Green)
- **Warning**: #f59e0b (Amber)
- **Gray**: #6b7280 (Neutral)

### Typography
- **Headings**: Inter Bold
- **Body**: Inter Regular
- **Accent**: Playfair Display (Logo)

### Components
- **Buttons**: Rounded, shadow, hover effects
- **Cards**: White background, subtle shadow
- **Forms**: Clean inputs with validation
- **Navigation**: Sticky header, mobile-friendly

## 📊 Attendance Logic

### Marking Attendance
1. Student clicks "Mark Attendance"
2. System checks for duplicate (same day + subject)
3. If no duplicate, record attendance with timestamp
4. Update student's attendance percentage
5. Show success/error message

### Duplicate Prevention
```javascript
// Check if attendance already marked today
const existingAttendance = await Attendance.findOne({
  studentId: student._id,
  date: today,
  subject: currentSubject
});

if (existingAttendance) {
  return res.status(400).json({ 
    message: "Attendance already marked for today" 
  });
}
```

### Attendance Calculation
```javascript
const totalDays = await Attendance.countDocuments({ studentId });
const presentDays = await Attendance.countDocuments({ 
  studentId, 
  status: "Present" 
});
const percentage = (presentDays / totalDays) * 100;
```

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication
- **Input Validation**: Joi/Yup validation
- **Rate Limiting**: Prevent brute force attacks
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers

## 📈 Analytics & Reports

### Student Analytics
- Daily attendance trends
- Subject-wise attendance
- Monthly/weekly summaries
- Attendance goals and achievements

### Admin Analytics
- Overall attendance statistics
- Branch-wise performance
- Daily attendance reports
- Student engagement metrics

## 🚀 Deployment Guide

### Backend (Render/Railway)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Frontend (Vercel)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Configure custom domain: portal.kcea.in

### Database (MongoDB Atlas)
1. Create cluster
2. Configure network access
3. Create database user
4. Get connection string

### Mobile App
1. Build with Expo
2. Submit to App Store/Play Store
3. Configure deep linking
4. Set up push notifications

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏫 About KCEA

Kshatriya College of Engineering (KCEA) was established in 2001 under the aegis of Pandit Deendayal Upadyay Educational Society. Located on a sprawling 40 acres campus on NH-16 highway, 30 km from Nizamabad district, affiliated to JNTUH.

---

Built with ❤️ for KCEA by the development team.
