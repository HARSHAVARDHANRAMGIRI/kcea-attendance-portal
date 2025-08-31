import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Home, 
  BarChart3, 
  Calendar,
  Bell,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="railway-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="kcea-logo">
              <div className="kcea-logo-circle">
                <span className="font-serif">KCEA</span>
              </div>
              <div className="hidden sm:block">
                <div className="kcea-logo-text">KCEA Portal</div>
                <div className="kcea-logo-subtitle">Attendance System</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {!user ? (
                <>
                  <Link 
                    to="/" 
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isActive('/') 
                        ? 'text-railway-blue' 
                        : 'text-railway-dark hover:text-railway-blue'
                    }`}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/login" 
                    className="railway-btn-outline text-sm px-4 py-2"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="railway-btn text-sm px-4 py-2"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <>
                  {user.role === 'admin' ? (
                    <>
                      <Link 
                        to="/admin" 
                        className={`text-sm font-medium transition-colors duration-200 ${
                          isActive('/admin') 
                            ? 'text-railway-blue' 
                            : 'text-railway-dark hover:text-railway-blue'
                        }`}
                      >
                        Dashboard
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/dashboard" 
                        className={`text-sm font-medium transition-colors duration-200 ${
                          isActive('/dashboard') 
                            ? 'text-railway-blue' 
                            : 'text-railway-dark hover:text-railway-blue'
                        }`}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/attendance" 
                        className={`text-sm font-medium transition-colors duration-200 ${
                          isActive('/attendance') 
                            ? 'text-railway-blue' 
                            : 'text-railway-dark hover:text-railway-blue'
                        }`}
                      >
                        Attendance
                      </Link>
                      <Link 
                        to="/news" 
                        className={`text-sm font-medium transition-colors duration-200 ${
                          isActive('/news') 
                            ? 'text-railway-blue' 
                            : 'text-railway-dark hover:text-railway-blue'
                        }`}
                      >
                        News
                      </Link>
                    </>
                  )}

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 text-sm font-medium text-railway-dark hover:text-railway-blue transition-colors duration-200"
                    >
                      <div className="w-8 h-8 bg-railway-blue rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden lg:block">{user.name}</span>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-railway shadow-card border border-railway-border z-50">
                        <div className="py-1">
                          <div className="px-4 py-2 text-sm text-railway-neutral border-b border-railway-border">
                            <div className="font-medium text-railway-dark">{user.name}</div>
                            <div className="text-xs">{user.rollNo}</div>
                          </div>
                          <Link
                            to="/profile"
                            className="flex items-center px-4 py-2 text-sm text-railway-dark hover:bg-railway-gray transition-colors duration-200"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <User className="w-4 h-4 mr-2" />
                            Profile
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-railway-error hover:bg-red-50 transition-colors duration-200"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-railway-dark hover:text-railway-blue transition-colors duration-200"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-railway-border bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {!user ? (
                <>
                  <Link
                    to="/"
                    className="block px-3 py-2 text-base font-medium text-railway-dark hover:text-railway-blue hover:bg-railway-gray rounded-button transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-base font-medium text-railway-dark hover:text-railway-blue hover:bg-railway-gray rounded-button transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-base font-medium text-railway-dark hover:text-railway-blue hover:bg-railway-gray rounded-button transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <div className="px-3 py-2 border-b border-railway-border mb-2">
                    <div className="text-base font-medium text-railway-dark">{user.name}</div>
                    <div className="text-sm text-railway-neutral">{user.rollNo}</div>
                  </div>
                  
                  {user.role === 'admin' ? (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 text-base font-medium text-railway-dark hover:text-railway-blue hover:bg-railway-gray rounded-button transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/dashboard"
                        className="block px-3 py-2 text-base font-medium text-railway-dark hover:text-railway-blue hover:bg-railway-gray rounded-button transition-colors duration-200"
                        onClick={() => setIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/attendance"
                        className="block px-3 py-2 text-base font-medium text-railway-dark hover:text-railway-blue hover:bg-railway-gray rounded-button transition-colors duration-200"
                        onClick={() => setIsOpen(false)}
                      >
                        Attendance
                      </Link>
                      <Link
                        to="/news"
                        className="block px-3 py-2 text-base font-medium text-railway-dark hover:text-railway-blue hover:bg-railway-gray rounded-button transition-colors duration-200"
                        onClick={() => setIsOpen(false)}
                      >
                        News
                      </Link>
                    </>
                  )}
                  
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-base font-medium text-railway-dark hover:text-railway-blue hover:bg-railway-gray rounded-button transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-railway-error hover:bg-red-50 rounded-button transition-colors duration-200"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation for logged-in users */}
      {user && user.role !== 'admin' && (
        <div className="mobile-nav md:hidden">
          <div className="flex">
            <Link
              to="/dashboard"
              className={`mobile-nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            >
              <Home className="w-5 h-5 mb-1" />
              <span>Home</span>
            </Link>
            <Link
              to="/attendance"
              className={`mobile-nav-item ${isActive('/attendance') ? 'active' : ''}`}
            >
              <Calendar className="w-5 h-5 mb-1" />
              <span>Attendance</span>
            </Link>
            <Link
              to="/news"
              className={`mobile-nav-item ${isActive('/news') ? 'active' : ''}`}
            >
              <Bell className="w-5 h-5 mb-1" />
              <span>News</span>
            </Link>
            <Link
              to="/profile"
              className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}
            >
              <User className="w-5 h-5 mb-1" />
              <span>Profile</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
