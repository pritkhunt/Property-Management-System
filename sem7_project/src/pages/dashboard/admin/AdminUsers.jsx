import React, { useState, useEffect } from 'react';
import { Users, Search, Edit, Trash2, Shield, Ban, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { userAPI } from '../../../services/api';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  // Generate avatar locally to avoid CORS issues
  const generateAvatar = (name, background = '8b5cf6') => {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="#${background}"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="80" fill="#fff" font-weight="bold">
          ${initials}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching users from database...');
      const response = await userAPI.getUsers();
      console.log('✅ Users fetched:', response.data);
      
      if (response.data && response.data.data) {
        // Transform backend data to frontend format
        const transformedUsers = response.data.data.map(user => {
          // Use Status field directly from database
          // If Status is empty or null, default to 'inactive'
          let status = user.Status ? user.Status.toLowerCase() : 'inactive';
          
          return {
            id: user.Id,
            name: user.Name,
            email: user.Email,
            mobileno: user.MobileNo || 'N/A',
            role: user.Role ? user.Role.toLowerCase() : 'user',
            status: status,
            registeredDate: user.CreatedAt,
            profilepic: (user.ProfilePic && !user.ProfilePic.includes('ui-avatars.com')) ? user.ProfilePic : generateAvatar(user.Name, '3b82f6'),
            lastLogin: user.LastLoginAt
          };
        });
        
        console.log('✅ Transformed users:', transformedUsers.length);
        setUsers(transformedUsers);
      } else {
        console.warn('⚠️ No users data in response');
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      console.error('Error details:', error.response?.data);
      // Don't logout on error - just show empty list
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteUser = (userId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await userAPI.deleteUser(userId);
          setUsers(prev => prev.filter(u => u.id !== userId));
          console.log('✅ User deleted successfully');
        } catch (error) {
          console.error('❌ Error deleting user:', error);
          alert('Failed to delete user');
        }
      }
    });
  };

  const handleSuspendUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const isSuspending = user.status !== 'suspended';
    
    setConfirmDialog({
      isOpen: true,
      title: isSuspending ? 'Suspend User' : 'Unsuspend User',
      message: isSuspending 
        ? `Are you sure you want to suspend ${user.name}? They will not be able to login until unsuspended.`
        : `Are you sure you want to unsuspend ${user.name}? They will be able to login again.`,
      variant: isSuspending ? 'warning' : 'info',
      onConfirm: async () => {
        try {
          console.log(`🔄 ${isSuspending ? 'Suspending' : 'Unsuspending'} user:`, userId);
          await userAPI.suspendUser(userId, isSuspending);
          
          // Update local state - when unsuspending, set to inactive (not active)
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, status: isSuspending ? 'suspended' : 'inactive' } : u
          ));
          
          console.log(`✅ User ${isSuspending ? 'suspended' : 'unsuspended'} successfully`);
        } catch (error) {
          console.error('❌ Error suspending user:', error);
          alert(`Failed to ${isSuspending ? 'suspend' : 'unsuspend'} user`);
        }
      }
    });
  };

  const filteredUsers = users.filter(user => {
    if (filters.search && !user.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !user.email.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.role && filters.role !== 'all' && user.role !== filters.role) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && user.status !== filters.status) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',           // Green
      inactive: 'secondary',        // Gray
      suspended: 'destructive',     // Red
    };
    const labels = {
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
    };
    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'default',
      agent: 'secondary',
      buyer: 'outline',
      seller: 'outline',
      user: 'outline',
    };
    const labels = {
      admin: 'Admin',
      agent: 'Agent',
      buyer: 'Buyer',
      seller: 'Seller',
      user: 'User',
    };
    return <Badge variant={variants[role] || 'outline'}>{labels[role] || role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <p className="text-gray-600 mt-2">View and manage all registered users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'inactive').length}</p>
              </div>
              <Users className="h-8 w-8 text-gray-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'suspended').length}</p>
              </div>
              <Ban className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={filters.role}
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>A list of all registered users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border rounded">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">User</th>
                    <th className="text-left p-4">Contact</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Joined</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.profilepic} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{user.mobileno}</p>
                      </td>
                      <td className="p-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{new Date(user.registeredDate).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" title="Edit User">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleSuspendUser(user.id)}
                            title={user.status === 'suspended' ? 'Unsuspend User' : 'Suspend User'}
                          >
                            {user.status === 'suspended' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Ban className="h-4 w-4 text-orange-500" />
                            )}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.variant === 'danger' ? 'Delete' : 'Confirm'}
        cancelText="Cancel"
      />
    </div>
  );
};

export default AdminUsers;
