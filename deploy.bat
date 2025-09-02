@echo off
REM KCEA Real-time Attendance Portal - Quick Deployment Script (Windows)
REM Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY

echo.
echo 🎓 KCEA Real-time Attendance Portal - Deployment Helper
echo ======================================================
echo.

REM Check if we're in the right directory
if not exist "kcea-realtime-portal" (
    echo ❌ Error: kcea-realtime-portal directory not found!
    echo Please run this script from the directory containing the project.
    pause
    exit /b 1
)

echo ✅ Project directory found!
echo.

REM Step 1: Install dependencies
echo 📦 Installing dependencies...
echo.

REM Backend dependencies
echo Installing backend dependencies...
cd kcea-realtime-portal\backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed successfully!

REM Frontend dependencies
echo Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed successfully!

cd ..\..

echo.
echo 🎉 Dependencies installed successfully!
echo.

REM Step 2: Environment setup
echo ⚙️  Environment Setup
echo ====================
echo.

if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env file created!
    echo.
    echo 🔧 IMPORTANT: Please edit the .env file with your actual values:
    echo    - MongoDB Atlas connection string
    echo    - Gmail SMTP credentials
    echo    - JWT secret key
    echo.
) else (
    echo ✅ .env file already exists!
)

echo.
echo 🚀 Deployment URLs to Visit:
echo ============================
echo.
echo 1. MongoDB Atlas: https://www.mongodb.com/atlas/database
echo 2. Gmail App Passwords: https://support.google.com/accounts/answer/185833
echo 3. Railway (Backend): https://railway.app
echo 4. Vercel (Frontend): https://vercel.com
echo.

echo 📋 Next Steps:
echo ==============
echo.
echo 1. Set up MongoDB Atlas (free tier)
echo 2. Generate Gmail App Password
echo 3. Update .env file with real values
echo 4. Deploy backend to Railway
echo 5. Deploy frontend to Vercel
echo.

echo 📖 For detailed instructions, see: DEPLOYMENT_GUIDE.md
echo.

echo 👨‍💻 Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
echo 📧 Contact: r.harsha0541@gmail.com
echo.

echo 🎉 Setup complete! Your KCEA Portal is ready for deployment!
echo.

pause
