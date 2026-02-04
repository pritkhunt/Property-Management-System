import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart, Camera } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import useAuthStore from '../../store/authStore';
import usePropertyStore from '../../store/propertyStore';

const PropertyCard = ({ property, showLikeButton = true }) => {
  const { isAuthenticated } = useAuthStore();
  const { likeProperty, unlikeProperty } = usePropertyStore();

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      return;
    }

    const isLiked = property.IsLike || property.islike || property.isLike;
    const propertyId = property.Id || property.id;
    
    if (isLiked) {
      await unlikeProperty(propertyId);
    } else {
      await likeProperty(propertyId);
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

  const getPropertyImage = () => {
    // Helper to ensure full URL
    const getFullUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
    };

    // Priority 1: propertyImage field
    if (property.propertyImage) {
      if (Array.isArray(property.propertyImage)) {
        return getFullUrl(property.propertyImage[0]);
      }
      return getFullUrl(property.propertyImage);
    }
    
    // Priority 2: MainImage field
    if (property.MainImage) {
      return getFullUrl(property.MainImage);
    }
    
    // Priority 3: PropertyImage field
    if (property.PropertyImage) {
      return getFullUrl(property.PropertyImage);
    }
    
    return null;
  };

  const getPropertyTypeLabel = () => {
    const types = {
      'buy': 'For Sale',
      'sale': 'For Sale',
      'rent': 'For Rent',
      'lease': 'For Lease',
    };
    const type = property.Type || property.type;
    return types[type?.toLowerCase()] || 'Available';
  };

  const getPropertyBadgeVariant = () => {
    const type = (property.Type || property.type)?.toLowerCase();
    if (type === 'rent' || type === 'lease') return 'secondary';
    return 'default';
  };

  return (
    <Link to={`/properties/${property.Id || property.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
        <div className="relative">
          {(() => {
            const imageUrl = getPropertyImage();
            
            if (imageUrl) {
              return (
                <img
                  src={imageUrl}
                  alt={property.title || property.description || 'Property'}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x400?text=Image+Not+Available';
                  }}
                />
              );
            } else {
              return (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              );
            }
          })()}
          <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
            <Badge variant={getPropertyBadgeVariant()}>
              {getPropertyTypeLabel()}
            </Badge>
            
            {/* Status Badges */}
            {(property.Status === 'active' || property.status === 'active') && (
              <Badge className="bg-green-600 text-white border-0 animate-pulse">
                🔴 LIVE
              </Badge>
            )}
            {(property.Status === 'sold' || property.status === 'sold') && (
              <Badge className="bg-red-600 text-white border-0">
                ✅ SOLD
              </Badge>
            )}
            {(property.Status === 'rented' || property.status === 'rented') && (
              <Badge className="bg-purple-600 text-white border-0">
                🏠 RENTED
              </Badge>
            )}
            {(property.Status === 'pending' || property.status === 'pending') && (
              <Badge className="bg-yellow-500 text-white border-0">
                ⏳ PENDING
              </Badge>
            )}
          </div>
          <div className="absolute top-2 right-2 space-x-2">
            {isAuthenticated && showLikeButton && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-white/80 hover:bg-white"
                onClick={handleLike}
              >
                <Heart
                  className={`h-4 w-4 ${
                    property.islike ? 'fill-red-500 text-red-500' : 'text-gray-600'
                  }`}
                />
              </Button>
            )}
          </div>
          {property.propertyImage && Array.isArray(property.propertyImage) && (
            <div className="absolute bottom-2 left-2 flex items-center bg-black/50 text-white px-2 py-1 rounded text-sm">
              <Camera className="h-3 w-3 mr-1" />
              {property.propertyImage.length}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">
              {property.PropertyType || property.propertyType || 'Property'} in {property.City || property.city}
            </h3>
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="line-clamp-1">
                {property.Address || property.address || `${property.City || property.city}, ${property.State || property.state}`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            {(property.Size || property.size) && (
              <div className="flex items-center">
                <Square className="h-4 w-4 mr-1" />
                <span>{property.Size || property.size} sqft</span>
              </div>
            )}
            {(property.Bedrooms || property.bedrooms) && (
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-1" />
                <span>{property.Bedrooms || property.bedrooms} Beds</span>
              </div>
            )}
            {(property.Bathrooms || property.bathrooms) && (
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-1" />
                <span>{property.Bathrooms || property.bathrooms} Baths</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(property.Price || property.price)}
              </span>
              {(property.Type || property.type) === 'rent' && (
                <span className="text-sm text-gray-600">/month</span>
              )}
            </div>
            {(property.Furnishing || property.furnishing) && (
              <Badge variant="outline">{property.Furnishing || property.furnishing}</Badge>
            )}
          </div>

          {(() => {
            const facilityString = property.Facility || property.facility;
            const facilities = facilityString ? 
              (typeof facilityString === 'string' ? facilityString.split(',') : facilityString) : 
              [];
            
            return facilities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {facilities.slice(0, 3).map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {item.trim()}
                  </Badge>
                ))}
                {facilities.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{facilities.length - 3}
                  </Badge>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </Link>
  );
};

export default PropertyCard;
