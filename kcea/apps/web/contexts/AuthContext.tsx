'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'student' | 'faculty' | 'admin';
  rollNumber?: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  sendOTP: (phone: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/users/profile');
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      // User not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (phone: string) => {
    try {
      const response = await api.post('/auth/send-otp', { phone });
      if (response.data.success) {
        toast.success('OTP sent successfully!');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
      throw error;
    }
  };

  const login = async (phone: string, otp: string) => {
    try {
      const response = await api.post('/auth/verify-otp', { phone, otp });
      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Login successful!');
        
        // Redirect based on role
        switch (response.data.user.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'faculty':
            router.push('/faculty');
            break;
          case 'student':
            router.push('/student');
            break;
          default:
            router.push('/dashboard');
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      // Even if logout fails on server, clear local state
      setUser(null);
      router.push('/');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/users/profile');
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    sendOTP,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
