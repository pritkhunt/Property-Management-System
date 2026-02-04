import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Square, Filter, Grid, List, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import PropertyCard from '../../../components/property/PropertyCard';
import { userAPI } from '../../../services/api';
import usePropertyStore from '../../../store/propertyStore';
import toast from 'react-hot-toast';

const SavedProperties = () => {
  const [savedProperties, setSavedProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    sortBy: 'date',
  });

  const { unlikeProperty } = usePropertyStore();

  useEffect(() => {
    fetchSavedProperties();
  }, []);

  const fetchSavedProperties = async () => {
    setIsLoading(true);
    try {
      const response = await userAPI.getSavedProperties();
      console.log('💖 Saved Properties Response:', response.data);
      const properties = response.data?.data || [];
      console.log('💖 Properties Count:', properties.length);
      setSavedProperties(properties);
    } catch (error) {
      console.error('Error fetching saved properties:', error);
      toast.error('Failed to load saved properties');
      setSavedProperties([]);
    } finally {
      setIsLoading(false);
    }
  };



  const handleRemoveProperty = async (propertyId) => {
    try {
      await unlikeProperty(propertyId);
      setSavedProperties(prev => prev.filter(p => p.Id !== propertyId));
      toast.success('Property removed from favorites');
      fetchSavedProperties(); // Refresh the list
    } catch (error) {
      console.error('Error removing property:', error);
      toast.error('Failed to remove property');
    }
  };

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const filteredProperties = savedProperties.filter(property => {
    if (filters.search && !property.Title?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !property.Address?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.type && filters.type !== 'all' && property.ListingType !== filters.type) {
      return false;
    }
    return true;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price_asc':
        return a.Price - b.Price;
      case 'price_desc':
        return b.Price - a.Price;
      case 'date':
      default:
        return new Date(b.LikedAt) - new Date(a.LikedAt);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Saved Properties</h1>
        <p className="text-gray-600 mt-2">Properties you've added to your favorites</p>
      </div>

      {/* Filters and View Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Input
                placeholder="Search saved properties..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
            
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

            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Recently Saved</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Properties */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
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
      ) : sortedProperties.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProperties.map(property => (
              <div key={property.Id} className="relative">
                <PropertyCard property={property} />
                <div className="absolute top-2 right-12 z-10">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-white/80 hover:bg-white"
                    onClick={() => handleRemoveProperty(property.Id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedProperties.map(property => (
              <Card key={property.Id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={property.Images ? property.Images.split(',')[0] : '/placeholder-property.jpg'}
                      alt={property.Title}
                      className="w-48 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            to={`/properties/${property.Id}`}
                            className="text-lg font-semibold hover:text-primary"
                          >
                            {property.Title}
                          </Link>
                          <div className="flex items-center text-gray-600 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {property.Address}, {property.City}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            {property.Bedrooms && (
                              <div className="flex items-center">
                                <Bed className="h-4 w-4 mr-1" />
                                {property.Bedrooms} Beds
                              </div>
                            )}
                            {property.Bathrooms && (
                              <div className="flex items-center">
                                <Bath className="h-4 w-4 mr-1" />
                                {property.Bathrooms} Baths
                              </div>
                            )}
                            <div className="flex items-center">
                              <Square className="h-4 w-4 mr-1" />
                              {property.Size || property.Area} sqft
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            {formatPrice(property.Price)}
                            {property.ListingType === 'rent' && <span className="text-sm">/month</span>}
                          </p>
                          <Badge 
                            variant={property.Status === 'active' ? 'default' : 'secondary'}
                            className="mt-2"
                          >
                            {property.Status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-gray-500">
                          Liked on {new Date(property.LikedAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/properties/${property.Id}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRemoveProperty(property.Id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No saved properties</h3>
            <p className="text-gray-600 mb-4">
              Start exploring and save properties you like
            </p>
            <Button asChild>
              <Link to="/properties">Browse Properties</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SavedProperties;
