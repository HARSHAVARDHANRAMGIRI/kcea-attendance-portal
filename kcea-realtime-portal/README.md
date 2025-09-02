# 🎓 KCEA Real-time Attendance Portal

**A production-ready, real-time attendance management system built with modern web technologies**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7+-black.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 **Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY**

**Contact:** 📧 [r.harsha0541@gmail.com](mailto:r.harsha0541@gmail.com)

This Smart Attendance Portal was designed and developed by **Harshavardhan Ramgiri** (Founder, AUTOFLOW AGENCY), CSE student at Kshatriya College of Engineering. Passionate about full-stack development, real-time systems, and building innovative educational solutions.

---

## 🚀 **Live Demo**

- **Frontend**: [https://kcea-portal.vercel.app](https://kcea-portal.vercel.app)
- **Backend API**: [https://kcea-api.railway.app](https://kcea-api.railway.app)

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Student | student@kcea.edu | demo123 |
| Faculty | faculty@kcea.edu | demo123 |
| Admin | admin@kcea.edu | demo123 |

---

## ✨ **Features**

### 🔐 **Authentication & Security**
- **Email OTP Verification** using Gmail SMTP (free)
- JWT-based authentication with refresh tokens
- Role-based access control (Student, Faculty, Admin)
- Rate limiting and brute-force protection
- Enterprise-grade security headers

### 📊 **Real-time Attendance System**
- **Period-wise attendance** (8 periods per day)
- **Manual subject entry** by students
- **Live WebSocket updates** across all dashboards
- Bulk attendance marking for faculty
- Attendance modification with audit trail

### 👥 **Role-based Dashboards**
- **Student Dashboard**: Personal attendance tracking, statistics
- **Faculty Dashboard**: Bulk attendance management, class overview
- **Admin Dashboard**: Complete system control, user management

### 📱 **Mobile-First Design**
- Responsive design optimized for smartphones
- Touch-friendly interface
- Progressive Web App (PWA) capabilities
- Offline functionality for basic features

### 📈 **Advanced Analytics**
- Subject-wise attendance statistics
- Weekly/monthly attendance charts
- Export reports (CSV/Excel)
- Real-time attendance insights

### 🔔 **Smart Notifications**
- Real-time push notifications
- Email notifications for important events
- Browser notifications
- Firebase Cloud Messaging integration

---

## 🏗️ **Architecture**

### **Backend Stack**
- **Node.js** + **Express.js** - RESTful API server
- **MongoDB Atlas** - Cloud database (free tier)
- **Socket.IO** - Real-time communication
- **Nodemailer** - Email service (Gmail SMTP)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### **Frontend Stack**
- **React 18** - Modern UI library
- **Tailwind CSS** - Utility-first styling
- **Socket.IO Client** - Real-time updates
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications

### **Deployment**
- **Backend**: Railway (free tier)
- **Frontend**: Vercel/Netlify (free tier)
- **Database**: MongoDB Atlas (free tier)
- **Email**: Gmail SMTP (free)
- **CDN**: Cloudinary (optional, for images)

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- MongoDB Atlas account (free)
- Gmail account with App Password

### **1. Clone Repository**
```bash
git clone https://github.com/HARSHAVARDHANRAMGIRI/kcea-realtime-attendance-portal.git
cd kcea-realtime-attendance-portal
```

### **2. Install Dependencies**
```bash
npm run install-all
```

### **3. Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### **4. Required Environment Variables**
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kcea-attendance

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email (Gmail SMTP)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# College Info
COLLEGE_NAME=Kshatriya College of Engineering
COLLEGE_CODE=KCEA
COLLEGE_ESTABLISHED=2001
COLLEGE_LOCATION=NH-16, 30km from Nizamabad
COLLEGE_AFFILIATION=JNTUH
```

### **5. Start Development**
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run server  # Backend only
npm run client  # Frontend only
```

### **6. Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health

---

## 📦 **Production Deployment**

### **Railway (Backend)**
1. Create Railway account
2. Connect GitHub repository
3. Set environment variables
4. Deploy automatically

### **Vercel (Frontend)**
1. Create Vercel account
2. Import GitHub repository
3. Set build settings:
   - Build Command: `npm run build`
   - Output Directory: `build`
4. Deploy automatically

### **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up -d

# For production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🔧 **API Documentation**

### **Authentication Endpoints**
```
POST /api/auth/register     - User registration
POST /api/auth/login        - Send login OTP
POST /api/auth/verify-otp   - Verify OTP & login
POST /api/auth/resend-otp   - Resend OTP
POST /api/auth/logout       - Logout user
GET  /api/auth/me          - Get current user
```

### **Attendance Endpoints**
```
POST /api/attendance/mark           - Mark attendance
POST /api/attendance/bulk           - Bulk attendance (Faculty/Admin)
GET  /api/attendance/my             - Get user's attendance
GET  /api/attendance/student/:id    - Get student attendance (Faculty/Admin)
PUT  /api/attendance/:id            - Update attendance (Faculty/Admin)
DELETE /api/attendance/:id          - Delete attendance (Admin)
```

### **Dashboard Endpoints**
```
GET /api/dashboard/student    - Student dashboard data
GET /api/dashboard/faculty    - Faculty dashboard data
GET /api/dashboard/admin      - Admin dashboard data
```

---

## 🧪 **Testing**

### **Backend Tests**
```bash
cd backend
npm test
```

### **Frontend Tests**
```bash
cd frontend
npm test
```

### **E2E Tests**
```bash
npm run test:e2e
```

---

## 📊 **Database Schema**

### **Users Collection**
```javascript
{
  fullName: String,
  rollNumber: String (unique),
  email: String (unique),
  phoneNumber: String,
  class: String,
  semester: Number,
  branch: String,
  password: String (hashed),
  role: String (student/faculty/admin),
  isEmailVerified: Boolean,
  attendanceSummary: {
    totalClasses: Number,
    attendedClasses: Number,
    attendancePercentage: Number
  }
}
```

### **Attendance Collection**
```javascript
{
  userId: ObjectId,
  rollNumber: String,
  studentName: String,
  date: Date,
  period: Number (1-8),
  subject: String,
  status: String (Present/Absent/Late),
  markedBy: ObjectId,
  markedByRole: String,
  markedAt: Date,
  isModified: Boolean,
  modificationHistory: Array
}
```

---

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Kshatriya College of Engineering** - For the inspiration and support
- **JNTUH** - For the educational framework
- **Open Source Community** - For the amazing tools and libraries
- **Students and Faculty** - For feedback and testing

---

## 📞 **Support & Contact**

### **Developer**
- **Name**: Harshavardhan Ramgiri
- **Company**: AUTOFLOW AGENCY
- **Email**: [r.harsha0541@gmail.com](mailto:r.harsha0541@gmail.com)
- **GitHub**: [@HARSHAVARDHANRAMGIRI](https://github.com/HARSHAVARDHANRAMGIRI)

### **College**
- **Name**: Kshatriya College of Engineering
- **Location**: NH-16, 30km from Nizamabad, Telangana
- **Established**: 2001
- **Affiliation**: JNTUH
- **Certification**: ISO 9001:2008

---

## 🎯 **Roadmap**

### **Version 2.1** (Coming Soon)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Automated attendance using face recognition
- [ ] Integration with college ERP systems
- [ ] Multi-language support

### **Version 2.2** (Future)
- [ ] AI-powered attendance insights
- [ ] Blockchain-based attendance verification
- [ ] IoT integration for automatic attendance
- [ ] Advanced reporting and analytics

---

**© 2024 AUTOFLOW AGENCY. All rights reserved.**

*Built with ❤️ by Harshavardhan Ramgiri for educational institutions worldwide.*
