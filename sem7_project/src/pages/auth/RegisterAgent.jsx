import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, MapPin, Calendar, CreditCard, Building, Upload, FileText, Briefcase } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import toast from 'react-hot-toast';

const RegisterAgent = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Name: data.name,
          Email: data.email,
          MobileNo: data.mobileNo,
          Password: data.password,
          Age: parseInt(data.age),
          Gender: data.gender,
          City: data.city,
          State: data.state,
          Address: data.address,
          BankName: data.bankName,
          BankAccountNo: data.bankAccountNo,
          IfscCode: data.ifscCode,
          AdharCardFront: data.adharCardFront || '',
          PanCard: data.panCard || ''
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Agent registration successful! Check your email for OTP.');
        setError('');
        // Navigate to OTP verification
        navigate('/otp-verification', {
          state: {
            email: data.email,
            agentId: result.agentId,
            userType: 'agent'
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

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFileUpload = (event, fieldName) => {
    const file = event.target.files[0];
    if (file) {
      // In production, upload to server and get URL
      const fileUrl = URL.createObjectURL(file);
      setValue(fieldName, fileUrl);
      toast.success(`${fieldName} uploaded successfully`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Register as Agent</CardTitle>
          <CardDescription className="text-center">
            Join our network of professional property agents
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between mt-4">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className="w-4"></div>
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className="w-4"></div>
            <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                
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
                          required: 'Age is required',
                          min: { value: 18, message: 'Must be at least 18 years old' },
                        })}
                      />
                    </div>
                    {errors.age && (
                      <p className="text-sm text-red-600">{errors.age.message}</p>
                    )}
                  </div>
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
              </>
            )}

            {/* Step 2: Address Information */}
            {step === 2 && (
              <>
                <h3 className="text-lg font-semibold mb-4">Address Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="address"
                      placeholder="Enter your full address"
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
              </>
            )}

            {/* Step 3: Banking & Documents */}
            {step === 3 && (
              <>
                <h3 className="text-lg font-semibold mb-4">Banking & Documents</h3>

                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="bankName"
                      type="text"
                      placeholder="State Bank of India"
                      className="pl-10"
                      {...register('bankName', { required: 'Bank name is required' })}
                    />
                  </div>
                  {errors.bankName && (
                    <p className="text-sm text-red-600">{errors.bankName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNo">Account Number</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="bankAccountNo"
                        type="text"
                        placeholder="1234567890"
                        className="pl-10"
                        {...register('bankAccountNo', { required: 'Account number is required' })}
                      />
                    </div>
                    {errors.bankAccountNo && (
                      <p className="text-sm text-red-600">{errors.bankAccountNo.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      type="text"
                      placeholder="SBIN0001234"
                      {...register('ifscCode', { required: 'IFSC code is required' })}
                    />
                    {errors.ifscCode && (
                      <p className="text-sm text-red-600">{errors.ifscCode.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adharCardFront">Aadhaar Card Front (Optional)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="adharCardFront"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'adharCardFront')}
                    />
                    <Upload className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panCard">PAN Card (Optional)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="panCard"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'panCard')}
                    />
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
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
              
              {step < 3 ? (
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
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Complete Registration'
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
            {' '}or{' '}
            <Link to="/register-user" className="font-medium text-primary hover:underline">
              Register as User
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterAgent;
