/**
 * Authentication Context - User State Management
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

// Initial state
const initialState = {
  user: null,
  loading: true,
  isAuthenticated: false,
  token: null
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_TOKEN: 'SET_TOKEN'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case AUTH_ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios interceptors
  useEffect(() => {
    // Request interceptor to add token
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = state.token || Cookies.get('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          if (error.response.data?.code === 'TOKEN_EXPIRED' || 
              error.response.data?.code === 'INVALID_TOKEN') {
            logout();
            toast.error('Session expired. Please login again.');
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [state.token]);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check if user is authenticated
  const checkAuthStatus = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const token = Cookies.get('token');
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      const response = await axios.get('/api/auth/me');
      
      if (response.data.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.data.user,
            token
          }
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data.success) {
        toast.success(response.data.message);
        return {
          success: true,
          data: response.data.data,
          nextStep: response.data.nextStep
        };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        validationErrors: error.response?.data?.validationErrors
      };
    }
  };

  // Login user (send OTP)
  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      
      if (response.data.success) {
        toast.success(response.data.message);
        return {
          success: true,
          data: response.data.data,
          nextStep: response.data.nextStep
        };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        code: error.response?.data?.code
      };
    }
  };

  // Verify OTP and complete login
  const verifyOTP = async (otpData) => {
    try {
      const response = await axios.post('/api/auth/verify-otp', otpData);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store token in cookie
        Cookies.set('token', token, { 
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token }
        });
        
        toast.success(response.data.message);
        return { success: true, user };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'OTP verification failed';
      toast.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        code: error.response?.data?.code,
        remainingAttempts: error.response?.data?.remainingAttempts
      };
    }
  };

  // Resend OTP
  const resendOTP = async (email) => {
    try {
      const response = await axios.post('/api/auth/resend-otp', { email });
      
      if (response.data.success) {
        toast.success(response.data.message);
        return {
          success: true,
          data: response.data.data
        };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        remainingTime: error.response?.data?.remainingTime
      };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token and user data
      Cookies.remove('token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    });
  };

  // Context value
  const value = {
    // State
    user: state.user,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    token: state.token,
    
    // Actions
    register,
    login,
    verifyOTP,
    resendOTP,
    logout,
    updateUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
