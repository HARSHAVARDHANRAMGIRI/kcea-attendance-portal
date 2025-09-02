/**
 * OTP Verification Page - Email OTP Verification
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const { verifyOTP, resendOTP } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  const inputRefs = useRef([]);

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem('otpEmail');
    if (!storedEmail) {
      navigate('/login');
      return;
    }
    setEmail(storedEmail);

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6);
        if (digits.length === 6) {
          const newOtp = digits.split('');
          setOtp(newOtp);
          handleSubmit(digits);
        }
      });
    }
  };

  const handleSubmit = async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await verifyOTP({
        email,
        otpCode
      });

      if (result.success) {
        sessionStorage.removeItem('otpEmail');
        
        // Redirect based on user role
        const userRole = result.user.role;
        switch (userRole) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'faculty':
            navigate('/faculty/dashboard');
            break;
          case 'student':
          default:
            navigate('/dashboard');
            break;
        }
      } else {
        setAttempts(prev => prev + 1);
        
        if (result.code === 'INVALID_OTP') {
          toast.error(`Invalid OTP. ${result.remainingAttempts || 0} attempts remaining.`);
          
          // Clear OTP inputs
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
          
          // Check if max attempts reached
          if (attempts + 1 >= maxAttempts) {
            toast.error('Maximum attempts reached. Please request a new OTP.');
            setCanResend(true);
            setTimeLeft(0);
          }
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    
    try {
      const result = await resendOTP(email);
      
      if (result.success) {
        setTimeLeft(60);
        setCanResend(false);
        setAttempts(0);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Restart timer
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        toast.success('New OTP sent to your email');
      } else {
        if (result.remainingTime) {
          toast.error(`Please wait ${result.remainingTime} seconds before requesting another OTP`);
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskEmail = (email) => {
    const [username, domain] = email.split('@');
    const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
    return `${maskedUsername}@${domain}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">📧</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="mt-2 text-gray-600">
            We've sent a 6-digit code to
          </p>
          <p className="font-semibold text-blue-600">{maskEmail(email)}</p>
        </div>

        {/* OTP Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter 6-digit verification code
              </label>
              <div className="flex justify-center space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            {/* Timer and Resend */}
            <div className="text-center">
              {!canResend ? (
                <p className="text-sm text-gray-600">
                  Resend code in{' '}
                  <span className="font-semibold text-blue-600">
                    {formatTime(timeLeft)}
                  </span>
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Sending...</span>
                    </span>
                  ) : (
                    '🔄 Resend OTP'
                  )}
                </button>
              )}
            </div>

            {/* Attempts Warning */}
            {attempts > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 text-center">
                  ⚠️ {attempts} of {maxAttempts} attempts used
                </p>
              </div>
            )}

            {/* Manual Submit Button */}
            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || otp.some(digit => digit === '')}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Verifying...</span>
                </>
              ) : (
                '✅ Verify & Login'
              )}
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">📱 Tips</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Check your spam/junk folder if you don't see the email</li>
              <li>• The code expires in 60 seconds for security</li>
              <li>• You can paste the code directly into the first field</li>
              <li>• Maximum 3 attempts before requesting a new code</li>
            </ul>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <button 
            onClick={() => {
              sessionStorage.removeItem('otpEmail');
              navigate('/login');
            }}
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
