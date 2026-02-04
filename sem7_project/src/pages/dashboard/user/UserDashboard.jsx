import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, Heart, CreditCard, MessageSquare, TrendingUp, Calendar, ArrowRight, Home, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import useAuthStore from '../../../store/authStore';
import { userAPI, propertyAPI, chatAPI } from '../../../services/api';

const UserDashboard = () => {
  const { user, checkAuth } = useAuthStore();
  const [stats, setStats] = useState({
    savedProperties: 0,
    recentViews: 0,
    totalInquiries: 0,
    activeChats: 0,
  });
  const [recentProperties, setRecentProperties] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Refresh user data to get latest profile picture
    checkAuth();
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Liked Properties (using PropertyLikes table)
      const savedPropsResponse = await userAPI.getSavedProperties();
      console.log('💖 Liked Properties Response:', savedPropsResponse.data);
      const savedProps = savedPropsResponse.data?.data || [];
      console.log('💖 Liked Properties Count:', savedProps.length);
      setSavedProperties(savedProps);

      // 2. Fetch Inquiries/Chats
      const conversationsResponse = await chatAPI.getConversations();
      console.log('💬 Conversations Response:', conversationsResponse.data);
      const conversations = conversationsResponse.data?.data || [];
      console.log('💬 Conversations Count:', conversations.length);
      
      // 3. Fetch Latest Properties (as fallback for Recent Views)
      const latestPropsResponse = await propertyAPI.getProperties({ limit: 3 });
      console.log('🏠 Latest Properties Response:', latestPropsResponse.data);
      const latestProps = latestPropsResponse.data?.properties || [];
      console.log('🏠 Latest Properties Count:', latestProps.length);
      setRecentProperties(latestProps);

      // 4. Calculate Stats
      const calculatedStats = {
        savedProperties: savedProps.length,
        recentViews: 0, // We don't track views yet
        totalInquiries: conversations.length,
        activeChats: conversations.length,
      };
      console.log('📊 Calculated Stats:', calculatedStats);
      setStats(calculatedStats);

      // 5. Generate Recent Activities
      const activities = [];
      
      // Add recent messages
      conversations.slice(0, 2).forEach(chat => {
        activities.push({
          id: `chat-${chat.Id}`,
          type: 'message',
          message: `Conversation with ${chat.Name}`,
          time: new Date(chat.LastMessageTime).toLocaleDateString(),
          icon: MessageSquare
        });
      });

      // Add recent saved properties
      savedProps.slice(0, 2).forEach(prop => {
        activities.push({
          id: `save-${prop.Id}`,
          type: 'save',
          message: `You liked ${prop.Title}`,
          time: new Date(prop.LikedAt).toLocaleDateString(),
          icon: Heart
        });
      });

      setRecentActivities(activities);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.Name || user?.name}!</h1>
            <p className="text-blue-100">Here's what's happening with your property search</p>
          </div>
          <Avatar className="h-16 w-16 ring-2 ring-white">
            <AvatarImage 
              src={(() => {
                const profilePic = user?.ProfilePic || user?.profilepic;
                const imageUrl = profilePic?.startsWith('http') 
                  ? profilePic
                  : profilePic?.startsWith('/uploads')
                  ? `http://localhost:5000${profilePic}`
                  : profilePic;
                console.log('🖼️ Dashboard Avatar URL:', imageUrl);
                console.log('🖼️ Raw ProfilePic value:', profilePic);
                console.log('🖼️ User object:', user);
                return imageUrl;
              })()}
              alt={user?.Name || user?.name}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onLoad={() => console.log('✅ Dashboard avatar image loaded successfully')}
              onError={(e) => {
                console.error('❌ Dashboard avatar image failed to load:', e.target.src);
                console.error('❌ Error event:', e);
              }}
            />
            <AvatarFallback className="text-2xl bg-blue-500 text-white" delayMs={600}>
              {(user?.Name || user?.name)?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Properties</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.savedProperties}</div>
            <p className="text-xs text-muted-foreground">Properties in your wishlist</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Views</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentViews}</div>
            <p className="text-xs text-muted-foreground">Properties viewed this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInquiries}</div>
            <p className="text-xs text-muted-foreground">Messages sent to agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeChats}</div>
            <p className="text-xs text-muted-foreground">Ongoing conversations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Viewed Properties */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recently Viewed Properties</CardTitle>
              <CardDescription>Properties you've looked at recently</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="bg-gray-200 h-20 w-32 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProperties.map(property => (
                    <div key={property.Id} className="flex gap-4">
                      <img
                        src={property.Images ? property.Images.split(',')[0] : '/placeholder-property.jpg'}
                        alt={property.Title}
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <Link 
                          to={`/properties/${property.Id}`}
                          className="font-semibold hover:text-primary"
                        >
                          {property.Title}
                        </Link>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {property.City}, {property.State}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(property.Price)}
                          </span>
                          <div className="flex gap-3 text-sm text-gray-600">
                            <span>{property.Bedrooms} Beds</span>
                            <span>{property.Bathrooms} Baths</span>
                            <span>{property.Area} sqft</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/properties">
                    View All Properties
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map(activity => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Saved Properties */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Saved Properties</CardTitle>
              <CardDescription>Properties you've added to your favorites</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/saved-properties">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {savedProperties.slice(0, 3).map(property => (
              <div key={property.Id} className="flex items-center justify-between">
                <div>
                  <Link 
                    to={`/properties/${property.Id}`}
                    className="font-semibold hover:text-primary"
                  >
                    {property.Title}
                  </Link>
                  <p className="text-sm text-gray-600">{property.City}, {property.State}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{formatPrice(property.Price)}</p>
                  <Badge variant={property.Status === 'active' ? 'default' : 'secondary'}>
                    {property.Status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto p-4" asChild>
          <Link to="/properties">
            <div className="text-left">
              <Building className="h-6 w-6 mb-2 text-primary" />
              <div className="font-semibold">Browse Properties</div>
              <div className="text-xs text-gray-600">Explore available listings</div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto p-4" asChild>
          <Link to="/dashboard/saved-properties">
            <div className="text-left">
              <Heart className="h-6 w-6 mb-2 text-primary" />
              <div className="font-semibold">Saved Properties</div>
              <div className="text-xs text-gray-600">View your favorites</div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto p-4" asChild>
          <Link to="/dashboard/messages">
            <div className="text-left">
              <MessageSquare className="h-6 w-6 mb-2 text-primary" />
              <div className="font-semibold">Messages</div>
              <div className="text-xs text-gray-600">Chat with agents</div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto p-4" asChild>
          <Link to="/dashboard/profile">
            <div className="text-left">
              <Calendar className="h-6 w-6 mb-2 text-primary" />
              <div className="font-semibold">Schedule Visit</div>
              <div className="text-xs text-gray-600">Book property tours</div>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default UserDashboard;
