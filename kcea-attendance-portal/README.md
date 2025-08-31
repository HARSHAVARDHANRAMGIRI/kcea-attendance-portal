# 🚂 KCEA Attendance Portal - Railway Style

A modern, mobile-first attendance management system for Kshatriya College of Engineering with Railway/IRCTC-inspired design.

## 🎨 Design Theme

### Railway/IRCTC Style Features
- **Clean, Mobile-First Design**: Optimized for mobile devices
- **Blue-White Theme**: Professional railway-inspired colors
- **Card-Based Layout**: Rounded corners, soft shadows
- **Responsive Grid**: Adapts to all screen sizes
- **Touch-Friendly**: Large buttons, easy navigation

### Color Palette
- **Primary Blue**: #188CFF (buttons, headings, links)
- **Accent Teal**: #00BFA6 (highlights, success states)
- **Background**: #F8FAFC (light gray)
- **Cards**: White with subtle shadows
- **Text**: #1F2937 (dark gray)

## 🚀 Features

### 👨‍🎓 Student Portal
- **Registration**: Roll No, Name, Email, Phone, Branch, Year, Password
- **Login**: Simple Roll No + Password authentication
- **Dashboard**: Profile, attendance %, one-tap attendance marking
- **News Feed**: Latest college announcements and events
- **Attendance History**: View past attendance records

### 👨‍💼 Admin/Founder Portal
- **Secure Admin Login**: Founder credentials
- **Analytics Dashboard**: Total students, attendance stats
- **Student Management**: View all students with filters
- **Attendance Reports**: Date-wise, branch-wise reports
- **Export Features**: CSV/PDF download
- **News Management**: Post announcements and events

### 📱 Mobile App (React Native)
- **Cross-Platform**: iOS and Android support
- **Native Performance**: Smooth animations and interactions
- **Offline Support**: Cache data for offline viewing
- **Push Notifications**: Attendance reminders and news alerts

## 🛠️ Tech Stack

### Frontend (Web)
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first styling
- **Headless UI**: Accessible components
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **React Query**: Data fetching and caching

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **Multer**: File uploads

### Mobile App
- **React Native**: Cross-platform development
- **Expo**: Development platform
- **React Navigation**: Mobile navigation
- **AsyncStorage**: Local storage
- **Expo Notifications**: Push notifications

### Deployment
- **Frontend**: Vercel (portal.kcea.in)
- **Backend**: Render/Railway
- **Database**: MongoDB Atlas
- **Mobile**: Expo/App Store/Play Store

## 📊 Database Schemas

### Student Schema
```javascript
{
  rollNo: String (unique, required),
  name: String (required),
  email: String (unique, required),
  phone: String (required),
  branch: String (enum: CSE, ECE, MECH, CIVIL, EEE, CSE(DS)),
  year: Number (1-4),
  passwordHash: String (required),
  profileImage: String,
  isActive: Boolean (default: true),
  attendancePercentage: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### Attendance Schema
```javascript
{
  studentId: ObjectId (ref: Student),
  rollNo: String (required),
  subject: String (required),
  date: String (YYYY-MM-DD),
  time: String (HH:MM:SS),
  status: String (enum: Present, Absent, Late),
  location: Object (optional),
  createdAt: Date
}
```

### News Schema
```javascript
{
  title: String (required),
  content: String (required),
  author: String (required),
  priority: String (enum: high, medium, low),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
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
- `GET /api/attendance/history/:studentId` - Get attendance history
- `PUT /api/student/profile` - Update profile

### Admin APIs
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/students` - Get all students (with filters)
- `GET /api/admin/attendance-report` - Get attendance reports
- `POST /api/admin/news` - Post news/events
- `GET /api/admin/export/csv` - Export attendance as CSV
- `GET /api/admin/export/pdf` - Export attendance as PDF

### News APIs
- `GET /api/news` - Get latest news/events
- `GET /api/news/:id` - Get specific news item

## 🎨 UI Components

### Core Components
- **Navbar**: KCEA logo, navigation links, user menu
- **Hero Section**: Campus image, welcome message
- **AttendanceButton**: Large, prominent attendance marking
- **StudentCard**: Profile information display
- **AdminDashboard**: Statistics and management interface
- **NewsCard**: Announcement and event display

### Railway-Style Elements
- **BlueButton**: Primary action buttons
- **TealAccent**: Highlight elements
- **WhiteCard**: Content containers
- **MobileGrid**: Responsive layout system
- **TouchTarget**: Large, accessible buttons

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/kcea/attendance-portal
cd kcea-attendance-portal

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
ADMIN_EMAIL=founder@kcea.edu
ADMIN_PASSWORD=kcea2024
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_COLLEGE_NAME=Kshatriya College of Engineering
REACT_APP_LOGO_URL=/assets/kcea-logo.png
REACT_APP_CAMPUS_IMAGE=/assets/kcea-campus.jpg
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

### Railway-Style Mobile UI
- **Bottom Navigation**: Easy thumb navigation
- **Large Touch Targets**: Finger-friendly buttons
- **Swipe Gestures**: Natural mobile interactions
- **Pull-to-Refresh**: Update data with pull gesture
- **Offline Mode**: Work without internet connection

### Student Mobile Features
- **Quick Login**: Biometric authentication support
- **One-Tap Attendance**: Large, prominent button
- **Dashboard**: Clean, card-based layout
- **News Feed**: Scrollable announcements
- **Profile Management**: Edit personal information

## 🎨 Tailwind Configuration

### Custom Theme
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'kcea-blue': '#188CFF',
        'kcea-teal': '#00BFA6',
        'kcea-gray': '#F8FAFC',
        'kcea-dark': '#1F2937'
      },
      fontFamily: {
        'railway': ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'railway': '12px'
      },
      boxShadow: {
        'railway': '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }
    }
  }
}
```

## 🚀 Deployment Guide

### Frontend (Vercel)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set environment variables
4. Deploy to portal.kcea.in

### Backend (Render/Railway)
1. Connect GitHub repository
2. Set start command: `npm start`
3. Configure environment variables
4. Auto-deploy on push

### Database (MongoDB Atlas)
1. Create cluster
2. Configure network access
3. Create database user
4. Get connection string

### Mobile App (Expo)
1. Build with `expo build`
2. Submit to App Store/Play Store
3. Configure push notifications
4. Set up deep linking

## 📊 Analytics & Reports

### Student Analytics
- Daily attendance trends
- Subject-wise performance
- Monthly summaries
- Achievement badges

### Admin Analytics
- Overall attendance statistics
- Branch-wise comparisons
- Daily/weekly/monthly reports
- Export capabilities

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Tokens**: Secure authentication
- **Input Validation**: Comprehensive validation
- **Rate Limiting**: Prevent abuse
- **CORS**: Cross-origin protection
- **Helmet**: Security headers

## 🏫 About KCEA

Kshatriya College of Engineering (KCEA) was established in 2001 under the aegis of Pandit Deendayal Upadyay Educational Society. Located on a sprawling 40 acres campus on NH-16 highway, 30 km from Nizamabad district, affiliated to JNTUH.

### Campus Highlights
- 40 acres sprawling campus
- Digital classrooms and labs
- 1500+ students placed
- 150+ companies visited
- Modern infrastructure
- Hostel facilities

---

Built with ❤️ for KCEA using Railway-inspired design principles.
