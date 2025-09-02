/**
 * Registration Page - User Registration with Validation
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm();

  const branches = [
    'CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'CSE(DS)', 'IT', 'AERO', 'CHEM', 'BIOTECH'
  ];

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await registerUser(data);
      
      if (result.success) {
        // Store email for OTP verification
        sessionStorage.setItem('otpEmail', data.email);
        navigate('/verify-otp');
      } else {
        // Handle validation errors
        if (result.validationErrors) {
          result.validationErrors.forEach(error => {
            setError(error.field, {
              type: 'manual',
              message: error.message
            });
          });
        } else {
          setError('root', {
            type: 'manual',
            message: result.error
          });
        }
      }
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">KCEA</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Join KCEA Portal</h2>
          <p className="mt-2 text-gray-600">Create your student account</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Global Error */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="text-red-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{errors.root.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                className={`form-input ${errors.fullName ? 'form-input-error' : ''}`}
                placeholder="Enter your full name"
                {...register('fullName', {
                  required: 'Full name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  },
                  maxLength: {
                    value: 50,
                    message: 'Name cannot exceed 50 characters'
                  },
                  pattern: {
                    value: /^[a-zA-Z\s]+$/,
                    message: 'Name can only contain letters and spaces'
                  }
                })}
              />
              {errors.fullName && (
                <p className="form-error">{errors.fullName.message}</p>
              )}
            </div>

            {/* Roll Number */}
            <div>
              <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Roll Number *
              </label>
              <input
                id="rollNumber"
                type="text"
                className={`form-input ${errors.rollNumber ? 'form-input-error' : ''}`}
                placeholder="e.g., 20CS001"
                {...register('rollNumber', {
                  required: 'Roll number is required',
                  minLength: {
                    value: 3,
                    message: 'Roll number must be at least 3 characters'
                  },
                  maxLength: {
                    value: 20,
                    message: 'Roll number cannot exceed 20 characters'
                  },
                  pattern: {
                    value: /^[A-Z0-9]+$/i,
                    message: 'Roll number can only contain letters and numbers'
                  }
                })}
              />
              {errors.rollNumber && (
                <p className="form-error">{errors.rollNumber.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                placeholder="Enter your email address"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                id="phoneNumber"
                type="tel"
                className={`form-input ${errors.phoneNumber ? 'form-input-error' : ''}`}
                placeholder="Enter 10-digit phone number"
                {...register('phoneNumber', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Please enter a valid 10-digit phone number starting with 6-9'
                  }
                })}
              />
              {errors.phoneNumber && (
                <p className="form-error">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Class and Semester Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-2">
                  Class *
                </label>
                <input
                  id="class"
                  type="text"
                  className={`form-input ${errors.class ? 'form-input-error' : ''}`}
                  placeholder="e.g., B.Tech 2nd Year CSE"
                  {...register('class', {
                    required: 'Class is required',
                    minLength: {
                      value: 5,
                      message: 'Class must be at least 5 characters'
                    },
                    maxLength: {
                      value: 50,
                      message: 'Class cannot exceed 50 characters'
                    }
                  })}
                />
                {errors.class && (
                  <p className="form-error">{errors.class.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <select
                  id="semester"
                  className={`form-input ${errors.semester ? 'form-input-error' : ''}`}
                  {...register('semester', {
                    required: 'Semester is required',
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: 'Semester must be between 1 and 8'
                    },
                    max: {
                      value: 8,
                      message: 'Semester must be between 1 and 8'
                    }
                  })}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
                {errors.semester && (
                  <p className="form-error">{errors.semester.message}</p>
                )}
              </div>
            </div>

            {/* Branch */}
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                Branch *
              </label>
              <select
                id="branch"
                className={`form-input ${errors.branch ? 'form-input-error' : ''}`}
                {...register('branch', {
                  required: 'Branch is required'
                })}
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              {errors.branch && (
                <p className="form-error">{errors.branch.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input pr-10 ${errors.password ? 'form-input-error' : ''}`}
                  placeholder="Create a strong password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating Account...</span>
                </>
              ) : (
                <>
                  <span>🎓 Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Additional Options */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                🚀 Sign In Instead
              </Link>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">📋 Registration Requirements</h3>
            <ul className="text-xs text-blue-700 space-y-1 text-left">
              <li>• Use your official college email address</li>
              <li>• Enter your correct roll number as per college records</li>
              <li>• Password must contain uppercase, lowercase, and numbers</li>
              <li>• Phone number will be used for important notifications</li>
              <li>• All fields marked with * are mandatory</li>
            </ul>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link 
            to="/" 
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
