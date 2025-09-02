#!/bin/bash

# KCEA Real-time Attendance Portal - Quick Deployment Script
# Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY

echo "🎓 KCEA Real-time Attendance Portal - Deployment Helper"
echo "======================================================"
echo ""

# Check if we're in the right directory
if [ ! -d "kcea-realtime-portal" ]; then
    echo "❌ Error: kcea-realtime-portal directory not found!"
    echo "Please run this script from the directory containing the project."
    exit 1
fi

echo "✅ Project directory found!"
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
echo ""

# Backend dependencies
echo "Installing backend dependencies..."
cd kcea-realtime-portal/backend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully!"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully!"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd ../..

echo ""
echo "🎉 Dependencies installed successfully!"
echo ""

# Step 2: Environment setup
echo "⚙️  Environment Setup"
echo "===================="
echo ""

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "🔧 IMPORTANT: Please edit the .env file with your actual values:"
    echo "   - MongoDB Atlas connection string"
    echo "   - Gmail SMTP credentials"
    echo "   - JWT secret key"
    echo ""
else
    echo "✅ .env file already exists!"
fi

# Step 3: Test local setup
echo "🧪 Testing Local Setup"
echo "====================="
echo ""

echo "Starting backend server..."
cd kcea-realtime-portal/backend
npm run dev &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend is running successfully!"
else
    echo "⚠️  Backend might not be running. Check your .env configuration."
fi

# Kill backend process
kill $BACKEND_PID 2>/dev/null

cd ../..

echo ""
echo "🚀 Deployment URLs to Visit:"
echo "============================"
echo ""
echo "1. MongoDB Atlas: https://www.mongodb.com/atlas/database"
echo "2. Gmail App Passwords: https://support.google.com/accounts/answer/185833"
echo "3. Railway (Backend): https://railway.app"
echo "4. Vercel (Frontend): https://vercel.com"
echo ""

echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Set up MongoDB Atlas (free tier)"
echo "2. Generate Gmail App Password"
echo "3. Update .env file with real values"
echo "4. Deploy backend to Railway"
echo "5. Deploy frontend to Vercel"
echo ""

echo "📖 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
echo ""

echo "👨‍💻 Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY"
echo "📧 Contact: r.harsha0541@gmail.com"
echo ""

echo "🎉 Setup complete! Your KCEA Portal is ready for deployment!"
