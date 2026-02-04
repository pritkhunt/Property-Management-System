import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Loader2, RefreshCw } from 'lucide-react';
import { authAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

const OtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const userType = location.state?.userType;
  const isPasswordReset = location.state?.isPasswordReset; // Check if this is password reset flow
  const { login } = useAuthStore();

  const getDashboardRoute = (type) => {
    switch (type) {
      case 'admin':
        return '/admin';
      case 'agent':
        return '/agent-dashboard';
      case 'user':
      case 'buyer':
      case 'seller':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      if (/[0-9]/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }
    
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Verifying OTP for:', email);
      
      const requestData = { 
        Email: email, 
        Otp: otpCode 
      };
      
      const response = await authAPI.verifyOtp(requestData);
      console.log('✅ OTP Verification Response:', response.data);
      
      if (response.data.success) {
        console.log('✅ OTP verification successful');
        
        if (isPasswordReset) {
          // Password reset flow - redirect to reset password page
          toast.success('OTP verified! Please enter your new password.');
          console.log('🧭 Redirecting to reset password page');
          navigate('/reset-password', { state: { email } });
        } else {
          // Normal registration flow - redirect to login
          toast.success(response.data.message || 'OTP verified successfully! You can now login.');
          console.log('🧭 Redirecting to login page');
          navigate('/login');
        }
      } else {
        console.error('❌ Verification failed:', response.data);
        toast.error(response.data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'OTP verification failed. Please try again.';
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) {
      console.log('❌ Cannot resend - timer still active:', resendTimer);
      return;
    }

    if (!email) {
      console.error('❌ Cannot resend - no email provided');
      toast.error('Email is missing. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📧 Resending OTP to:', email);
      console.log('   Flow:', isPasswordReset ? 'Password Reset' : 'Registration');
      
      const response = await authAPI.sendOtp(email);
      console.log('✅ Resend OTP Response:', response.data);
      
      // Show OTP if available in response (development mode)
      const otpMessage = response.data.otp 
        ? `OTP sent! Code: ${response.data.otp}` 
        : 'OTP sent successfully! Check your email or backend console.';
      
      toast.success(otpMessage);
      
      // Reset form
      setResendTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus(); // Focus first input
      
      // Restart timer
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('❌ Resend OTP Error:', error);
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message);
      console.error('   Full Error:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resend OTP. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-10 w-10 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to <br />
          <span className="font-semibold text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label className="text-center block mb-4">Enter verification code</Label>
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-lg font-semibold"
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              variant="link"
              onClick={handleResend}
              disabled={!canResend || isLoading}
              className="text-primary hover:text-primary/80"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </div>
              ) : canResend ? (
                <div className="flex items-center">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend OTP
                </div>
              ) : (
                `Resend in ${resendTimer}s`
              )}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-center text-xs text-muted-foreground w-full">
          By verifying, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardFooter>
    </Card>
  );
};

export default OtpVerification;
