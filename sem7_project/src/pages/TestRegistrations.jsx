import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { User, Briefcase, RefreshCw } from 'lucide-react';

const TestRegistrations = () => {
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
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
      setLoadingUsers(false);
    }
  };

  const fetchAgents = async () => {
    setLoadingAgents(true);
    setError(null);
    try {
      const response = await fetch('https://localhost:7073/api/auth/agents');
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.agents);
      } else {
        setError(data.message || 'Failed to fetch agents');
      }
    } catch (err) {
      setError('Error connecting to backend: ' + err.message);
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAgents();
  }, []);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'buyer':
        return 'default';
      case 'seller':
        return 'secondary';
      case 'agent':
        return 'outline';
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
      case 'inactive':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Registered Users & Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Users ({users.length})
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Agents ({agents.length})
              </TabsTrigger>
            </TabsList>
            
            {/* Users Tab */}
            <TabsContent value="users" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Registered Users</h3>
                <Button onClick={fetchUsers} disabled={loadingUsers} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No users registered yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3">ID</th>
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Mobile</th>
                        <th className="text-left p-3">Role</th>
                        <th className="text-left p-3">Login Status</th>
                        <th className="text-left p-3">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{user.id}</td>
                          <td className="p-3 font-medium">{user.name}</td>
                          <td className="p-3">{user.email}</td>
                          <td className="p-3">{user.mobileNo}</td>
                          <td className="p-3">
                            <Badge variant={getRoleBadgeColor(user.role)}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {user.isLogin ? (
                              <Badge variant="success">Online</Badge>
                            ) : (
                              <Badge variant="outline">Offline</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            {/* Agents Tab */}
            <TabsContent value="agents" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Registered Agents</h3>
                <Button onClick={fetchAgents} disabled={loadingAgents} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingAgents ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {agents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No agents registered yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3">ID</th>
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Mobile</th>
                        <th className="text-left p-3">Age</th>
                        <th className="text-left p-3">Gender</th>
                        <th className="text-left p-3">City</th>
                        <th className="text-left p-3">State</th>
                        <th className="text-left p-3">Bank</th>
                        <th className="text-left p-3">Account No</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((agent) => (
                        <tr key={agent.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{agent.id}</td>
                          <td className="p-3 font-medium">{agent.name}</td>
                          <td className="p-3">{agent.email}</td>
                          <td className="p-3">{agent.mobileNo}</td>
                          <td className="p-3">{agent.age}</td>
                          <td className="p-3">{agent.gender}</td>
                          <td className="p-3">{agent.city}</td>
                          <td className="p-3">{agent.state}</td>
                          <td className="p-3">{agent.bankName}</td>
                          <td className="p-3">{agent.bankAccountNo}</td>
                          <td className="p-3">
                            <Badge variant={getStatusBadgeColor(agent.status)}>
                              {agent.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {agent.date ? new Date(agent.date).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="max-w-7xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>Registration System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Two Separate Registration Systems:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  User Registration
                </h4>
                <ul className="text-sm space-y-1">
                  <li>• For Buyers and Sellers</li>
                  <li>• Simple registration form</li>
                  <li>• Basic information required</li>
                  <li>• Access: <a href="/register-user" className="text-blue-600 hover:underline">/register-user</a></li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Agent Registration
                </h4>
                <ul className="text-sm space-y-1">
                  <li>• For Property Agents</li>
                  <li>• 3-step registration process</li>
                  <li>• Banking details required</li>
                  <li>• Document upload support</li>
                  <li>• Access: <a href="/register-agent" className="text-blue-600 hover:underline">/register-agent</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">API Endpoints:</h3>
            <div className="bg-gray-100 p-3 rounded space-y-1 font-mono text-sm">
              <p>POST /api/auth/register-user - Register new user</p>
              <p>POST /api/auth/register-agent - Register new agent</p>
              <p>GET /api/auth/users - Get all users</p>
              <p>GET /api/auth/agents - Get all agents</p>
              <p>POST /api/auth/verify-otp - Verify OTP for both</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Database Tables:</h3>
            <p className="text-sm">
              The system maintains two separate tables:
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li><strong>Users Table:</strong> Stores buyers and sellers with basic information</li>
              <li><strong>Agents Table:</strong> Stores agents with detailed professional and banking information</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestRegistrations;
