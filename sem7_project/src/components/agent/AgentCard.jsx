import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Star, Building, Shield, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const AgentCard = ({ agent }) => {
  const getInitials = (name) => {
    if (!name) return 'A';
    const words = name.split(' ');
    return words.map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = () => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' },
      verified: { label: 'Verified', variant: 'default' },
      pending: { label: 'Pending', variant: 'secondary' },
      inactive: { label: 'Inactive', variant: 'outline' },
    };

    const config = statusConfig[agent.status?.toLowerCase()] || statusConfig.active;
    return (
      <Badge variant={config.variant} className="absolute top-2 right-2">
        {config.label === 'Verified' && <CheckCircle className="h-3 w-3 mr-1" />}
        {config.label}
      </Badge>
    );
  };

  const getRatingStars = (rating = 4.5) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />
        );
      } else {
        stars.push(
          <Star key={i} className="h-4 w-4 text-gray-300" />
        );
      }
    }
    return stars;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        {getStatusBadge()}
      </div>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={agent.profilepic} alt={agent.name} />
            <AvatarFallback className="text-lg">
              {getInitials(agent.name)}
            </AvatarFallback>
          </Avatar>

          <h3 className="font-semibold text-lg mb-1">{agent.name}</h3>
          
          <div className="flex items-center mb-2">
            {getRatingStars(agent.rating || 4.5)}
            <span className="ml-2 text-sm text-gray-600">
              ({agent.totalReviews || 25})
            </span>
          </div>

          <div className="flex items-center text-gray-600 text-sm mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{agent.city}, {agent.state}</span>
          </div>

          {agent.propertyCount !== undefined && (
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <Building className="h-4 w-4 mr-1" />
              <span>{agent.propertyCount} Properties</span>
            </div>
          )}

          <div className="w-full space-y-2 mb-4">
            {agent.email && (
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                <span className="truncate">{agent.email}</span>
              </div>
            )}
            {agent.mobileno && (
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                <span>{agent.mobileno}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full">
            <Button 
              asChild 
              variant="outline" 
              className="flex-1"
            >
              <Link to={`/agents/${agent.id || agent.email}`}>
                View Profile
              </Link>
            </Button>
            <Button 
              asChild 
              className="flex-1"
            >
              <a href={`tel:${agent.mobileno}`}>
                Contact
              </a>
            </Button>
          </div>

          {agent.specialization && (
            <div className="mt-3 flex flex-wrap gap-1 justify-center">
              {agent.specialization.split(',').slice(0, 3).map((spec, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {spec.trim()}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentCard;
