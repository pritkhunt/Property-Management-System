import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, MapPin, CreditCard, Upload, Calendar, Users } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Textarea } from '../../components/ui/textarea';

const AgentRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    adharCardFront: null,
    panCard: null,
  });
  const { registerAgent, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }
    try {
      // Prepare agent data with proper field names for backend
      const agentData = {
        Name: data.name,
        Email: data.email,
        MobileNo: data.mobileno,
        Password: data.password,
        Age: data.age,
        Gender: data.gender,
        City: data.city,
        State: data.state,
        Address: data.address,
        BankName: data.bankname,
        BankAccountNo: data.bankaccountno,
        IfscCode: data.ifsccode,
        AdharCardFront: uploadedFiles.adharCardFront,  // Actual File object
        PanCard: uploadedFiles.panCard,  // Actual File object or PAN number as string
      };
      
      await registerAgent(agentData);
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (error) {
      console.error('Agent registration failed:', error);
    }
  };

  const handleFileUpload = (event, fieldName) => {
    const file = event.target.files[0];
    if (file) {
      // Store the actual File object for upload
      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: file
      }));
      
      // Create preview URL for display
      const fileUrl = URL.createObjectURL(file);
      setValue(fieldName, fileUrl);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold">Agent Registration</CardTitle>
          <CardDescription>
            Join our network of professional property agents. Please fill in all required information below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Section 1: Personal Information */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                <p className="text-sm text-gray-500 mt-1">Please provide your basic personal details</p>
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
                        max: { value: 100, message: 'Invalid age' },
                      })}
                    />
                  </div>
                  {errors.age && (
                    <p className="text-sm text-red-600">{errors.age.message}</p>
                  )}
                </div>
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
                <Select onValueChange={(value) => setValue('gender', value, { shouldValidate: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type="hidden"
                  {...register('gender', { required: 'Gender is required' })}
                />
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
            </div>

            {/* Section 2: Address & Banking Information */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-xl font-semibold text-gray-900">Address & Banking Information</h3>
                <p className="text-sm text-gray-500 mt-1">Provide your address and bank details for transactions</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your complete address"
                  rows={3}
                  {...register('address', { required: 'Address is required' })}
                />
                {errors.address && (
                  <p className="text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="city"
                      type="text"
                      placeholder="Mumbai"
                      className="pl-10"
                      {...register('city', { required: 'City is required' })}
                    />
                  </div>
                  {errors.city && (
                    <p className="text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="state"
                      type="text"
                      placeholder="Maharashtra"
                      className="pl-10"
                      {...register('state', { required: 'State is required' })}
                    />
                  </div>
                  {errors.state && (
                    <p className="text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankname">Bank Name</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="bankname"
                    type="text"
                    placeholder="State Bank of India"
                    className="pl-10"
                    {...register('bankname', { required: 'Bank name is required' })}
                  />
                </div>
                {errors.bankname && (
                  <p className="text-sm text-red-600">{errors.bankname.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankaccountno">Bank Account Number</Label>
                  <Input
                    id="bankaccountno"
                    type="text"
                    placeholder="XXXXXXXXXXXX"
                    {...register('bankaccountno', {
                      required: 'Account number is required',
                      pattern: {
                        value: /^[0-9]{9,18}$/,
                        message: 'Invalid account number',
                      },
                    })}
                  />
                  {errors.bankaccountno && (
                    <p className="text-sm text-red-600">{errors.bankaccountno.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifsccode">IFSC Code</Label>
                  <Input
                    id="ifsccode"
                    type="text"
                    placeholder="SBIN0001234"
                    {...register('ifsccode', {
                      required: 'IFSC code is required',
                      pattern: {
                        value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                        message: 'Invalid IFSC code',
                      },
                    })}
                  />
                  {errors.ifsccode && (
                    <p className="text-sm text-red-600">{errors.ifsccode.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Documents & Verification */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-xl font-semibold text-gray-900">Documents & Verification</h3>
                <p className="text-sm text-gray-500 mt-1">Upload required documents and accept terms</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profilepic">Profile Picture</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="profilepic"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'profilepic')}
                      className="hidden"
                    />
                    <Label
                      htmlFor="profilepic"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">Upload Profile Picture</span>
                      </div>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adharcardfront">Aadhaar Card (Front)</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="adharcardfront"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'adharCardFront')}
                      className="hidden"
                    />
                    <Label
                      htmlFor="adharcardfront"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">
                          {uploadedFiles.adharCardFront 
                            ? uploadedFiles.adharCardFront.name 
                            : 'Upload Aadhaar Front'}
                        </span>
                      </div>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pancard">PAN Card</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="pancard"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'panCard')}
                      className="hidden"
                    />
                    <Label
                      htmlFor="pancard"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">
                          {uploadedFiles.panCard 
                            ? uploadedFiles.panCard.name 
                            : 'Upload PAN Card'}
                        </span>
                      </div>
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">Upload image or PDF of your PAN card</p>
                </div>

                <div className="flex items-center space-x-2">
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
                      Agent Terms & Conditions
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
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isLoading || !agreedToTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register as Agent'
                )}
              </Button>
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
            <Link to="/register" className="font-medium text-primary hover:underline">
              Register as User
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AgentRegister;
