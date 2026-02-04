import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, PlusCircle, Users, CreditCard, TrendingUp, Calendar, Eye, MessageSquare, User as UserIcon, Mail, Phone, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import useAuthStore from '../../../store/authStore';
import { agentAPI, propertyAPI, chatAPI } from '../../../services/api';
import backendAPI from '../../../services/backendAPI';
import API_ENDPOINTS from '../../../config/apiEndpoints';

const AgentDashboard = () => {
  const { user, checkAuth } = useAuthStore();
  const [agentProfile, setAgentProfile] = useState(null);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeListings: 0,
    totalViews: 0,
    inquiries: 0,
    revenue: 0,
    pendingApprovals: 0,
  });
  const [recentProperties, setRecentProperties] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch agent profile
      const profileResponse = await agentAPI.getAgentProfile();
      if (profileResponse.data.success) {
        setAgentProfile(profileResponse.data.data);
        console.log('✅ Agent profile loaded:', profileResponse.data.data);
      }

      // Refresh auth store to get latest user data
      await checkAuth();

      // Fetch agent's actual properties
      const propertiesResponse = await propertyAPI.getAgentProperties();
      const properties = propertiesResponse.data.data || [];
      
      // Fetch agent's transactions (for revenue and sold count)
      let transactions = [];
      try {
        const transactionsResponse = await backendAPI.get(API_ENDPOINTS.PAYMENT.AGENT_TRANSACTIONS);
        transactions = transactionsResponse.data.data || [];
        console.log('✅ Agent transactions loaded:', transactions.length);
      } catch (error) {
        console.error('❌ Error fetching transactions:', error);
      }

      // Fetch agent's conversations (for inquiries)
      let conversations = [];
      try {
        const conversationsResponse = await chatAPI.getConversations();
        conversations = conversationsResponse.data.data || [];
        console.log('✅ Agent conversations loaded:', conversations.length);
      } catch (error) {
        console.error('❌ Error fetching conversations:', error);
      }
      
      // Calculate real stats
      const activeProperties = properties.filter(p => p.Status === 'active');
      const soldProperties = properties.filter(p => p.Status === 'sold');
      const pendingProperties = properties.filter(p => 
        p.OwnerApprovalStatus === 'pending' || p.AdminApprovalStatus === 'pending'
      );
      const totalViews = properties.reduce((sum, p) => sum + (p.Views || 0), 0);
      
      // Calculate revenue from completed transactions
      const revenue = transactions
        .filter(t => t.Status === 'completed')
        .reduce((sum, t) => sum + (t.Amount || 0), 0);

      setStats({
        totalProperties: properties.length,
        activeListings: activeProperties.length,
        soldProperties: soldProperties.length, // Added sold count
        totalViews: totalViews,
        inquiries: conversations.length, // Unique conversations count
        revenue: revenue,
        pendingApprovals: pendingProperties.length,
      });
      
      // Set recent properties (last 5)
      const sortedProperties = properties
        .sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt))
        .slice(0, 5)
        .map(p => ({
          id: p.Id,
          title: p.Title,
          address: `${p.City}, ${p.State}`,
          price: p.Price,
          status: p.Status,
          views: p.Views || 0,
          date: new Date(p.CreatedAt).toLocaleDateString(),
        }));
      
      setRecentProperties(sortedProperties);
      
      // Set recent inquiries from conversations
      const sortedInquiries = conversations
        .slice(0, 5)
        .map(c => ({
          id: c.Id,
          userName: c.Name,
          message: c.LastMessage,
          time: new Date(c.LastMessageTime).toLocaleDateString(),
          property: 'General Inquiry' // Default as we don't track property specific inquiries yet
        }));
        
      setRecentInquiries(sortedInquiries);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data removed - using dynamic data from API

  const formatPrice = (price) => {
    if (!price) return '₹0';
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { variant: 'default', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
      pending: { variant: 'secondary', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      rejected: { variant: 'destructive', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' }
    };
    return statusConfig[status] || statusConfig.pending;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section with Agent Profile */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-white/20">
              <AvatarImage 
                src={(() => {
                  const profilePic = agentProfile?.ProfilePic || user?.profilepic;
                  return profilePic?.startsWith('http') 
                    ? profilePic
                    : profilePic?.startsWith('/uploads')
                    ? `http://localhost:5000${profilePic}`
                    : profilePic;
                })()}
                alt={agentProfile?.Name || user?.name}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <AvatarFallback className="text-2xl bg-blue-700 text-white">
                {(agentProfile?.Name || user?.name)?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold mb-1">
                Welcome back, {agentProfile?.Name || user?.name}!
              </h1>
              <p className="text-blue-100 mb-2">Manage your properties and track performance</p>
              {agentProfile?.UserCode && (
                <p className="text-blue-200 text-sm">Agent ID: {agentProfile.UserCode}</p>
              )}
            </div>
          </div>
          {agentProfile?.Status && (
            <Badge className={`${getStatusBadge(agentProfile.Status).bgColor} ${getStatusBadge(agentProfile.Status).color} capitalize`}>
              {agentProfile.Status}
            </Badge>
          )}
        </div>
      </div>

      {/* Agent Profile Card */}
      {agentProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Agent Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{agentProfile.Email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Mobile</p>
                  <p className="font-medium">{agentProfile.MobileNo || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-medium">{agentProfile.City}, {agentProfile.State}</p>
                </div>
              </div>
              {agentProfile.Age && (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Age / Gender</p>
                    <p className="font-medium">{agentProfile.Age} / {agentProfile.Gender}</p>
                  </div>
                </div>
              )}
              {agentProfile.BankName && (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Bank</p>
                    <p className="font-medium">{agentProfile.BankName}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="font-medium">{new Date(agentProfile.Date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Total Properties</p>
                  <p className="font-medium">{stats.totalProperties}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Sold Properties</p>
                  <p className="font-medium">{stats.soldProperties}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">{stats.activeListings} active listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inquiries}</div>
            <p className="text-xs text-muted-foreground">5 new today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.revenue)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Properties and Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Properties */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Properties</CardTitle>
              <Button size="sm" asChild>
                <Link to="/agent-dashboard/properties">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : recentProperties.length > 0 ? (
              <div className="space-y-4">
                {recentProperties.map(property => (
                  <div key={property.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{property.title}</p>
                      <p className="text-sm text-gray-600">{property.address}</p>
                      <p className="text-sm text-primary">{formatPrice(property.price)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                        {property.status}
                      </Badge>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span>{property.views} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No properties yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Inquiries</CardTitle>
              <Button size="sm" asChild>
                <Link to="/agent-dashboard/messages">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentInquiries.length > 0 ? (
              <div className="space-y-4">
                {recentInquiries.map(inquiry => (
                  <div key={inquiry.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{inquiry.userName}</p>
                      <p className="text-sm text-gray-600">{inquiry.property}</p>
                      <p className="text-sm text-gray-700 mt-1">{inquiry.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{inquiry.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No inquiries yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button className="h-auto p-4" asChild>
          <Link to="/agent-dashboard/properties/add">
            <div className="text-left">
              <PlusCircle className="h-6 w-6 mb-2" />
              <div className="font-semibold">Add New Property</div>
              <div className="text-xs opacity-80">List a new property</div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto p-4" asChild>
          <Link to="/agent-dashboard/properties">
            <div className="text-left">
              <Building className="h-6 w-6 mb-2 text-primary" />
              <div className="font-semibold">Manage Properties</div>
              <div className="text-xs text-gray-600">View all listings</div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto p-4" asChild>
          <Link to="/agent-dashboard/messages">
            <div className="text-left">
              <MessageSquare className="h-6 w-6 mb-2 text-primary" />
              <div className="font-semibold">View Messages</div>
              <div className="text-xs text-gray-600">{stats.inquiries} new inquiries</div>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default AgentDashboard;
