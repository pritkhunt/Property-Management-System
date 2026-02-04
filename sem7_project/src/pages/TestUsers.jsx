import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const TestUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://localhost:7073/api/auth/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Error connecting to backend: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'agent':
        return 'default';
      case 'user':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Registered Users</CardTitle>
          <div className="flex gap-2">
            <Button onClick={fetchUsers} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {users.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No users registered yet
            </div>
          )}
          
          {users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Mobile</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Gender</th>
                    <th className="text-left p-2">City</th>
                    <th className="text-left p-2">State</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{user.id}</td>
                      <td className="p-2 font-medium">{user.name}</td>
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">{user.mobileNo}</td>
                      <td className="p-2">
                        <Badge variant={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant={getStatusBadgeColor(user.status)}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-2">{user.gender || '-'}</td>
                      <td className="p-2">{user.city || '-'}</td>
                      <td className="p-2">{user.state || '-'}</td>
                      <td className="p-2">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-600">
            Total Users: <strong>{users.length}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="max-w-6xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">To Register a New User:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to <a href="/register" className="text-blue-600 hover:underline">/register</a></li>
              <li>Select account type (User, Agent, or Admin)</li>
              <li>Fill in the registration form</li>
              <li>For Admin role, use access code: <code className="bg-gray-100 px-2 py-1 rounded">ADMIN2024</code></li>
              <li>Complete OTP verification</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">API Endpoints:</h3>
            <ul className="space-y-1 text-sm font-mono">
              <li className="bg-gray-100 p-2 rounded">POST /api/auth/register - Register new user</li>
              <li className="bg-gray-100 p-2 rounded">GET /api/auth/users - Get all users</li>
              <li className="bg-gray-100 p-2 rounded">GET /api/auth/users/{'<id>'} - Get user by ID</li>
              <li className="bg-gray-100 p-2 rounded">POST /api/auth/verify-otp - Verify OTP</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Backend Configuration:</h3>
            <p className="text-sm">The backend stores user data in memory. In production, this should be connected to a database.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestUsers;
