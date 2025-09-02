/**
 * KCEA Portal Homepage
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon, 
  ClockIcon, 
  ChartBarIcon, 
  DevicePhoneMobileIcon,
  BoltIcon,
  ShieldCheckIcon,
  UsersIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const [stats, setStats] = useState({
    totalStudents: 1250,
    totalAttendance: 45680,
    averageAttendance: 87.5,
    onlineUsers: 0
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: ClockIcon,
      title: 'Real-time Attendance',
      description: 'Mark and track attendance with live updates across all devices',
      color: 'text-blue-600'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile-First Design',
      description: 'Optimized for smartphones with touch-friendly interface',
      color: 'text-green-600'
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Detailed reports and insights with visual charts',
      color: 'text-purple-600'
    },
    {
      icon: BoltIcon,
      title: 'Lightning Fast',
      description: 'Built with modern technology for instant responses',
      color: 'text-yellow-600'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with email OTP verification',
      color: 'text-red-600'
    },
    {
      icon: GlobeAltIcon,
      title: 'Always Available',
      description: '24/7 access from anywhere with cloud hosting',
      color: 'text-indigo-600'
    }
  ];

  const collegeInfo = {
    name: 'Kshatriya College of Engineering',
    established: '2001',
    location: 'NH-16, 30km from Nizamabad',
    affiliation: 'JNTUH',
    campus: '40 acres',
    certification: 'ISO 9001:2008'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">KCEA</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">KCEA Portal</h1>
                <p className="text-xs text-gray-600">Real-time Attendance System</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <span className="text-sm text-gray-600">
                {currentTime.toLocaleTimeString('en-IN')}
              </span>
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 font-semibold"
              >
                Register
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">Attendance</span>
                </h1>
                <h2 className="text-2xl lg:text-3xl font-semibold text-gray-700 mt-2">
                  Management System
                </h2>
              </div>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Experience the future of attendance tracking with real-time updates, 
                mobile-first design, and advanced analytics. Built specifically for 
                <span className="font-semibold text-blue-600"> {collegeInfo.name}</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-200 text-center"
                >
                  🎓 Get Started Free
                </Link>
                <Link 
                  to="/login" 
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-200 text-center"
                >
                  🚀 Login Now
                </Link>
              </div>

              {/* Live Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalStudents.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalAttendance.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.averageAttendance}%</div>
                  <div className="text-sm text-gray-600">Avg Attendance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.onlineUsers}</div>
                  <div className="text-sm text-gray-600">Online Now</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AcademicCapIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{collegeInfo.name}</h3>
                  <p className="text-gray-600">Established {collegeInfo.established}</p>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{collegeInfo.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Affiliation:</span>
                    <span className="font-medium">{collegeInfo.affiliation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Campus:</span>
                    <span className="font-medium">{collegeInfo.campus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Certification:</span>
                    <span className="font-medium">{collegeInfo.certification}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Portal Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose KCEA Portal?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with modern technology and designed for the future of education management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of students already using KCEA Portal for seamless attendance management
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-200"
            >
              🎓 Register Now - It's Free!
            </Link>
            <Link 
              to="/login" 
              className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              🚀 Already Have Account?
            </Link>
          </div>

          <div className="mt-8 text-blue-100 text-sm">
            <p>✅ No setup fees • ✅ No hidden costs • ✅ 24/7 support</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
