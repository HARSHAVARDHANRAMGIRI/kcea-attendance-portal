# 🎓 KCEA Attendance Portal

A production-ready full-stack attendance management system for Kshatriya College of Engineering.

## 🚀 Tech Stack

### Frontend
- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui components
- **React Hook Form** + Zod validation
- **TanStack Query** for data fetching
- **Lucide React** icons

### Backend
- **Node.js** + Express (TypeScript)
- **Prisma ORM** + PostgreSQL
- **JWT Authentication** (httpOnly cookies)
- **Twilio Verify** for SMS OTP
- **Helmet** + CORS security

### Deployment
- **Railway**: API + PostgreSQL
- **Vercel**: Next.js frontend
- **GitHub Actions**: CI/CD pipeline

## 🏗️ Project Structure

```
/kcea
  /apps
    /web          # Next.js frontend
    /server       # Express API
  /packages
    /ui           # Shared components
  .github/workflows/ci.yml
```

## 🔧 Features

### 🎯 Core Features
- **Phone OTP Authentication** (Twilio + fallback)
- **Role-based Access Control** (Student/Faculty/Admin)
- **Real-time Attendance Tracking**
- **QR Code + Geofencing** (configurable)
- **Device Binding** (max 2 devices per student)

### 👨‍🎓 Student Portal
- View attendance percentage & calendar heatmap
- Mark attendance via OTP + QR/Geofence
- Course-wise breakdown
- Grades & announcements
- Profile management

### 👨‍🏫 Faculty Portal
- Create & manage sessions
- Generate rotating QR codes (30s refresh)
- Set geofence boundaries
- Bulk roster upload (CSV/XLSX)
- Live attendance monitoring
- Manual override with reason tracking

### 🔧 Admin Dashboard
- Department & course management
- User role management
- Timetable configuration
- Audit logs & analytics
- SMS usage metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- Twilio account (for SMS OTP)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd kcea

# Install dependencies
npm install

# Setup environment variables
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# Setup database
cd apps/server
npx prisma migrate dev
npx prisma db seed

# Start development servers
npm run dev
```

### Environment Variables

#### Server (.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/kcea"
JWT_SECRET="your-jwt-secret"
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_VERIFY_SID="your-verify-service-sid"
NODE_ENV="development"
PORT=3001
```

#### Web (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 📱 API Documentation

API documentation available at: `http://localhost:3001/docs`

### Authentication Flow
1. **Phone Verification**: Send OTP to phone number
2. **OTP Validation**: Verify 6-digit code
3. **JWT Tokens**: Access + Refresh tokens in httpOnly cookies
4. **Role-based Access**: Student/Faculty/Admin permissions

### Key Endpoints
- `POST /api/v1/auth/send-otp` - Send OTP to phone
- `POST /api/v1/auth/verify-otp` - Verify OTP & login
- `GET /api/v1/attendance/student/:id` - Student attendance
- `POST /api/v1/attendance/mark` - Mark attendance
- `GET /api/v1/sessions/active` - Active sessions for faculty

## 🔒 Security Features

- **Input Validation**: Zod schemas on all endpoints
- **Rate Limiting**: OTP requests & API calls
- **CSRF Protection**: On mutating routes
- **Helmet Security**: HTTP headers protection
- **JWT Rotation**: Refresh token mechanism
- **Device Binding**: Limit concurrent sessions
- **Geofencing**: Location-based attendance (optional)
- **QR Code Rotation**: 30-second expiry

## 🚀 Deployment

### Railway (API + Database)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Vercel (Frontend)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/web
vercel --prod
```

## 📊 Monitoring & Logging

- **Pino Logger**: Structured JSON logging
- **Request ID**: Trace requests across services
- **Error Tracking**: Comprehensive error handling
- **Performance Metrics**: Response time monitoring

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 📈 Performance

- **Database Indexing**: Optimized queries
- **Caching**: Redis for session data
- **CDN**: Static asset optimization
- **Compression**: Gzip/Brotli enabled
- **Bundle Optimization**: Tree shaking & code splitting

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
