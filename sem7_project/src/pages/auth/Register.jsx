import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, MapPin, CreditCard, Upload, Calendar, Users, Shield, Briefcase } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Textarea } from '../../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('user');
  const { registerUser, registerAgent, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    if (!agreedToTerms) {
      return;
    }
    try {
      const userData = {
        name: data.name,
        email: data.email,
        mobileNo: data.mobileno,
        password: data.password,
        role: selectedRole,
        gender: data.gender,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        // Agent-specific fields
        age: selectedRole === 'agent' ? data.age : null,
        experience: selectedRole === 'agent' ? data.experience : null,
        specialization: selectedRole === 'agent' ? data.specialization : null,
        bio: selectedRole === 'agent' ? data.bio : null,
        licenseNumber: selectedRole === 'agent' ? data.license : null,
        // Admin-specific fields
        adminCode: selectedRole === 'admin' ? data.adminCode : null,
      };
      
      // Call the backend API
      const response = await fetch('http://localhost:5000/api/auth/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Navigate to OTP verification with user data
        navigate('/verify-otp', { 
          state: { 
            email: data.email,
            userId: result.userId,
            role: result.role
          } 
        });
      } else {
        alert(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const handleFileUpload = (event, fieldName) => {
    const file = event.target.files[0];
    if (file) {
      // In a real app, you would upload to a server and get a URL
      // For now, we'll create a local URL
      const fileUrl = URL.createObjectURL(file);
      setValue(fieldName, fileUrl);
    }
  };

  const nextStep = () => {
    if (selectedRole === 'agent' && step < 3) {
      setStep(step + 1);
    } else if (selectedRole !== 'agent' && step < 2) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const getTotalSteps = () => {
    return selectedRole === 'agent' ? 3 : 2;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
        <CardDescription>
          Choose your account type and join our platform
        </CardDescription>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mt-4">
          {[...Array(getTotalSteps())].map((_, index) => (
            <React.Fragment key={index}>
              <div className={`flex-1 h-2 rounded-full ${step >= index + 1 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              {index < getTotalSteps() - 1 && <div className="w-4"></div>}
            </React.Fragment>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Step 1: Basic Information & Role Selection */}
          {step === 1 && (
            <>
              {/* Role Selection */}
              <div className="space-y-2 mb-6">
                <Label>Select Account Type</Label>
                <RadioGroup value={selectedRole} onValueChange={setSelectedRole}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="user" id="user" />
                      <Label htmlFor="user" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <User className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium">User</p>
                            <p className="text-sm text-gray-500">Buy or rent properties</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="agent" id="agent" />
                      <Label htmlFor="agent" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium">Agent</p>
                            <p className="text-sm text-gray-500">List & manage properties</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="admin" id="admin" />
                      <Label htmlFor="admin" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium">Admin</p>
                            <p className="text-sm text-gray-500">Platform administrator</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      {...register('name', { required: 'Name is required' })}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {selectedRole === 'agent' && (
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="age"
                        type="number"
                        placeholder="25"
                        className="pl-10"
                        {...register('age', {
                          required: selectedRole === 'agent' ? 'Age is required' : false,
                          min: { value: 18, message: 'Must be at least 18 years old' },
                          max: { value: 100, message: 'Invalid age' },
                        })}
                      />
                    </div>
                    {errors.age && (
                      <p className="text-sm text-red-600">{errors.age.message}</p>
                    )}
                  </div>
                )}
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="mobileno">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="mobileno"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="pl-10"
                    {...register('mobileno', {
                      required: 'Mobile number is required',
                      pattern: {
                        value: /^[+]?[0-9]{10,15}$/,
                        message: 'Invalid mobile number',
                      },
                    })}
                  />
                </div>
                {errors.mobileno && (
                  <p className="text-sm text-red-600">{errors.mobileno.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={(value) => setValue('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      className="pl-10 pr-10"
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) =>
                          value === password || 'Passwords do not match',
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Admin specific fields */}
              {selectedRole === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="adminCode">Admin Access Code</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="adminCode"
                      type="password"
                      placeholder="Enter admin access code"
                      className="pl-10"
                      {...register('adminCode', {
                        required: selectedRole === 'admin' ? 'Admin access code is required' : false,
                      })}
                    />
                  </div>
                  {errors.adminCode && (
                    <p className="text-sm text-red-600">{errors.adminCode.message}</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Step 2: Additional Information (for all roles) */}
          {step === 2 && selectedRole !== 'agent' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="address"
                    placeholder="Enter your full address"
                    className="pl-10"
                    {...register('address')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Mumbai"
                    {...register('city')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    type="text"
                    placeholder="Maharashtra"
                    {...register('state')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  type="text"
                  placeholder="400001"
                  {...register('pincode')}
                />
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                />
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {!agreedToTerms && (
                <p className="text-sm text-red-600">You must agree to the terms to continue</p>
              )}
            </>
          )}

          {/* Step 2: Professional Information (Agent only) */}
          {step === 2 && selectedRole === 'agent' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="address">Office Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="address"
                    placeholder="Enter your office address"
                    className="pl-10"
                    {...register('address', { required: 'Address is required' })}
                  />
                </div>
                {errors.address && (
                  <p className="text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Mumbai"
                    {...register('city', { required: 'City is required' })}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    type="text"
                    placeholder="Maharashtra"
                    {...register('state', { required: 'State is required' })}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  placeholder="5"
                  {...register('experience', { required: 'Experience is required' })}
                />
                {errors.experience && (
                  <p className="text-sm text-red-600">{errors.experience.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Select onValueChange={(value) => setValue('specialization', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                    <SelectItem value="all">All Types</SelectItem>
                  </SelectContent>
                </Select>
                {errors.specialization && (
                  <p className="text-sm text-red-600">{errors.specialization.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your experience and expertise..."
                  {...register('bio')}
                />
              </div>
            </>
          )}

          {/* Step 3: Documents (Agent only) */}
          {step === 3 && selectedRole === 'agent' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="license"
                    type="text"
                    placeholder="RERA/12345/2024"
                    className="pl-10"
                    {...register('license', { required: 'License number is required' })}
                  />
                </div>
                {errors.license && (
                  <p className="text-sm text-red-600">{errors.license.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profilePic">Profile Picture</Label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Input
                      id="profilePic"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'profilePic')}
                      className="hidden"
                    />
                    <Label
                      htmlFor="profilePic"
                      className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Upload a professional photo (JPG, PNG, max 5MB)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documents">Upload Documents</Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'documents')}
                />
                <p className="text-sm text-gray-500">
                  Upload license, certifications, or other relevant documents
                </p>
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                />
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {!agreedToTerms && (
                <p className="text-sm text-red-600">You must agree to the terms to continue</p>
              )}
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
              >
                Previous
              </Button>
            )}
            
            {step < getTotalSteps() ? (
              <Button
                type="button"
                onClick={nextStep}
                className="ml-auto"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                className="ml-auto"
                disabled={isLoading || !agreedToTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-center text-sm text-gray-600 w-full">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default Register;
