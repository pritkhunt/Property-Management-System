import React from 'react';
import { Link, Outlet, Navigate } from 'react-router-dom';
import { Building } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const AuthLayout = () => {
  const { isAuthenticated } = useAuthStore();

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex min-h-screen">
        {/* Left side - Image/Brand */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-blue-700 relative">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
            <Link to="/" className="flex items-center space-x-3 mb-8">
              <Building className="h-12 w-12 text-white" />
              <span className="text-4xl font-bold text-white">PropertyHub</span>
            </Link>
            <h2 className="text-3xl font-bold text-white text-center mb-4">
              Welcome to Your Dream Property Platform
            </h2>
            <p className="text-lg text-gray-200 text-center max-w-md">
              Discover, buy, sell, and rent properties with ease. Join thousands of satisfied users who found their perfect home with us.
            </p>
            <div className="grid grid-cols-2 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">10K+</div>
                <div className="text-gray-200">Properties Listed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white">5K+</div>
                <div className="text-gray-200">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white">1K+</div>
                <div className="text-gray-200">Verified Agents</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white">50+</div>
                <div className="text-gray-200">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
              <Building className="h-10 w-10 text-primary" />
              <span className="text-3xl font-bold text-gray-900">PropertyHub</span>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
