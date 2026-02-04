import React, { useEffect, useState } from 'react';
import { Search, Filter, MapPin, Star, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import AgentCard from '../components/agent/AgentCard';
import { agentAPI } from '../services/api';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    rating: '',
    sortBy: 'rating',
  });

  useEffect(() => {
    fetchAgents();
  }, [filters]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching agents from database...');
      const response = await agentAPI.getAgents(filters);
      console.log('✅ Agents response:', response.data);
      
      // Backend now returns { success: true, data: [...] } directly
      const agentsData = response.data?.data || [];
      console.log('✅ Loaded', agentsData.length, 'agents');
      setAgents(agentsData);
    } catch (error) {
      console.error('❌ Error fetching agents:', error);
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique cities from agents for filter
  const cities = [...new Set(agents.map(agent => agent.city).filter(Boolean))];


  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredAgents = agents.filter((agent) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = agent.name?.toLowerCase().includes(searchLower);
      const matchesCity = agent.city?.toLowerCase().includes(searchLower);
      const matchesSpecialization = agent.specialization?.toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesCity && !matchesSpecialization) {
        return false;
      }
    }
    
    if (filters.city && filters.city !== 'all') {
      if (agent.city?.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }
    }
    
    if (filters.rating && filters.rating !== 'all') {
      if (!agent.rating || agent.rating < parseFloat(filters.rating)) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Expert Property Agents</h1>
            <p className="text-xl text-gray-200">
              Connect with verified professionals who can help you buy, sell, or rent properties
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search Agents</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="min-w-[180px]">
              <Label htmlFor="city">City</Label>
              <Select value={filters.city} onValueChange={(value) => handleFilterChange('city', value)}>
                <SelectTrigger id="city">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city.toLowerCase()}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Label htmlFor="rating">Min Rating</Label>
              <Select value={filters.rating} onValueChange={(value) => handleFilterChange('rating', value)}>
                <SelectTrigger id="rating">
                  <SelectValue placeholder="Any Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Rating</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="4.8">4.8+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Label htmlFor="sort">Sort By</Label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger id="sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="properties">Properties Listed</SelectItem>
                  <SelectItem value="reviews">Reviews</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              onClick={() => setFilters({ search: '', city: '', rating: '', sortBy: 'rating' })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </section>

      {/* Agents Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="animate-pulse">
                  <Card>
                    <CardContent className="p-6">
                      <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : filteredAgents.length > 0 ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredAgents.length} Agents Found
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No agents found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search criteria
                </p>
                <Button onClick={() => setFilters({ search: '', city: '', rating: '', sortBy: 'rating' })}>
                  Clear Filters
                </Button>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
            <CardContent className="p-8">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">Are You a Real Estate Professional?</h2>
                <p className="text-xl mb-6 text-gray-200">
                  Join our network of expert agents and expand your business reach
                </p>
                <Button size="lg" variant="secondary">
                  Register as Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Agents;
