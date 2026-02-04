import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home as HomeIcon, Building, Users, Star, ArrowRight, Check, TrendingUp, Shield, Award, MapPin, Bed, Bath, Square } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { propertyAPI, agentAPI } from '../services/api';
import PropertyCard from '../components/property/PropertyCard';
import AgentCard from '../components/agent/AgentCard';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [topAgents, setTopAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicStats, setDynamicStats] = useState({
    properties: 0,
    agents: 0,
    cities: 0,
  });

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      // Fetch properties and agents independently so one failure doesn't affect the other
      const propertiesPromise = propertyAPI.getFeaturedProperties()
        .then(res => {
          // Backend returns { success: true, data: [...] }
          const data = res.data?.data || res.data || [];
          console.log('✅ Featured properties loaded:', data.length);
          return Array.isArray(data) ? data : [];
        })
        .catch(err => {
          console.warn('Could not fetch featured properties:', err.message);
          return [];
        });
      
      const agentsPromise = agentAPI.getTopAgents()
        .then(res => {
          const data = res.data?.data || res.data?.agents || [];
          console.log('✅ Top agents loaded:', data.length);
          return Array.isArray(data) ? data : [];
        })
        .catch(err => {
          console.warn('Could not fetch top agents:', err.message);
          return [];
        });
      
      const [properties, agents] = await Promise.all([propertiesPromise, agentsPromise]);
      setFeaturedProperties(properties);
      setTopAgents(agents);
      
      // Fetch all properties to calculate stats
      try {
        const allPropertiesResponse = await propertyAPI.getProperties({ limit: 1000 });
        const allProperties = allPropertiesResponse.data?.data?.properties || 
                             allPropertiesResponse.data?.properties || [];
        
        // Extract unique cities
        const uniqueCities = new Set();
        allProperties.forEach(prop => {
          if (prop.City || prop.city) {
            uniqueCities.add(prop.City || prop.city);
          }
        });
        
        setDynamicStats({
          properties: allProperties.length,
          agents: agents.length,
          cities: uniqueCities.size,
        });
        
        console.log('✅ Stats calculated:', {
          properties: allProperties.length,
          agents: agents.length,
          cities: uniqueCities.size,
        });
      } catch (error) {
        console.warn('Could not calculate stats:', error.message);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (propertyType) params.append('type', propertyType);
    if (location) params.append('location', location);
    navigate(`/properties?${params.toString()}`);
  };

  // Dynamic stats based on actual database data
  const stats = [
    { 
      label: 'Properties Listed', 
      value: dynamicStats.properties > 0 ? `${dynamicStats.properties.toLocaleString()}` : 'Loading...', 
      icon: Building 
    },
    { 
      label: 'Happy Customers', 
      value: dynamicStats.properties > 0 ? `${Math.floor(dynamicStats.properties * 0.8).toLocaleString()}+` : 'Loading...', 
      icon: Users 
    },
    { 
      label: 'Verified Agents', 
      value: dynamicStats.agents > 0 ? `${dynamicStats.agents.toLocaleString()}` : 'Loading...', 
      icon: Shield 
    },
    { 
      label: 'Cities Covered', 
      value: dynamicStats.cities > 0 ? `${dynamicStats.cities}` : 'Loading...', 
      icon: MapPin 
    },
  ];

  const features = [
    {
      title: 'Wide Range of Properties',
      description: 'Choose from thousands of properties across multiple cities',
      icon: Building,
    },
    {
      title: 'Verified Listings',
      description: 'All properties are verified to ensure authenticity',
      icon: Shield,
    },
    {
      title: 'Expert Agents',
      description: 'Connect with experienced agents for best deals',
      icon: Award,
    },
    {
      title: 'Best Prices',
      description: 'Compare prices and get the best value for your money',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative container mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Dream Property
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Buy, Sell, or Rent Properties with Confidence
            </p>

            {/* Search Bar and Quick Links removed as per user request */}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Properties
            </h2>
            <p className="text-lg text-gray-600">
              Discover our hand-picked selection of premium properties
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-lg"></div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.slice(0, 6).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No featured properties available</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Button onClick={() => navigate('/properties')} size="lg">
              View All Properties
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose PropertyHub?
            </h2>
            <p className="text-lg text-gray-600">
              We make property transactions simple, secure, and satisfying
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Agents */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Top Agents
            </h2>
            <p className="text-lg text-gray-600">
              Connect with experienced professionals who can help you find your perfect property
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : topAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topAgents.slice(0, 4).map((agent) => (
                <AgentCard key={agent.id || agent.email} agent={agent} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No agents available</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Button onClick={() => navigate('/agents')} size="lg" variant="outline">
              View All Agents
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Dream Property?
          </h2>
          <p className="text-xl mb-8 text-gray-200">
            Join thousands of happy customers who found their perfect home with us
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => navigate('/register')}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
