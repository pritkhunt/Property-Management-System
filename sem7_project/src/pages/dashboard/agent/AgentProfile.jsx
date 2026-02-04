import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Building, CreditCard, Award, Loader2, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Textarea } from '../../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import useAuthStore from '../../../store/authStore';
import { agentAPI, authAPI, propertyAPI } from '../../../services/api';
import backendAPI from '../../../services/backendAPI';
import API_ENDPOINTS from '../../../config/apiEndpoints';
import toast from 'react-hot-toast';

const AgentProfile = () => {
  const { user, checkAuth } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const fileInputRef = useRef(null);
  const [agentProfile, setAgentProfile] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileData, setProfileData] = useState({
    Name: '',
    Email: '',
    MobileNo: '',
    Address: '',
    City: '',
    State: '',
    Age: '',
    Gender: '',
    BankName: '',
    BankAccountNo: '',
    IfscCode: '',
    ProfilePic: '',
    usercode: '',
    Status: ''
  });
  const [stats, setStats] = useState({
    totalProperties: 0,
    soldProperties: 0,
    activeListings: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchAgentProfile();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch agent's properties
      const propertiesResponse = await propertyAPI.getAgentProperties();
      const properties = propertiesResponse.data.data || [];
      
      // Fetch agent's transactions
      let transactions = [];
      try {
        const transactionsResponse = await backendAPI.get(API_ENDPOINTS.PAYMENT.AGENT_TRANSACTIONS);
        transactions = transactionsResponse.data.data || [];
      } catch (error) {
        console.error('❌ Error fetching transactions:', error);
      }

      // Calculate stats
      const activeProperties = properties.filter(p => p.Status === 'active');
      const soldProperties = properties.filter(p => p.Status === 'sold');
      
      // Calculate revenue from completed transactions
      const revenue = transactions
        .filter(t => t.Status === 'completed')
        .reduce((sum, t) => sum + (t.Amount || 0), 0);

      setStats({
        totalProperties: properties.length,
        soldProperties: soldProperties.length,
        activeListings: activeProperties.length,
        revenue: revenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAgentProfile = async () => {
    setIsLoading(true);
    try {
      const response = await agentAPI.getAgentProfile();
      if (response.data.success) {
        const data = response.data.data;
        setAgentProfile(data);
        setProfileData({
          Name: data.Name || '',
          Email: data.Email || '',
          MobileNo: data.MobileNo || '',
          Address: data.Address || '',
          City: data.City || '',
          State: data.State || '',
          Age: data.Age || '',
          Gender: data.Gender || '',
          BankName: data.BankName || '',
          BankAccountNo: data.BankAccountNo || '',
          IfscCode: data.IfscCode || '',
          ProfilePic: data.ProfilePic || '',
          usercode: data.usercode || '',
          Status: data.Status || ''
        });
        console.log('✅ Agent profile loaded:', data);
        console.log('✅ usercode (Agent ID):', data.usercode);
      }
    } catch (error) {
      console.error('Error fetching agent profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only send editable fields to the API
      // Exclude: Email, UserCode, Status, ProfilePic (these should never be updated via this form)
      const updateData = {
        Name: profileData.Name,
        MobileNo: profileData.MobileNo,
        Age: profileData.Age,
        Gender: profileData.Gender,
        City: profileData.City,
        State: profileData.State,
        Address: profileData.Address,
        BankName: profileData.BankName,
        BankAccountNo: profileData.BankAccountNo,
        IfscCode: profileData.IfscCode
      };

      const response = await agentAPI.updateAgentProfile(updateData);
      if (response.data.success) {
        setAgentProfile(response.data.data);
        setProfileData({
          Name: response.data.data.Name || '',
          Email: response.data.data.Email || '',
          MobileNo: response.data.data.MobileNo || '',
          Address: response.data.data.Address || '',
          City: response.data.data.City || '',
          State: response.data.data.State || '',
          Age: response.data.data.Age || '',
          Gender: response.data.data.Gender || '',
          BankName: response.data.data.BankName || '',
          BankAccountNo: response.data.data.BankAccountNo || '',
          IfscCode: response.data.data.IfscCode || '',
          ProfilePic: response.data.data.ProfilePic || '',
          usercode: response.data.data.usercode || '',
          Status: response.data.data.Status || ''
        });
        await checkAuth(); // Refresh auth store
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await agentAPI.uploadProfilePicture(formData);
      if (response.data.success) {
        setAgentProfile(response.data.data);
        setProfileData(prev => ({
          ...prev,
          ProfilePic: response.data.data.ProfilePic
        }));
        await checkAuth(); // Refresh auth store
        toast.success('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original data
    if (agentProfile) {
      setProfileData({
        Name: agentProfile.Name || '',
        Email: agentProfile.Email || '',
        MobileNo: agentProfile.MobileNo || '',
        Address: agentProfile.Address || '',
        City: agentProfile.City || '',
        State: agentProfile.State || '',
        Age: agentProfile.Age || '',
        Gender: agentProfile.Gender || '',
        BankName: agentProfile.BankName || '',
        BankAccountNo: agentProfile.BankAccountNo || '',
        IfscCode: agentProfile.IfscCode || '',
        ProfilePic: agentProfile.ProfilePic || '',
        usercode: agentProfile.usercode || '',
        Status: agentProfile.Status || ''
      });
    }
    setIsEditing(false);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
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
    
    setIsUpdatingPassword(true);
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
      setIsUpdatingPassword(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '₹0';
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getProfilePicUrl = (pic) => {
    if (!pic) return '';
    if (pic.startsWith('http')) return pic;
    if (pic.startsWith('/uploads')) return `http://localhost:5000${pic}`;
    return pic;
  };



  const statsData = [
    { label: 'Total Properties', value: stats.totalProperties, icon: Building },
    { label: 'Properties Sold', value: stats.soldProperties, icon: CreditCard },
    { label: 'Active Listings', value: stats.activeListings, icon: Building },
    { label: 'Total Revenue', value: formatPrice(stats.revenue), icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agent Profile</h1>
        <p className="text-gray-600 mt-2">Manage your professional profile and credentials</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Profile Information */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your agent profile details</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            ) : (
              <div className="space-x-2">
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
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
          {/* Profile Picture Section */}
          <div className="border-b pb-6">
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={getProfilePicUrl(profileData.ProfilePic)} 
                  alt={profileData.Name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
                <AvatarFallback className="text-2xl">
                  {profileData.Name?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg mb-1">{profileData.Name || 'Agent Name'}</h3>
                <p className="text-sm text-gray-600 mb-2">{profileData.Email}</p>
                {isEditing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Change Photo
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">Max size: 2MB (JPEG, PNG, GIF, WebP)</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Profile Fields Section */}
          <div>
            <h4 className="font-semibold text-base mb-4">
              Profile Details
              {!isEditing && <span className="ml-2 text-xs font-normal text-gray-500">(Read-only mode)</span>}
              {isEditing && <span className="ml-2 text-xs font-normal text-blue-600">(Editing mode)</span>}
            </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Name">Full Name</Label>
              <Input
                id="Name"
                name="Name"
                value={profileData.Name || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your full name"
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="Email">Email</Label>
              <Input
                id="Email"
                name="Email"
                type="email"
                value={profileData.Email || ''}
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
              <Label htmlFor="MobileNo">Mobile Number</Label>
              <Input
                id="MobileNo"
                name="MobileNo"
                value={profileData.MobileNo || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter mobile number"
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usercode">Agent ID</Label>
              <Input
                id="usercode"
                value={profileData.usercode || ''}
                disabled={true}
                readOnly={true}
                className="bg-gray-100 cursor-not-allowed font-mono"
                placeholder="Agent ID"
              />
              <p className="text-xs text-gray-500">
                🔒 Your unique agent identifier (Cannot be changed)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="Age">Age</Label>
              <Input
                id="Age"
                name="Age"
                type="number"
                value={profileData.Age || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter age"
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="Gender">Gender</Label>
              <Input
                id="Gender"
                name="Gender"
                value={profileData.Gender || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter gender"
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="City">City</Label>
              <Input
                id="City"
                name="City"
                value={profileData.City || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter city"
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="State">State</Label>
              <Input
                id="State"
                name="State"
                value={profileData.State || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter state"
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="Address">Address</Label>
              <Input
                id="Address"
                name="Address"
                value={profileData.Address || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter full address"
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Banking Information</CardTitle>
          <CardDescription>Your banking details for commission payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="BankName">Bank Name</Label>
              <Input
                id="BankName"
                name="BankName"
                value={profileData.BankName || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter bank name"
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="BankAccountNo">Account Number</Label>
              <Input
                id="BankAccountNo"
                name="BankAccountNo"
                value={profileData.BankAccountNo || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter account number"
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="IfscCode">IFSC Code</Label>
              <Input
                id="IfscCode"
                name="IfscCode"
                value={profileData.IfscCode || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter IFSC code"
                className={!isEditing ? 'bg-gray-50' : ''}
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
                  <Label htmlFor="currentPassword">
                    <Lock className="inline h-4 w-4 mr-1" />
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    <Lock className="inline h-4 w-4 mr-1" />
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    <Lock className="inline h-4 w-4 mr-1" />
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button onClick={handlePasswordUpdate} disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentProfile;
