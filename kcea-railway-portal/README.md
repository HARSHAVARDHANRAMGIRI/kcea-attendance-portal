# 🚂 KCEA Railway Portal - Smart Attendance System

A modern, Railway/IRCTC-style attendance management system for **Kshatriya College of Engineering (KCEA)**.

## 🎨 Design Features

- **Railway-Style UI**: Clean, mobile-first design inspired by IRCTC
- **Primary Colors**: Blue (#188CFF) and Teal (#00BFA6)
- **Mobile-First**: Optimized for smartphones and tablets
- **Touch-Friendly**: Large buttons and easy navigation

## 🚀 Features

### 👨‍🎓 Student Portal
- **Registration**: Roll No, Name, Email, Phone, Branch, Year, Password
- **Login**: Simple Roll No + Password authentication
- **Dashboard**: Profile, attendance %, one-tap attendance marking
- **News Feed**: Latest college announcements

### 👨‍💼 Admin Portal
- **Student Management**: View all students with filters
- **Attendance Reports**: Daily, weekly, monthly reports
- **News Management**: Post announcements and events
- **Analytics**: Attendance statistics and insights

### 📱 Mobile Features
- **One-Tap Attendance**: Large, prominent button
- **Bottom Navigation**: Easy thumb navigation
- **Offline Support**: Cache data for offline viewing
- **Push Notifications**: Attendance reminders

## 🛠️ Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Mobile**: React Native + Expo
- **Deployment**: Vercel + Railway + MongoDB Atlas

## 🏫 About KCEA

**Kshatriya College of Engineering** was established in 2001 under Pandit Deendayal Upadyay Educational Society.

- **Location**: NH-16, 30km from Nizamabad
- **Campus**: 40 acres
- **Affiliation**: JNTUH (Jawaharlal Nehru Technology University Hyderabad)
- **Certification**: ISO 9001:2008
- **Placements**: 1500+ students placed in 150+ companies

### Departments
- Computer Science & Engineering (CSE)
- Computer Science & Data Science (CSE-DS)
- Electronics & Communication Engineering (ECE)
- Mechanical Engineering (MECH)
- Civil Engineering (CIVIL)
- Electrical & Electronics Engineering (EEE)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/HARSHAVARDHANRAMGIR/kcea-railway-portal
cd kcea-railway-portal

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start development servers
npm run dev
```

### Environment Setup

Create `.env` files:

**Backend (.env)**
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_COLLEGE_NAME=Kshatriya College of Engineering
```

## 📊 Database Schemas

### Student Schema
```javascript
{
  rollNo: String (unique),
  name: String,
  email: String (unique),
  phone: String,
  branch: String (CSE, ECE, MECH, CIVIL, EEE, CSE-DS),
  year: Number (1-4),
  passwordHash: String,
  attendanceStats: {
    totalClasses: Number,
    attendedClasses: Number,
    percentage: Number
  }
}
```

### Attendance Schema
```javascript
{
  studentId: ObjectId,
  rollNo: String,
  subject: String,
  date: String (YYYY-MM-DD),
  time: String (HH:MM:SS),
  status: String (Present, Absent, Late)
}
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Student/Admin login
- `POST /api/auth/logout` - Logout

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/student/:rollNo` - Get student attendance
- `GET /api/attendance/report` - Get attendance reports

### Admin
- `GET /api/admin/students` - Get all students
- `GET /api/admin/analytics` - Get system analytics
- `POST /api/admin/news` - Post news/events

## 🎨 Railway-Style Components

### CSS Classes
```css
.railway-card { /* White cards with rounded corners */ }
.railway-btn { /* Blue gradient buttons */ }
.railway-btn-secondary { /* Teal accent buttons */ }
.attendance-btn { /* Large attendance marking button */ }
.mobile-nav { /* Bottom navigation for mobile */ }
```

### Color Palette
- **Primary Blue**: #188CFF
- **Accent Teal**: #00BFA6
- **Background**: #F8FAFC
- **Text**: #1F2937
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444

## 📱 Mobile App

Built with React Native + Expo:

```bash
cd mobile
npm install
npx expo start
```

Features:
- Cross-platform (iOS + Android)
- One-tap attendance marking
- Offline support
- Push notifications
- Railway-style UI components

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

### Backend (Railway)
```bash
cd backend
git push railway main
```

### Database (MongoDB Atlas)
1. Create cluster
2. Configure network access
3. Create database user
4. Get connection string

## 📈 Features Roadmap

- [ ] Biometric authentication
- [ ] QR code attendance
- [ ] Geofencing
- [ ] Parent notifications
- [ ] Timetable integration
- [ ] Exam attendance
- [ ] Faculty dashboard
- [ ] Bulk operations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Harshavardhan Ramgir**
- GitHub: [@HARSHAVARDHANRAMGIR](https://github.com/HARSHAVARDHANRAMGIR)
- Email: harshavardhan@example.com

---

Built with ❤️ for KCEA using Railway-inspired design principles.

**🚂 "Connecting Students to Success - The Railway Way"**
