import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { CheckCircle, XCircle, Clock, Home, MapPin, DollarSign, Loader2 } from 'lucide-react';
import { propertyAPI } from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';

const PropertyApprovals = () => {
  const { user } = useAuthStore();
  const [allProperties, setAllProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState({ id: null, action: null });
  const [rejectionReason, setRejectionReason] = useState({});

  useEffect(() => {
    fetchAllProperties();
  }, []);

  const fetchAllProperties = async () => {
    setIsLoading(true);
    try {
      const response = await propertyAPI.getOwnerProperties();
      setAllProperties(response.data.data || []);
      console.log('✅ All properties loaded:', response.data.data);
    } catch (error) {
      console.error('❌ Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  // Organize properties by status
  const pendingProperties = allProperties.filter(p => p.OwnerApprovalStatus === 'pending');
  const approvedProperties = allProperties.filter(p => p.OwnerApprovalStatus === 'approved');
  const rejectedProperties = allProperties.filter(p => p.OwnerApprovalStatus === 'rejected');

  const handleApprove = async (propertyId) => {
    setProcessingAction({ id: propertyId, action: 'approve' });
    try {
      const response = await propertyAPI.ownerApproveProperty(propertyId, {
        action: 'approve'
      });
      
      toast.success(response.data.message || 'Property approved successfully!');
      
      // Refresh all properties
      fetchAllProperties();
    } catch (error) {
      console.error('❌ Approval error:', error);
      toast.error(error.response?.data?.message || 'Failed to approve property');
    } finally {
      setProcessingAction({ id: null, action: null });
    }
  };

  const handleReject = async (propertyId) => {
    const reason = rejectionReason[propertyId];
    
    if (!reason || reason.trim().length === 0) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessingAction({ id: propertyId, action: 'reject' });
    try {
      const response = await propertyAPI.ownerApproveProperty(propertyId, {
        action: 'reject',
        reason: reason
      });
      
      toast.success(response.data.message || 'Property rejected successfully');
      
      // Refresh all properties
      fetchAllProperties();
      
      // Clear rejection reason
      setRejectionReason(prev => {
        const newReasons = { ...prev };
        delete newReasons[propertyId];
        return newReasons;
      });
    } catch (error) {
      console.error('❌ Rejection error:', error);
      toast.error(error.response?.data?.message || 'Failed to reject property');
    } finally {
      setProcessingAction({ id: null, action: null });
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getPropertyTypeIcon = (type) => {
    return <Home className="h-5 w-5 text-primary" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-gray-600">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Property Approvals</h1>
        <p className="text-gray-600 mt-2">
          Review and approve properties listed by agents for your properties
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allProperties.length}</div>
            <p className="text-xs text-muted-foreground">Listed by agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingProperties.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedProperties.length}</div>
            <p className="text-xs text-muted-foreground">By you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedProperties.length}</div>
            <p className="text-xs text-muted-foreground">Not approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Pending Approvals ({pendingProperties.length})
        </h2>
        {pendingProperties.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">No properties pending approval</p>
            </CardContent>
          </Card>
        ) : (
        <div className="space-y-4">
          {pendingProperties.map((property) => (
            <Card key={property.Id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getPropertyTypeIcon(property.PropertyType)}
                      {property.Title || 'Property Listing'}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Listed by <strong>{property.AgentName || 'Unknown Agent'}</strong> on{' '}
                      {new Date(property.CreatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Approval
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Property Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Property Type</p>
                    <p className="font-semibold capitalize">{property.PropertyType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Location
                    </p>
                    <p className="font-semibold">{property.City}, {property.State}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Price
                    </p>
                    <p className="font-semibold text-primary">{formatPrice(property.Price)}</p>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {property.Bedrooms && (
                    <div>
                      <span className="text-gray-600">Bedrooms:</span>
                      <span className="ml-2 font-medium">{property.Bedrooms}</span>
                    </div>
                  )}
                  {property.Bathrooms && (
                    <div>
                      <span className="text-gray-600">Bathrooms:</span>
                      <span className="ml-2 font-medium">{property.Bathrooms}</span>
                    </div>
                  )}
                  {property.Size && (
                    <div>
                      <span className="text-gray-600">Size:</span>
                      <span className="ml-2 font-medium">{property.Size} sqft</span>
                    </div>
                  )}
                  {property.ListingType && (
                    <div>
                      <span className="text-gray-600">For:</span>
                      <span className="ml-2 font-medium capitalize">{property.ListingType}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {property.Description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p className="text-sm">{property.Description}</p>
                  </div>
                )}

                {/* Address */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Full Address</p>
                  <p className="text-sm">{property.Address}, {property.City}, {property.State}</p>
                </div>

                {/* Agent Contact */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Agent Contact Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {property.AgentEmail && (
                      <div>
                        <span className="text-blue-700">Email:</span>
                        <span className="ml-2">{property.AgentEmail}</span>
                      </div>
                    )}
                    {property.AgentMobile && (
                      <div>
                        <span className="text-blue-700">Phone:</span>
                        <span className="ml-2">{property.AgentMobile}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Reason Input */}
                <div className="space-y-2">
                  <Label htmlFor={`rejection-reason-${property.Id}`}>
                    Rejection Reason (if rejecting)
                  </Label>
                  <Textarea
                    id={`rejection-reason-${property.Id}`}
                    placeholder="Provide a reason if you're rejecting this property..."
                    value={rejectionReason[property.Id] || ''}
                    onChange={(e) => setRejectionReason(prev => ({
                      ...prev,
                      [property.Id]: e.target.value
                    }))}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleApprove(property.Id)}
                    disabled={processingAction.id === property.Id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processingAction.id === property.Id && processingAction.action === 'approve' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Property
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleReject(property.Id)}
                    disabled={processingAction.id === property.Id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processingAction.id === property.Id && processingAction.action === 'reject' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Property
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </div>

      {/* Approved Properties Section */}
      {approvedProperties.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Approved Properties ({approvedProperties.length})
          </h2>
          <div className="space-y-4">
            {approvedProperties.map((property) => (
              <Card key={property.Id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getPropertyTypeIcon(property.PropertyType)}
                        {property.Title || 'Property Listing'}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Listed by <strong>{property.AgentName || 'Unknown Agent'}</strong>
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Property Type</p>
                      <p className="font-semibold capitalize">{property.PropertyType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        Location
                      </p>
                      <p className="font-semibold">{property.City}, {property.State}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <DollarSign className="inline h-4 w-4 mr-1" />
                        Price
                      </p>
                      <p className="font-semibold text-primary">{formatPrice(property.Price)}</p>
                    </div>
                  </div>
                  {property.AdminApprovalStatus === 'pending' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        ⏳ Awaiting admin approval to go live
                      </p>
                    </div>
                  )}
                  {property.AdminApprovalStatus === 'approved' && property.Status === 'active' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ Property is live and visible to buyers
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Properties Section */}
      {rejectedProperties.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Rejected Properties ({rejectedProperties.length})
          </h2>
          <div className="space-y-4">
            {rejectedProperties.map((property) => (
              <Card key={property.Id} className="border-red-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getPropertyTypeIcon(property.PropertyType)}
                        {property.Title || 'Property Listing'}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Listed by <strong>{property.AgentName || 'Unknown Agent'}</strong>
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Property Type</p>
                      <p className="font-semibold capitalize">{property.PropertyType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        Location
                      </p>
                      <p className="font-semibold">{property.City}, {property.State}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <DollarSign className="inline h-4 w-4 mr-1" />
                        Price
                      </p>
                      <p className="font-semibold text-primary">{formatPrice(property.Price)}</p>
                    </div>
                  </div>
                  {property.OwnerRejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-800">{property.OwnerRejectionReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyApprovals;
