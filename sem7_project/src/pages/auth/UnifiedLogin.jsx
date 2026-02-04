import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, User, Mail, Lock, Users, Shield, Building } from 'lucide-react';

const UnifiedLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    useOtp: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginResult, setLoginResult] = useState(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginResult(null);

    try {
      console.log('🔐 Attempting unified login with:', { 
        email: formData.email, 
        useOtp: formData.useOtp 
      });

      const response = await login(formData);
      
      console.log('✅ Login successful:', response);
      setLoginResult(response);

      // Navigate based on user type
      const userType = response.user?.userType || response.user?.role;
      console.log('🧭 Navigating based on userType:', userType);

      switch (userType) {
        case 'admin':
          toast.success('Welcome Admin! Redirecting to admin dashboard...');
          navigate('/admin');
          break;
        case 'agent':
          toast.success('Welcome Agent! Redirecting to agent dashboard...');
          navigate('/agent-dashboard');
          break;
        case 'user':
        case 'buyer':
        case 'seller':
          toast.success('Welcome! Redirecting to user dashboard...');
          navigate('/dashboard');
          break;
        default:
          toast.success('Login successful! Redirecting...');
          navigate('/dashboard');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      toast.error(errorMessage);
      setLoginResult({ error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access your dashboard - Users, Agents, or Admins
          </p>
        </div>

        {/* User Type Indicators */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Account Types:</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center space-x-1 text-blue-600">
              <User className="h-3 w-3" />
              <span>Users</span>
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <Building className="h-3 w-3" />
              <span>Agents</span>
            </div>
            <div className="flex items-center space-x-1 text-purple-600">
              <Shield className="h-3 w-3" />
              <span>Admins</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* OTP Option */}
            <div className="flex items-center">
              <input
                id="useOtp"
                name="useOtp"
                type="checkbox"
                checked={formData.useOtp}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useOtp" className="ml-2 block text-sm text-gray-700">
                Use OTP verification (optional)
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Login Result Display */}
          {loginResult && (
            <div className="mt-4 p-4 rounded-lg bg-gray-50 border">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Login Result:</h4>
              {loginResult.error ? (
                <div className="text-red-600 text-sm">
                  <strong>Error:</strong> {loginResult.error}
                </div>
              ) : (
                <div className="text-green-600 text-sm space-y-1">
                  <div><strong>Success:</strong> {loginResult.message}</div>
                  <div><strong>User Type:</strong> {loginResult.user?.userType || loginResult.user?.role}</div>
                  <div><strong>Table:</strong> {loginResult.user?.tableType}</div>
                  <div><strong>Name:</strong> {loginResult.user?.name || loginResult.user?.username}</div>
                </div>
              )}
            </div>
          )}

          {/* Registration Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?
            </p>
            <div className="flex justify-center space-x-4 text-sm">
              <Link
                to="/register-user"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Register as User
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                to="/register-agent"
                className="text-green-600 hover:text-green-500 font-medium"
              >
                Register as Agent
              </Link>
            </div>
          </div>
        </form>

        {/* Demo Credentials */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Demo Credentials:</h4>
          <div className="text-xs text-yellow-700 space-y-1">
            <div><strong>Admin:</strong> admin@propertymanagement.com / admin123</div>
            <div><strong>Note:</strong> Register as User or Agent to create other account types</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;
