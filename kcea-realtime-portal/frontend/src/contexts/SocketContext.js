/**
 * Socket.IO Context - Real-time Communication
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

// Create context
const SocketContext = createContext();

// Socket Provider Component
export const SocketProvider = ({ children, socket }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);

  // Authenticate socket connection when user logs in
  useEffect(() => {
    if (socket && isAuthenticated && user) {
      socket.emit('authenticate', {
        userId: user.id,
        role: user.role,
        fullName: user.fullName,
        rollNumber: user.rollNumber
      });
    }
  }, [socket, isAuthenticated, user]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Connected to KCEA Portal server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Disconnected from KCEA Portal server');
    });

    socket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error);
      toast.error('Connection error. Some features may not work properly.');
    });

    // User activity events
    socket.on('user_registered', (data) => {
      if (user?.role === 'admin' || user?.role === 'faculty') {
        toast.success(`New student registered: ${data.fullName} (${data.rollNumber})`);
      }
    });

    socket.on('user_login', (data) => {
      if (user?.role === 'admin') {
        toast(`${data.fullName} logged in`, {
          icon: '👋',
          duration: 2000
        });
      }
    });

    socket.on('user_logout', (data) => {
      if (user?.role === 'admin') {
        toast(`${data.fullName} logged out`, {
          icon: '👋',
          duration: 2000
        });
      }
    });

    // Attendance events
    socket.on('attendance_marked', (data) => {
      // Show notification based on user role
      if (user?.role === 'admin' || user?.role === 'faculty') {
        toast.success(
          `${data.studentName} marked attendance for Period ${data.period} - ${data.subject}`,
          { duration: 3000 }
        );
      } else if (user?.id === data.userId) {
        toast.success(
          `Attendance marked for Period ${data.period} - ${data.subject}`,
          { duration: 3000 }
        );
      }
    });

    socket.on('attendance_bulk_update', (data) => {
      if (user?.role === 'admin' || user?.role === 'faculty') {
        toast.success(
          `Bulk attendance updated: ${data.recordsCount} records for ${new Date(data.date).toDateString()}`,
          { duration: 4000 }
        );
      }
    });

    socket.on('attendance_updated', (data) => {
      if (user?.role === 'admin' || user?.role === 'faculty') {
        toast(
          `Attendance updated: ${data.studentName} - Period ${data.period} (${data.previousStatus} → ${data.newStatus})`,
          { icon: '✏️', duration: 4000 }
        );
      }
    });

    socket.on('attendance_deleted', (data) => {
      if (user?.role === 'admin') {
        toast.error(
          `Attendance deleted: ${data.studentName} - Period ${data.period}`,
          { duration: 3000 }
        );
      }
    });

    // Profile events
    socket.on('profile_update', (data) => {
      if (user?.id === data.userId) {
        toast.success('Your profile has been updated', { duration: 2000 });
      }
    });

    // General notifications
    socket.on('notification', (notification) => {
      const { type, title, message, icon } = notification;
      
      switch (type) {
        case 'success':
          toast.success(message, { duration: 4000 });
          break;
        case 'error':
          toast.error(message, { duration: 5000 });
          break;
        case 'warning':
          toast(message, { icon: '⚠️', duration: 4000 });
          break;
        case 'info':
          toast(message, { icon: icon || 'ℹ️', duration: 3000 });
          break;
        default:
          toast(message, { duration: 3000 });
      }
    });

    // System events
    socket.on('system_maintenance', (data) => {
      toast.error(
        `System maintenance scheduled: ${data.message}`,
        { duration: 10000 }
      );
    });

    socket.on('server_announcement', (data) => {
      toast(data.message, {
        icon: '📢',
        duration: 6000,
        style: {
          background: '#3B82F6',
          color: '#fff'
        }
      });
    });

    // Online users count
    socket.on('online_users_count', (count) => {
      setOnlineUsers(count);
    });

    // Cleanup listeners
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('user_registered');
      socket.off('user_login');
      socket.off('user_logout');
      socket.off('attendance_marked');
      socket.off('attendance_bulk_update');
      socket.off('attendance_updated');
      socket.off('attendance_deleted');
      socket.off('profile_update');
      socket.off('notification');
      socket.off('system_maintenance');
      socket.off('server_announcement');
      socket.off('online_users_count');
    };
  }, [socket, user]);

  // Socket utility functions
  const emitAttendanceMarked = (attendanceData) => {
    if (socket && isConnected) {
      socket.emit('attendance_marked', attendanceData);
    }
  };

  const emitBulkAttendanceUpdate = (bulkData) => {
    if (socket && isConnected) {
      socket.emit('bulk_attendance_update', bulkData);
    }
  };

  const emitProfileUpdated = (profileData) => {
    if (socket && isConnected) {
      socket.emit('profile_updated', profileData);
    }
  };

  const sendNotification = (targetUserId, notification) => {
    if (socket && isConnected) {
      socket.emit('send_notification', {
        targetUserId,
        notification
      });
    }
  };

  const joinRoom = (roomName) => {
    if (socket && isConnected) {
      socket.emit('join_room', roomName);
    }
  };

  const leaveRoom = (roomName) => {
    if (socket && isConnected) {
      socket.emit('leave_room', roomName);
    }
  };

  // Context value
  const value = {
    // State
    socket,
    isConnected,
    onlineUsers,
    
    // Utility functions
    emitAttendanceMarked,
    emitBulkAttendanceUpdate,
    emitProfileUpdated,
    sendNotification,
    joinRoom,
    leaveRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};

export default SocketContext;
