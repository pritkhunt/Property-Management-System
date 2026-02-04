import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Loader2, ShoppingBag, Store, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import useAuthStore from '../../../store/authStore';
import { authAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { user, updateProfile, uploadProfilePicture } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.Name || user?.name || '',
    email: user?.Email || user?.email || '',
    mobileno: user?.MobileNo || user?.mobileno || '',
    address: user?.Address || user?.address || '',
    city: user?.City || user?.city || '',
    state: user?.State || user?.state || '',
    bio: user?.Bio || user?.bio || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    propertyType: user?.preferences?.propertyType || '',
    budget: user?.preferences?.budget || '',
    location: user?.preferences?.location || '',
    notifications: {
      email: true,
      sms: true,
      push: true,
    },
  });

  // Update form data when user data loads or changes
  useEffect(() => {
    if (user) {
      console.log('🔄 Refreshing form with user data:', user);
      setFormData({
        name: user?.Name || user?.name || '',
        email: user?.Email || user?.email || '',
        mobileno: user?.MobileNo || user?.mobileno || '',
        address: user?.Address || user?.address || '',  // Try capital first
        city: user?.City || user?.city || '',            // Try capital first
        state: user?.State || user?.state || '',         // Try capital first
        bio: user?.Bio || user?.bio || '',               // Try capital first
      });
      console.log('✅ Form data refreshed');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Updating profile with data:', formData);
      
      await updateProfile(formData);
      
      setIsEditing(false);
      console.log('✅ Profile update completed - No redirect!');
      
      // Success toast already shown by authStore
      // User remains on dashboard - authentication maintained
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      // Error toast already shown by authStore
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    // Validate all fields are filled
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    // Validate new password length
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Prevent same password
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔐 Updating password...');
      
      const response = await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      console.log('✅ Password update response:', response.data);
      
      toast.success('Password updated successfully!');
      
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('❌ Password update error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update password';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setIsLoading(true);
    try {
      // API call to update preferences
      toast.success('Preferences updated successfully!');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }

      setIsLoading(true);
      try {
        console.log('🖼️ Starting profile picture upload...');
        await uploadProfilePicture(file);
        // Success toast is shown by authStore
        console.log('✅ Profile picture upload completed');
      } catch (error) {
        console.error('❌ Failed to upload profile picture:', error);
        // Error toast is shown by authStore
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Profile</h1>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and contact information</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleProfileUpdate} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="relative group">
                  <Avatar className="h-32 w-32 ring-4 ring-white shadow-lg">
                    <AvatarImage 
                      src={(() => {
                        const profilePic = user?.ProfilePic || user?.profilepic;
                        const imageUrl = profilePic?.startsWith('http') 
                          ? profilePic
                          : profilePic?.startsWith('/uploads')
                          ? `http://localhost:5000${profilePic}`
                          : profilePic;
                        console.log('🖼️ Profile Avatar URL:', imageUrl);
                        return imageUrl;
                      })()}
                      alt={user?.Name || user?.name}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onLoad={() => console.log('✅ Profile avatar image loaded successfully')}
                      onError={(e) => console.error('❌ Profile avatar image failed to load:', e.target.src)}
                    />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white" delayMs={600}>
                      {(user?.Name || user?.name)?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900">{user?.Name || user?.name}</h2>
                  <p className="text-gray-600 mt-1">{user?.Email || user?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                    {user?.Role === 'both' ? (
                      <>
                        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          Buyer
                        </Badge>
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          <Store className="h-3 w-3 mr-1" />
                          Seller
                        </Badge>
                      </>
                    ) : user?.Role === 'buyer' ? (
                      <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        Buyer
                      </Badge>
                    ) : user?.Role === 'seller' ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <Store className="h-3 w-3 mr-1" />
                        Seller
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {user?.Role || 'User'}
                      </Badge>
                    )}
                  </div>
                  {isEditing && (
                  <div className="mt-4">
                    <Input
                      id="profilepic"
                      type="file"
                        accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Label htmlFor="profilepic">
                        <Button variant="outline" size="sm" asChild className="cursor-pointer">
                        <span>
                              <Camera className="mr-2 h-4 w-4" />
                              Change Profile Picture
                        </span>
                      </Button>
                    </Label>
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF (Max 2MB)</p>
                  </div>
                  )}
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      <User className="inline h-4 w-4 mr-1" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled={true}
                      readOnly={true}
                      className="bg-gray-100 cursor-not-allowed"
                      placeholder="your.email@example.com"
                    />
                    <p className="text-xs text-gray-500">
                      🔒 Email cannot be changed (Identity field)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usercode" className="text-sm font-medium text-gray-700">
                      <User className="inline h-4 w-4 mr-1" />
                      User ID
                    </Label>
                    <Input
                      id="usercode"
                      name="usercode"
                      value={user?.usercode || 'Not assigned'}
                      disabled={true}
                      readOnly={true}
                      className="bg-gray-100 cursor-not-allowed font-mono"
                      placeholder="User ID"
                    />
                    <p className="text-xs text-gray-500">
                      🔒 Your unique user identifier (Cannot be changed)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobileno" className="text-sm font-medium text-gray-700">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Mobile Number
                    </Label>
                    <Input
                      id="mobileno"
                      name="mobileno"
                      type="tel"
                      value={formData.mobileno}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      placeholder="Your city"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      placeholder="Your state"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      placeholder="Your full address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium text-gray-700">About Me</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={4}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself, your interests, and what you're looking for..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <Button onClick={handlePasswordUpdate} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Property Preferences</CardTitle>
              <CardDescription>
                {user?.Role === 'both' 
                  ? 'Set your preferences for buying and selling properties'
                  : 'Set your property search preferences and notification settings'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Buyer Preferences */}
              {(user?.Role === 'buyer' || user?.Role === 'both') && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Buyer Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Preferred Property Type (Buying)</Label>
                      <select
                        className="w-full p-2 border rounded-md bg-white"
                        value={preferences.propertyType}
                        onChange={(e) => handlePreferenceChange('propertyType', e.target.value)}
                      >
                        <option value="">Select property type</option>
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="villa">Villa</option>
                        <option value="commercial">Commercial</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Budget Range</Label>
                      <select
                        className="w-full p-2 border rounded-md bg-white"
                        value={preferences.budget}
                        onChange={(e) => handlePreferenceChange('budget', e.target.value)}
                      >
                        <option value="">Select budget</option>
                        <option value="0-50L">Under ₹50 Lakhs</option>
                        <option value="50L-1Cr">₹50 Lakhs - ₹1 Crore</option>
                        <option value="1Cr-2Cr">₹1 Crore - ₹2 Crores</option>
                        <option value="2Cr+">Above ₹2 Crores</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Preferred Locations (Buying)</Label>
                      <Input
                        value={preferences.location}
                        onChange={(e) => handlePreferenceChange('location', e.target.value)}
                        placeholder="e.g., Mumbai, Pune, Bangalore"
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Seller Preferences */}
              {(user?.Role === 'seller' || user?.Role === 'both') && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 flex items-center">
                    <Store className="h-5 w-5 mr-2" />
                    Seller Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Property Listing Type</Label>
                      <select
                        className="w-full p-2 border rounded-md bg-white"
                        defaultValue=""
                      >
                        <option value="">Select listing type</option>
                        <option value="rent">For Rent</option>
                        <option value="sale">For Sale</option>
                        <option value="both">Both Rent & Sale</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Expected Price Range</Label>
                      <Input
                        placeholder="e.g., ₹50 Lakhs - ₹1 Crore"
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Property Location (Selling)</Label>
                      <Input
                        placeholder="Where is your property located?"
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notif">Email Notifications</Label>
                    <input
                      id="email-notif"
                      type="checkbox"
                      checked={preferences.notifications.email}
                      onChange={(e) => handlePreferenceChange('notifications', {
                        ...preferences.notifications,
                        email: e.target.checked,
                      })}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-notif">SMS Notifications</Label>
                    <input
                      id="sms-notif"
                      type="checkbox"
                      checked={preferences.notifications.sms}
                      onChange={(e) => handlePreferenceChange('notifications', {
                        ...preferences.notifications,
                        sms: e.target.checked,
                      })}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notif">Push Notifications</Label>
                    <input
                      id="push-notif"
                      type="checkbox"
                      checked={preferences.notifications.push}
                      onChange={(e) => handlePreferenceChange('notifications', {
                        ...preferences.notifications,
                        push: e.target.checked,
                      })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handlePreferencesUpdate} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
