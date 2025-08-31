# KCEA Portal - API Documentation

## 🔗 API Overview

The KCEA Attendance Portal provides a RESTful API for managing student attendance, authentication, and college information.

**Base URL (Local)**: `http://localhost:5000`  
**Base URL (Live)**: `https://web-production-bdf3f.up.railway.app`

## 🔐 Authentication

The API uses session-based authentication with secure cookies.

### Authentication Flow
1. Student registers or logs in
2. Server creates a session
3. Session cookie is sent with subsequent requests
4. Session expires on logout or timeout

### Session Management
- **Session Duration**: Until browser close or explicit logout
- **Security**: HTTPOnly cookies, CSRF protection
- **Storage**: Server-side session storage

## 📚 API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new student account.

**Request Body:**
```json
{
  "rollNo": "20CS001",
  "name": "John Doe",
  "email": "john.doe@college.edu",
  "phone": "9876543210",
  "branch": "CSE",
  "year": 3,
  "password": "securepassword123"
}
```

**Validation Rules:**
- `rollNo`: Required, unique, alphanumeric
- `name`: Required, 2-50 characters
- `email`: Required, valid email format, unique
- `phone`: Required, 10 digits starting with 6-9
- `branch`: Required, one of: CSE, ECE, MECH, CIVIL, EEE, CSE(DS)
- `year`: Required, integer between 1-4
- `password`: Required, minimum 6 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful! Welcome to KCEA Portal"
}
```

**Error Response (400):**
```json
{
  "error": "Roll number already exists"
}
```

#### POST /api/auth/login
Authenticate a student and create session.

**Request Body:**
```json
{
  "rollNo": "20CS001",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful! Welcome to KCEA Portal",
  "student": {
    "id": 1,
    "rollNo": "20CS001",
    "name": "John Doe",
    "email": "john.doe@college.edu",
    "branch": "CSE",
    "year": 3,
    "attendancePercentage": 87.5
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid roll number or password"
}
```

#### GET /logout
Logout student and destroy session.

**Response:** Redirects to homepage

### Attendance Endpoints

#### POST /api/attendance/mark
Mark attendance for the current student.

**Authentication:** Required (session-based)

**Request Body:**
```json
{
  "subject": "Data Structures"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Attendance marked successfully!",
  "data": {
    "subject": "Data Structures",
    "date": "2024-01-15",
    "time": "10:30:45",
    "status": "Present"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Attendance already marked for today"
}
```

**Error Response (401):**
```json
{
  "error": "Please login first"
}
```

### Student Dashboard Endpoints

#### GET /api/student/dashboard
Get comprehensive dashboard data for logged-in student.

**Authentication:** Required (session-based)

**Success Response (200):**
```json
{
  "success": true,
  "student": {
    "id": 1,
    "rollNo": "20CS001",
    "name": "John Doe",
    "email": "john.doe@college.edu",
    "branch": "CSE",
    "year": 3,
    "totalClasses": 40,
    "attendedClasses": 35,
    "attendancePercentage": 87.5
  },
  "recentAttendance": [
    {
      "subject": "Data Structures",
      "date": "2024-01-15",
      "time": "10:30:45",
      "status": "Present"
    },
    {
      "subject": "Database Systems",
      "date": "2024-01-14",
      "time": "14:15:20",
      "status": "Present"
    }
  ],
  "subjectStats": [
    {
      "subject": "Data Structures",
      "total": 15,
      "present": 14,
      "percentage": 93.33
    },
    {
      "subject": "Database Systems",
      "total": 12,
      "present": 10,
      "percentage": 83.33
    }
  ]
}
```

**Error Response (401):**
```json
{
  "error": "Please login first"
}
```

### News Endpoints

#### GET /api/news
Get latest college news and announcements.

**Authentication:** Not required

**Success Response (200):**
```json
{
  "success": true,
  "news": [
    {
      "title": "First Alumni Meet 2K25",
      "content": "Our First Alumni meet 2K25 was a grand success! Over 200 alumni participated and shared their experiences.",
      "author": "Admin",
      "date": "2024-01-10T10:00:00"
    },
    {
      "title": "New CSD Department Approved",
      "content": "TGCHE has officially allotted COMPUTER SCIENCE & DATA SCIENCE (CSD) with 60 seats intake for the academic year 2024-25!",
      "author": "Academic Office",
      "date": "2024-01-08T15:30:00"
    }
  ]
}
```

### Page Endpoints

#### GET /
Homepage with college information and login/register forms.

**Response:** HTML page

#### GET /dashboard
Student dashboard page (requires authentication).

**Authentication:** Required (redirects to homepage if not logged in)

**Response:** HTML page with dashboard interface

## 🔧 HTTP Status Codes

### Success Codes
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **302 Found**: Redirect response

### Client Error Codes
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation failed

### Server Error Codes
- **500 Internal Server Error**: Server-side error

## 📝 Request/Response Format

### Content Type
- **Request**: `application/json` for API endpoints
- **Response**: `application/json` for API endpoints, `text/html` for pages

### Headers
**Required for API requests:**
```
Content-Type: application/json
```

**Session cookie automatically included:**
```
Cookie: session=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 🛡️ Security Features

### Input Validation
- **Server-side validation** for all inputs
- **SQL injection protection** using parameterized queries
- **XSS protection** through template escaping
- **CSRF protection** built into Flask

### Password Security
- **bcrypt hashing** with salt
- **Minimum length** requirements
- **No plain text storage**

### Session Security
- **HTTPOnly cookies** prevent XSS access
- **Secure cookies** in production (HTTPS)
- **Session timeout** on inactivity
- **CSRF tokens** for state-changing operations

## 🔍 Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message describing what went wrong",
  "details": "Additional details if available",
  "timestamp": "2024-01-15T10:30:45Z"
}
```

### Common Error Scenarios

**Validation Errors:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "year",
      "message": "Year must be between 1 and 4"
    }
  ]
}
```

**Authentication Errors:**
```json
{
  "error": "Authentication required",
  "message": "Please login to access this resource"
}
```

**Database Errors:**
```json
{
  "error": "Duplicate entry",
  "message": "Roll number '20CS001' already exists"
}
```

## 📊 Rate Limiting

### Current Limits
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 10 requests per 15 minutes per IP
- **Attendance marking**: 1 request per day per student per subject

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

## 🧪 Testing the API

### Using cURL

**Register a student:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "rollNo": "21CS999",
    "name": "Test Student",
    "email": "test@example.com",
    "phone": "9876543210",
    "branch": "CSE",
    "year": 2,
    "password": "testpass123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "rollNo": "21CS999",
    "password": "testpass123"
  }'
```

**Get dashboard (with session):**
```bash
curl -X GET http://localhost:5000/api/student/dashboard \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Mark attendance:**
```bash
curl -X POST http://localhost:5000/api/attendance/mark \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "subject": "Web Development"
  }'
```

### Using JavaScript (Frontend)

**Register a student:**
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    rollNo: '21CS999',
    name: 'Test Student',
    email: 'test@example.com',
    phone: '9876543210',
    branch: 'CSE',
    year: 2,
    password: 'testpass123'
  })
});

const data = await response.json();
console.log(data);
```

**Login:**
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    rollNo: '21CS999',
    password: 'testpass123'
  })
});

const data = await response.json();
if (data.success) {
  window.location.href = '/dashboard';
}
```

## 🔄 API Versioning

### Current Version
- **Version**: v1 (implicit)
- **Stability**: Stable
- **Backward Compatibility**: Maintained

### Future Versions
- API versioning will be implemented as `/api/v2/` when breaking changes are needed
- Current endpoints will remain supported for backward compatibility

## 📈 Performance

### Response Times
- **Authentication**: < 200ms
- **Dashboard data**: < 300ms
- **Attendance marking**: < 150ms
- **News retrieval**: < 100ms

### Optimization Features
- **Database indexing** on frequently queried fields
- **Session caching** for authenticated users
- **Efficient SQL queries** with proper joins
- **Minimal data transfer** with selective field returns

---

**API Documentation Complete! 🚀**

This API powers the KCEA Attendance Portal and provides all necessary endpoints for student attendance management.

*Developed by HARSHAVARDHAN RAMGIRI for educational institutions worldwide*
