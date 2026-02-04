import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, ShoppingBag, Store, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import toast from 'react-hot-toast';

const RegisterUser = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: 'buyer'
    }
  });

  const onSubmit = async (data) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Name: data.name,
          Email: data.email,
          MobileNo: data.mobileNo,
          Password: data.password,
          Role: data.role
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Registration successful! Check your email for OTP.');
        setError('');
        // Navigate to OTP verification
        navigate('/otp-verification', {
          state: {
            email: data.email,
            userId: result.userId,
            userType: 'user'
          }
        });
      } else {
        const errorMessage = result.message || 'Registration failed';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = 'Failed to register. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Register as User</CardTitle>
          <CardDescription className="text-center">
            Create your account to start buying, selling, or both
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>I want to</Label>
              <RadioGroup defaultValue="buyer" onValueChange={(value) => setValue('role', value)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <RadioGroupItem value="buyer" id="buyer" />
                  <Label htmlFor="buyer" className="flex items-center cursor-pointer flex-1">
                    <ShoppingBag className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">Buy Properties</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                  <RadioGroupItem value="seller" id="seller" />
                  <Label htmlFor="seller" className="flex items-center cursor-pointer flex-1">
                    <Store className="h-4 w-4 mr-2 text-green-600" />
                    <span className="font-medium">Sell Properties</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="flex items-center cursor-pointer flex-1">
                    <RefreshCw className="h-4 w-4 mr-2 text-purple-600" />
                    <span className="font-medium">Both (Buy & Sell)</span>
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-gray-500 mt-1">
                Select "Both" if you want to buy and sell properties
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  {...register('name', {
                    required: 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                  })}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-10"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="mobileNo">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="mobileNo"
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="pl-10"
                  {...register('mobileNo', {
                    required: 'Mobile number is required',
                    pattern: {
                      value: /^[+]?[0-9]{10,15}$/,
                      message: 'Invalid mobile number',
                    },
                  })}
                />
              </div>
              {errors.mobileNo && (
                <p className="text-sm text-red-600">{errors.mobileNo.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  className="pl-10 pr-10"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-gray-600 w-full">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
            {' '}or{' '}
            <Link to="/register-agent" className="font-medium text-primary hover:underline">
              Register as Agent
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterUser;
