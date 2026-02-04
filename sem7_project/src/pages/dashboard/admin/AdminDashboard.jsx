import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building, CreditCard, TrendingUp, Shield, AlertCircle, BarChart3, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import useAuthStore from '../../../store/authStore';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalProperties: 0,
    totalTransactions: 0,
    revenue: 0,
    pendingApprovals: 0,
    activeUsers: 0,
    newRegistrations: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    server: { status: 'operational', message: 'Loading...', uptime: '0h' },
    database: { status: 'operational', message: 'Loading...', responseTime: '0ms', uptime: '0%' },
    api: { status: 'optimal', message: 'Loading...', responseTime: '0ms' }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching real dashboard data from API...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch dashboard statistics
      const statsResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!statsResponse.ok) {
        throw new Error(`Stats API failed: ${statsResponse.status} ${statsResponse.statusText}`);
      }
      
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        console.log('✅ Dashboard stats loaded:', statsData.data);
        setStats(statsData.data);
      } else {
        console.error('❌ Failed to load dashboard stats:', statsData.message);
        throw new Error(statsData.message || 'Failed to load dashboard stats');
      }

      // Fetch recent activities
      const activitiesResponse = await fetch('http://localhost:5000/api/dashboard/activities', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!activitiesResponse.ok) {
        console.warn('⚠️ Activities API failed, using empty list');
        setRecentActivities([]);
      } else {
        const activitiesData = await activitiesResponse.json();
        
        if (activitiesData.success && activitiesData.data.length > 0) {
          console.log('✅ Recent activities loaded:', activitiesData.data);
          setRecentActivities(activitiesData.data);
        } else {
          console.log('📝 No recent activities');
          setRecentActivities([]);
        }
      }

      // Fetch system health
      const healthResponse = await fetch('http://localhost:5000/api/dashboard/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        if (healthData.success) {
          console.log('✅ System health loaded:', healthData.data);
          setSystemHealth(healthData.data);
        }
      } else {
        console.warn('⚠️ System health API failed');
      }
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      
      // Show error message to user
      if (error.message.includes('CORS') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        console.error('🚫 Network error - check if backend is running on http://localhost:5000');
      }
      
      // Fallback to empty data but show that it's an error state
      setStats({
        totalUsers: 0,
        totalAgents: 0,
        totalProperties: 0,
        totalTransactions: 0,
        revenue: 0,
        pendingApprovals: 0,
        activeUsers: 0,
        newRegistrations: 0,
        error: true,
        errorMessage: error.message
      });
      setRecentActivities([{
        id: 'error',
        type: 'alert',
        message: `Failed to load dashboard data: ${error.message}`,
        time: 'Just now',
        status: 'warning'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const mockActivities = [
    { id: 1, type: 'user', message: 'New user registered: John Doe', time: '5 minutes ago', status: 'new' },
    { id: 2, type: 'agent', message: 'Agent verification pending: Sarah Smith', time: '1 hour ago', status: 'pending' },
    { id: 3, type: 'property', message: 'New property listed: 3BHK in Mumbai', time: '2 hours ago', status: 'new' },
    { id: 4, type: 'transaction', message: 'Payment received: ₹50,000', time: '3 hours ago', status: 'completed' },
    { id: 5, type: 'alert', message: 'Suspicious activity detected', time: '5 hours ago', status: 'warning' },
  ];

  const formatAmount = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user': return Users;
      case 'agent': return Shield;
      case 'property': return Building;
      case 'transaction': return CreditCard;
      case 'alert': return AlertCircle;
      default: return Activity;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      new: 'default',
      pending: 'secondary',
      completed: 'default',
      warning: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-purple-100">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-purple-100">Welcome back, {user?.name || user?.username}! Real-time system overview.</p>
        <div className="mt-2 text-sm text-purple-200">
          {stats.error ? (
            <div className="bg-red-500/20 border border-red-400 rounded px-3 py-2">
              ⚠️ Error loading data: {stats.errorMessage}
            </div>
          ) : (
            <div>📊 Data loaded from: Users ({stats.totalUsers}), Agents ({stats.totalAgents}), Admins ({stats.totalAdmins})</div>
          )}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newRegistrations} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingApprovals} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Active listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.revenue)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system events and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map(activity => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.time}</span>
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/admin/reports">View All Activities</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link to="/admin/agents">
                <Shield className="mr-2 h-4 w-4" />
                Review Pending Agents ({stats.pendingApprovals})
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link to="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link to="/admin/properties">
                <Building className="mr-2 h-4 w-4" />
                Moderate Properties
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link to="/admin/transactions">
                <CreditCard className="mr-2 h-4 w-4" />
                View Transactions
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link to="/admin/reports">
                <BarChart3 className="mr-2 h-4 w-4" />
                Generate Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Real-time system status and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth.server.status === 'operational' ? 'bg-green-500' : 
                systemHealth.server.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <div>
                <p className="font-medium">Server Status</p>
                <p className="text-sm text-gray-600">{systemHealth.server.message}</p>
                {systemHealth.server.uptime && (
                  <p className="text-xs text-gray-500">Uptime: {systemHealth.server.uptime}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth.database.status === 'operational' ? 'bg-green-500' : 
                systemHealth.database.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-gray-600">{systemHealth.database.message}</p>
                <p className="text-xs text-gray-500">Response: {systemHealth.database.responseTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth.api.status === 'optimal' ? 'bg-green-500' : 
                systemHealth.api.status === 'normal' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <div>
                <p className="font-medium">API Response</p>
                <p className="text-sm text-gray-600">{systemHealth.api.message}</p>
                <p className="text-xs text-gray-500">Avg: {systemHealth.api.responseTime}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
