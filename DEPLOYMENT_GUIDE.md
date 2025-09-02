# 🚀 KCEA Portal - Complete Deployment Guide

## **Step 1: MongoDB Atlas Setup (Free Database)**

1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. **Create Cluster**: 
   - Choose M0 Sandbox (Free)
   - Select region closest to you
   - Name: `kcea-cluster`
3. **Database Access**:
   - Create database user: `kcea-admin`
   - Generate strong password
4. **Network Access**:
   - Add IP: `0.0.0.0/0` (allow from anywhere)
5. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password

**Example Connection String:**
```
mongodb+srv://kcea-admin:YOUR_PASSWORD@kcea-cluster.xxxxx.mongodb.net/kcea-attendance
```

---

## **Step 2: Gmail SMTP Setup (Free Email Service)**

1. **Enable 2FA**: Go to [Google Account Security](https://myaccount.google.com/security)
2. **Generate App Password**:
   - Go to [App Passwords](https://support.google.com/accounts/answer/185833)
   - Select "Mail" and generate password
   - Save this 16-character password

**Required Values:**
- `GMAIL_USER`: your-email@gmail.com
- `GMAIL_PASS`: your-16-character-app-password

---

## **Step 3: Backend Deployment (Railway - Free)**

### **3.1 Railway Setup**
1. **Sign Up**: Go to [Railway](https://railway.app)
2. **Connect GitHub**: Link your GitHub account
3. **New Project**: Create from GitHub repository

### **3.2 Environment Variables**
Set these in Railway dashboard:

```env
# Database
MONGO_URI=mongodb+srv://kcea-admin:YOUR_PASSWORD@kcea-cluster.xxxxx.mongodb.net/kcea-attendance

# JWT
JWT_SECRET=kcea-super-secret-jwt-key-2024-production
JWT_EXPIRES_IN=7d

# Email
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-character-app-password

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app

# College Info
COLLEGE_NAME=Kshatriya College of Engineering
COLLEGE_CODE=KCEA
COLLEGE_ESTABLISHED=2001
COLLEGE_LOCATION=NH-16, 30km from Nizamabad
COLLEGE_AFFILIATION=JNTUH

# Security
CORS_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
OTP_RATE_LIMIT=5
OTP_EXPIRES_IN=60
OTP_RESEND_COOLDOWN=30
MAX_OTP_ATTEMPTS=3
```

### **3.3 Deploy Backend**
1. **Root Directory**: Set to `kcea-realtime-portal/backend`
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. **Deploy**: Railway will auto-deploy

**Your Backend URL**: `https://your-app-name.railway.app`

---

## **Step 4: Frontend Deployment (Vercel - Free)**

### **4.1 Vercel Setup**
1. **Sign Up**: Go to [Vercel](https://vercel.com)
2. **Import Project**: Connect GitHub repository
3. **Framework**: Select "Create React App"

### **4.2 Build Settings**
- **Root Directory**: `kcea-realtime-portal/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### **4.3 Environment Variables**
Set in Vercel dashboard:

```env
REACT_APP_API_URL=https://your-backend-url.railway.app
REACT_APP_SOCKET_URL=https://your-backend-url.railway.app
```

### **4.4 Deploy Frontend**
1. **Deploy**: Vercel will auto-deploy
2. **Custom Domain** (Optional): Add your domain

**Your Frontend URL**: `https://your-app-name.vercel.app`

---

## **Step 5: Update CORS Settings**

After frontend deployment, update backend environment:

```env
FRONTEND_URL=https://your-app-name.vercel.app
CORS_ORIGINS=https://your-app-name.vercel.app,http://localhost:3000
```

---

## **Step 6: Test Deployment**

### **6.1 Backend Health Check**
Visit: `https://your-backend-url.railway.app/health`

Should return:
```json
{
  "status": "🚀 KCEA Real-time Portal API Running",
  "service": "KCEA Attendance Management System",
  "database": "Connected",
  "developer": {
    "name": "Harshavardhan Ramgiri",
    "company": "AUTOFLOW AGENCY"
  }
}
```

### **6.2 Frontend Test**
1. Visit your frontend URL
2. Try registration with your email
3. Check email for OTP
4. Complete login process

---

## **Step 7: Create Admin Account**

### **7.1 Register Admin User**
1. Go to your frontend URL
2. Register with admin email
3. Complete OTP verification

### **7.2 Promote to Admin**
Connect to MongoDB Atlas and update user role:

```javascript
// In MongoDB Atlas → Collections → users
// Find your user and update:
{
  "role": "admin"
}
```

---

## **Alternative Deployment Options**

### **Backend Alternatives:**
- **Heroku**: Similar to Railway
- **Render**: Free tier available
- **DigitalOcean App Platform**: $5/month

### **Frontend Alternatives:**
- **Netlify**: Similar to Vercel
- **GitHub Pages**: Free static hosting
- **Firebase Hosting**: Google's hosting

---

## **Cost Breakdown (All Free Tiers)**

| Service | Cost | Limits |
|---------|------|--------|
| MongoDB Atlas | Free | 512MB storage |
| Railway | Free | 500 hours/month |
| Vercel | Free | 100GB bandwidth |
| Gmail SMTP | Free | 500 emails/day |
| **Total** | **$0/month** | Perfect for college use |

---

## **Production Checklist**

- [ ] MongoDB Atlas cluster created
- [ ] Gmail App Password generated
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Health checks passing
- [ ] Admin account created
- [ ] Email notifications working
- [ ] Real-time features tested

---

## **Support & Troubleshooting**

### **Common Issues:**
1. **CORS Errors**: Check CORS_ORIGINS environment variable
2. **Email Not Sending**: Verify Gmail App Password
3. **Database Connection**: Check MongoDB connection string
4. **Build Failures**: Check Node.js version compatibility

### **Get Help:**
- **Developer**: Harshavardhan Ramgiri
- **Email**: r.harsha0541@gmail.com
- **Company**: AUTOFLOW AGENCY

---

**🎉 Congratulations! Your KCEA Portal is now live and ready for students!**
