/**
 * KCEA Real-time Attendance Portal - Main App Component
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 * Email: r.harsha0541@gmail.com
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OTPVerificationPage from './pages/auth/OTPVerificationPage';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import FacultyDashboard from './pages/dashboard/FacultyDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import AttendancePage from './pages/AttendancePage';
import NotFoundPage from './pages/NotFoundPage';

// Styles
import './App.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    // Redirect based on user role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'faculty':
        return <Navigate to="/faculty/dashboard" replace />;
      case 'student':
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

// Main App Component
function App() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to KCEA Portal server');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from KCEA Portal server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider socket={socket}>
            <Router>
              <div className="App min-h-screen bg-gray-50">
                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                      borderRadius: '12px',
                      padding: '16px',
                      fontSize: '14px',
                      fontWeight: '500'
                    },
                    success: {
                      iconTheme: {
                        primary: '#10B981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#EF4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />

                {/* Routes */}
                <Routes>
                  {/* Public Routes */}
                  <Route 
                    path="/" 
                    element={
                      <PublicRoute>
                        <HomePage />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      <PublicRoute>
                        <RegisterPage />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/verify-otp" 
                    element={
                      <PublicRoute>
                        <OTPVerificationPage />
                      </PublicRoute>
                    } 
                  />

                  {/* Protected Routes - Student */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/attendance" 
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <AttendancePage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Protected Routes - Faculty */}
                  <Route 
                    path="/faculty/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['faculty']}>
                        <FacultyDashboard />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Protected Routes - Admin */}
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Protected Routes - All Users */}
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Error Routes */}
                  <Route 
                    path="/unauthorized" 
                    element={
                      <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <div className="text-6xl mb-4">🚫</div>
                          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                          <button 
                            onClick={() => window.history.back()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Go Back
                          </button>
                        </div>
                      </div>
                    } 
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>

                {/* Footer - Always visible */}
                <footer className="bg-gray-900 text-white py-8 mt-auto">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                      {/* Developer Credit */}
                      <div className="mb-4">
                        <p className="text-lg font-semibold mb-2">
                          Developed and Managed by{' '}
                          <span className="text-blue-400">Harshavardhan Ramgiri</span>
                          {' · '}
                          <span className="text-green-400 font-bold">AUTOFLOW AGENCY</span>
                        </p>
                        <p className="text-sm text-gray-300 max-w-3xl mx-auto leading-relaxed">
                          This Smart Attendance Portal was designed and developed by Harshavardhan Ramgiri 
                          (Founder, AUTOFLOW AGENCY), CSE student at Kshatriya College of Engineering. 
                          Passionate about full-stack development, real-time systems, and building innovative educational solutions.
                        </p>
                      </div>

                      {/* Contact Information */}
                      <div className="mb-4">
                        <p className="text-sm">
                          📧 Email:{' '}
                          <a 
                            href="mailto:r.harsha0541@gmail.com" 
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            r.harsha0541@gmail.com
                          </a>
                        </p>
                      </div>

                      {/* College Information */}
                      <div className="mb-4 text-sm text-gray-400">
                        <p className="font-semibold text-white mb-1">Kshatriya College of Engineering</p>
                        <p>NH-16, 30km from Nizamabad, Telangana</p>
                        <p>Affiliated to JNTUH | Established 2001 | ISO 9001:2008</p>
                      </div>

                      {/* Copyright */}
                      <div className="pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-400">
                          © {new Date().getFullYear()} AUTOFLOW AGENCY. All rights reserved.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Real-time Attendance Management System | Version 2.0.0
                        </p>
                      </div>
                    </div>
                  </div>
                </footer>
              </div>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
