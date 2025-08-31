# KCEA Attendance Portal

A modern attendance management system for **Kshatriya College of Engineering (KCEA)**.

## 🎓 About KCEA

**Kshatriya College of Engineering** was established in 2001 under Pandit Deendayal Upadyay Educational Society.

- **Location**: NH-16, 30km from Nizamabad
- **Campus**: 40 acres
- **Affiliation**: JNTUH (Jawaharlal Nehru Technology University Hyderabad)
- **Certification**: ISO 9001:2008
- **Placements**: 1500+ students placed in 150+ companies

### Departments
- Computer Science & Engineering (CSE)
- Computer Science & Data Science (CSE-DS) - **New Department with 60 seats**
- Electronics & Communication Engineering (ECE)
- Mechanical Engineering (MECH)
- Civil Engineering (CIVIL)
- Electrical & Electronics Engineering (EEE)

## 🚀 Features

### Student Portal
- **Registration**: Roll No, Name, Email, Phone, Branch, Year, Password
- **Login**: Simple Roll No + Password authentication
- **Dashboard**: Profile, attendance percentage, one-tap attendance marking
- **Attendance Tracking**: Subject-wise attendance with progress visualization
- **News Feed**: Latest college announcements and events

### Mobile-Friendly
- **Responsive Design**: Works on all screen sizes
- **Touch-Friendly**: Large buttons and easy navigation
- **Fast Loading**: Optimized for mobile networks

## 🛠️ Tech Stack

- **Backend**: Python Flask
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Authentication**: Session-based with password hashing

## 🚀 Quick Start

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/HARSHAVARDHANRAMGIR/kcea-attendance-portal
cd kcea-attendance-portal
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Run the application**
```bash
python app.py
```

4. **Open in browser**
```
http://localhost:5000
```

## 🎮 Demo Accounts

| Roll No | Password | Branch | Year |
|---------|----------|--------|------|
| 20CS001 | password123 | CSE | 3rd |
| 20CS002 | password123 | CSE | 3rd |
| 20EC001 | password123 | ECE | 2nd |

## 👨‍💻 Developer

**Harshavardhan Ramgir**
- GitHub: [@HARSHAVARDHANRAMGIR](https://github.com/HARSHAVARDHANRAMGIR)

The static UI is served at `/`.

Deployment (Render/Railway/Vercel)
----------------------------------

- Use a Docker or Python environment with `uvicorn` command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Add environment variables from the `.env` section.
- Provision a managed Postgres instance and set `DATABASE_URL`.
- For images, create a Cloudinary account and add keys. Uploaded photos/ID cards will be stored via secure URLs.

Key features
------------

- Students: OTP or password login, mark attendance in sessions.
- Teachers: create sessions, live QR, see live counts.
- Admin/Teachers: filter attendance and export CSV:
  - `/attendance/admin/list?date=YYYY-MM-DD&roll_number=22B41A0501`
  - `/attendance/admin/export?...` returns `text/csv`.
- Real-time updates via WebSocket at `/ws` used by `/static/index.html`.

# College Real-Time Attendance System

A comprehensive real-time attendance tracking system built with Python FastAPI backend and React frontend.

## Features

- **Real-time attendance tracking** with WebSocket support
- **QR code generation** for easy attendance marking
- **User authentication** (Teachers, Students, Admins)
- **Live dashboard** with real-time updates
- **Attendance reports** and analytics
- **Mobile responsive** web interface
- **Database management** with SQLAlchemy

## Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - Database ORM
- **WebSockets** - Real-time communication
- **JWT** - Authentication
- **SQLite/PostgreSQL** - Database

### Frontend
- **React** - Modern UI framework
- **Tailwind CSS** - Styling
- **WebSocket client** - Real-time updates

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables
Create a `.env` file:
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./attendance.db
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Run the Backend
```bash
python main.py
```

### 4. Optional: Flask KCEA Website (simple version)
- A full Flask app is also provided with templates & static assets.
- Install extra deps: `pip install -r requirements.txt`
- Run Flask app: `python app.py`
- Open `http://localhost:5000` for the KCEA-branded site with OTP signup/login and dashboard.

## API Endpoints

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/request-otp` - Request OTP by username or roll number
- `POST /auth/verify-otp` - Verify OTP and get JWT
- `GET /attendance/` - Get attendance records
- `POST /attendance/mark` - Mark attendance
- `GET /attendance/reports` - Generate reports
- `GET /attendance/sheet/{course_id}` - Attendance sheet
- `WS /ws` - WebSocket for real-time updates

## Database Schema

- **Users** - User accounts and roles
- **Courses** - Course information
- **Sessions** - Class sessions
- **Attendance** - Attendance records
- **QR Codes** - Generated QR codes for sessions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 