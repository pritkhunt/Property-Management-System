import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Plus, Edit, Trash2, Eye, Search, Filter as FilterIcon } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import PropertyCard from '../../../components/property/PropertyCard';
import { propertyAPI } from '../../../services/backendAPI';
import toast from 'react-hot-toast';

const AgentProperties = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const response = await propertyAPI.getAgentProperties();
      if (response.success) {
        setProperties(response.data || []);
      } else {
        toast.error('Failed to load properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProperty = async (id) => {
    try {
      const response = await propertyAPI.deleteProperty(id);
      if (response.success) {
        toast.success('Property deleted successfully');
        setProperties(prev => prev.filter(p => p.Id !== id));
      } else {
        toast.error('Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  };

  const filteredProperties = properties.filter(property => {
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch = !filters.search || 
      property.Title?.toLowerCase().includes(searchTerm) ||
      property.PropertyType?.toLowerCase().includes(searchTerm) ||
      property.City?.toLowerCase().includes(searchTerm);
    
    const matchesStatus = !filters.status || filters.status === 'all' || property.Status === filters.status;
    const matchesType = !filters.type || filters.type === 'all' || property.ListingType === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Properties</h1>
        <Button asChild>
          <Link to="/agent-dashboard/properties/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search properties..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <Card>
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="pt-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map(property => {
            // Map backend field names to PropertyCard expected format
            const mappedProperty = {
              id: property.Id,
              type: property.ListingType,
              propertyType: property.PropertyType,
              title: property.Title,
              description: property.Description,
              address: property.Address,
              city: property.City,
              state: property.State,
              size: property.Size,
              price: property.Price,
              bedrooms: property.Bedrooms,
              bathrooms: property.Bathrooms,
              furnishing: property.Furnishing,
              propertyImage: property.MainImage || property.PropertyImage,
              status: property.Status,
            };

            return (
              <div key={property.Id} className="relative group">
                <PropertyCard property={mappedProperty} showLikeButton={false} />
                
                {/* Action buttons overlay */}
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                    asChild
                  >
                    <Link to={`/agent-dashboard/properties/edit/${property.Id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                    onClick={() => handleDeleteProperty(property.Id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No properties found</h3>
            <p className="text-gray-600 mb-4">
              Start by adding your first property listing
            </p>
            <Button asChild>
              <Link to="/agent-dashboard/properties/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AgentProperties;
