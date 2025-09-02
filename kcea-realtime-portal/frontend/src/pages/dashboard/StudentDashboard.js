/**
 * Student Dashboard - Real-time Attendance Management
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ClockIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { isConnected, emitAttendanceMarked } = useSocket();
  
  const [attendanceData, setAttendanceData] = useState({
    recentAttendance: [],
    subjectStats: [],
    summary: {
      totalClasses: 0,
      presentClasses: 0,
      absentClasses: 0,
      lateClasses: 0
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    period: '',
    subject: '',
    status: 'Present'
  });

  const currentDate = new Date();
  const periods = [
    { value: 1, label: '1st Period (9:00-10:00)' },
    { value: 2, label: '2nd Period (10:00-11:00)' },
    { value: 3, label: '3rd Period (11:15-12:15)' },
    { value: 4, label: '4th Period (12:15-1:15)' },
    { value: 5, label: '5th Period (2:00-3:00)' },
    { value: 6, label: '6th Period (3:00-4:00)' },
    { value: 7, label: '7th Period (4:00-5:00)' },
    { value: 8, label: '8th Period (5:00-6:00)' }
  ];

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/attendance/my', {
        params: {
          limit: 10,
          page: 1
        }
      });

      if (response.data.success) {
        setAttendanceData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    
    if (!attendanceForm.period || !attendanceForm.subject.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsMarkingAttendance(true);

    try {
      const response = await axios.post('/api/attendance/mark', {
        period: parseInt(attendanceForm.period),
        subject: attendanceForm.subject.trim(),
        status: attendanceForm.status,
        date: currentDate.toISOString().split('T')[0]
      });

      if (response.data.success) {
        toast.success(response.data.message);
        
        // Emit real-time event
        emitAttendanceMarked({
          userId: user.id,
          studentName: user.fullName,
          rollNumber: user.rollNumber,
          period: parseInt(attendanceForm.period),
          subject: attendanceForm.subject.trim(),
          status: attendanceForm.status,
          date: currentDate,
          markedAt: new Date()
        });

        // Reset form and close modal
        setAttendanceForm({
          period: '',
          subject: '',
          status: 'Present'
        });
        setShowMarkAttendance(false);
        
        // Refresh attendance data
        fetchAttendanceData();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(errorMessage);
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  const getAttendancePercentage = () => {
    const { totalClasses, presentClasses } = attendanceData.summary;
    return totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 65) return 'text-yellow-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'Absent':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'Late':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">KCEA</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Student Dashboard</h1>
                <p className="text-xs text-gray-600">Real-time Attendance Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-red-600 text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome back, {user.fullName}! 👋
                </h2>
                <p className="text-blue-100 mb-4">
                  {user.rollNumber} • {user.class} • Semester {user.semester}
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <span>📧 {user.email}</span>
                  <span>📱 {user.phoneNumber}</span>
                  <span>🏛️ {user.branch}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {getAttendancePercentage()}%
                </div>
                <div className="text-blue-100 text-sm">
                  Overall Attendance
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceData.summary.totalClasses}
                </p>
                <p className="text-sm text-gray-600">Total Classes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceData.summary.presentClasses}
                </p>
                <p className="text-sm text-gray-600">Present</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceData.summary.absentClasses}
                </p>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceData.summary.lateClasses}
                </p>
                <p className="text-sm text-gray-600">Late</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mark Attendance Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  📝 Mark Attendance
                </h3>
                <span className="text-sm text-gray-500">
                  {currentDate.toLocaleDateString('en-IN')}
                </span>
              </div>

              <button
                onClick={() => setShowMarkAttendance(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Mark Today's Attendance</span>
              </button>

              <div className="mt-6 space-y-3">
                <h4 className="font-medium text-gray-900">Today's Periods:</h4>
                {periods.slice(0, 4).map((period) => (
                  <div key={period.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{period.label}</span>
                    <span className="text-xs text-gray-500">Available</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  📊 Recent Attendance
                </h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                  <span>View All</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {attendanceData.recentAttendance.length > 0 ? (
                  attendanceData.recentAttendance.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(record.status)}
                        <div>
                          <p className="font-medium text-gray-900">{record.subject}</p>
                          <p className="text-sm text-gray-600">
                            Period {record.period} • {record.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.status === 'Present' ? 'bg-green-100 text-green-800' :
                          record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{record.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No attendance records yet</p>
                    <p className="text-sm text-gray-500">Start marking your attendance to see records here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subject-wise Statistics */}
        {attendanceData.subjectStats.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                📈 Subject-wise Attendance
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attendanceData.subjectStats.map((subject, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{subject.subject}</h4>
                      <span className={`text-lg font-bold ${getPercentageColor(subject.attendancePercentage)}`}>
                        {subject.attendancePercentage}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full ${
                          subject.attendancePercentage >= 85 ? 'bg-green-500' :
                          subject.attendancePercentage >= 75 ? 'bg-blue-500' :
                          subject.attendancePercentage >= 65 ? 'bg-yellow-500' :
                          subject.attendancePercentage >= 50 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${subject.attendancePercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Present: {subject.attendedClasses}</span>
                      <span>Total: {subject.totalClasses}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showMarkAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Mark Attendance</h3>
            
            <form onSubmit={handleMarkAttendance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period *
                </label>
                <select
                  value={attendanceForm.period}
                  onChange={(e) => setAttendanceForm({...attendanceForm, period: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Period</option>
                  {periods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={attendanceForm.subject}
                  onChange={(e) => setAttendanceForm({...attendanceForm, subject: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subject name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMarkAttendance(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMarkingAttendance}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isMarkingAttendance ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Marking...</span>
                    </>
                  ) : (
                    'Mark Attendance'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
