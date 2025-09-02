/**
 * 404 Not Found Page
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 animate-pulse">
            404
          </div>
          <div className="text-6xl mb-4 animate-bounce">🔍</div>
        </div>

        {/* Error Message */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. 
            Don't worry, let's get you back on track!
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/"
              className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Go to Homepage
            </Link>
            
            <button
              onClick={() => navigate(-1)}
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">Quick Links:</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Link 
                to="/login" 
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                🚀 Login
              </Link>
              <Link 
                to="/register" 
                className="text-green-600 hover:text-green-700 transition-colors"
              >
                🎓 Register
              </Link>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a 
              href="mailto:r.harsha0541@gmail.com" 
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              r.harsha0541@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
