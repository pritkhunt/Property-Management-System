import React, { useState, useEffect } from 'react';
import { Building, Search, Edit, Trash2, Eye, CheckCircle, XCircle, AlertTriangle, Loader2, MapPin, Bed, Bath, Home, User, Phone, Mail, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { propertyAPI } from '../../../services/api';
import { useNavigate } from 'react-router-dom';

const AdminProperties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
  });

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const response = await propertyAPI.getAdminAllProperties();
      const dbProperties = response.data.data || [];
      
      // Map database properties to UI format
      const mappedProperties = dbProperties.map(prop => ({
        id: prop.Id,
        title: prop.Title || 'Untitled Property',
        address: `${prop.Address || ''}, ${prop.City || ''}, ${prop.State || ''}`.replace(/^,\s*|,\s*$/g, ''),
        city: prop.City,
        state: prop.State,
        price: prop.Price || 0,
        type: prop.ListingType || 'sale',
        propertyType: prop.PropertyType,
        status: getPropertyStatus(prop),
        ownerApprovalStatus: prop.OwnerApprovalStatus,
        adminApprovalStatus: prop.AdminApprovalStatus,
        propertyStatus: prop.Status,
        agent: prop.AgentName || 'Unknown Agent',
        agentEmail: prop.AgentEmail,
        agentMobile: prop.AgentMobile,
        owner: prop.OwnerName || 'Unknown Owner',
        ownerEmail: prop.OwnerEmail,
        ownerMobile: prop.OwnerMobile,
        listed: new Date(prop.CreatedAt).toLocaleDateString('en-IN'),
        createdAt: prop.CreatedAt,
        bedrooms: prop.Bedrooms || 0,
        bathrooms: prop.Bathrooms || 0,
        size: prop.Size || 0,
        furnishing: prop.Furnishing || 'Not specified',
        description: prop.Description || 'No description available',
        views: prop.Views || 0,
        mainImage: prop.MainImage,
        images: prop.Images,
        reports: 0, // Not tracked yet
      }));
      
      setProperties(mappedProperties);
      console.log('✅ Loaded', mappedProperties.length, 'properties for admin');
    } catch (error) {
      console.error('❌ Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine property status for display
  const getPropertyStatus = (prop) => {
    if (prop.OwnerApprovalStatus === 'rejected' || prop.AdminApprovalStatus === 'rejected') {
      return 'rejected';
    }
    if (prop.OwnerApprovalStatus === 'pending') {
      return 'pending-owner';
    }
    if (prop.AdminApprovalStatus === 'pending') {
      return 'pending';
    }
    if (prop.Status === 'active') {
      return 'active';
    }
    return 'inactive';
  };

  const handleApproveProperty = async (propertyId) => {
    try {
      await propertyAPI.adminApproveProperty(propertyId, { action: 'approve' });
      toast.success('Property approved and is now live!');
      fetchProperties(); // Refresh the list
    } catch (error) {
      console.error('❌ Approval error:', error);
      toast.error(error.response?.data?.message || 'Failed to approve property');
    }
  };

  const handleRejectProperty = async (propertyId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) {
      toast.error('Rejection reason is required');
      return;
    }
    
    try {
      await propertyAPI.adminApproveProperty(propertyId, { 
        action: 'reject',
        reason: reason 
      });
      toast.success('Property rejected');
      fetchProperties(); // Refresh the list
    } catch (error) {
      console.error('❌ Rejection error:', error);
      toast.error(error.response?.data?.message || 'Failed to reject property');
    }
  };

  const handleViewProperty = async (property) => {
    setSelectedProperty(property);
    setIsViewModalOpen(true);
  };

  const handleViewFullDetails = (propertyId) => {
    // Navigate to the public property details page
    navigate(`/properties/${propertyId}`);
  };

  const handleDeleteProperty = (property) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Property',
      message: `Are you sure you want to delete "${property.title}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await propertyAPI.deleteProperty(property.id);
          toast.success('Property deleted successfully');
          fetchProperties(); // Refresh the list
        } catch (error) {
          console.error('❌ Delete error:', error);
          toast.error(error.response?.data?.message || 'Failed to delete property');
        }
      }
    });
  };

  const filteredProperties = properties.filter(property => {
    if (filters.search && !property.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !property.address.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && property.status !== filters.status) {
      return false;
    }
    if (filters.type && filters.type !== 'all' && property.type !== filters.type) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const config = {
      active: { variant: 'default', label: 'Active', className: 'bg-green-100 text-green-800' },
      'pending-owner': { variant: 'secondary', label: 'Pending Owner', className: 'bg-orange-100 text-orange-800' },
      pending: { variant: 'secondary', label: 'Pending Admin', className: 'bg-yellow-100 text-yellow-800' },
      rejected: { variant: 'destructive', label: 'Rejected', className: 'bg-red-100 text-red-800' },
      inactive: { variant: 'outline', label: 'Inactive', className: 'bg-gray-100 text-gray-800' },
    };
    const statusConfig = config[status] || config.inactive;
    return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  const formatPrice = (price, type) => {
    const formatted = `₹${price.toLocaleString('en-IN')}`;
    return type === 'rent' ? `${formatted}/month` : formatted;
  };

  const stats = {
    total: properties.length,
    active: properties.filter(p => p.status === 'active').length,
    pending: properties.filter(p => p.status === 'pending').length,
    rejected: properties.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Properties</h1>
        <p className="text-gray-600 mt-2">Review and moderate property listings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <XCircle className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
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
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending-owner">Pending Owner</SelectItem>
                <SelectItem value="pending">Pending Admin</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Types" />
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

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
          <CardDescription>Manage and moderate property listings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between items-center p-4 border rounded">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Property</th>
                    <th className="text-left p-4">Price</th>
                    <th className="text-left p-4">Owner</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Reports</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map(property => (
                    <tr key={property.id} className="border-b">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{property.title}</p>
                          <p className="text-sm text-gray-600">{property.address}</p>
                          <p className="text-xs text-gray-500">Agent: {property.agent}</p>
                          <p className="text-xs text-gray-500">Listed: {property.listed}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">{formatPrice(property.price, property.type)}</p>
                        <Badge variant="outline" className="mt-1">
                          {property.type === 'sale' ? 'Sale' : 'Rent'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium">{property.owner}</p>
                        <p className="text-xs text-gray-500">Owner</p>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(property.status)}
                      </td>
                      <td className="p-4">
                        {property.reports > 0 ? (
                          <Badge variant="destructive">{property.reports} reports</Badge>
                        ) : (
                          <span className="text-sm text-gray-500">No reports</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {property.status === 'pending' && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => handleApproveProperty(property.id)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectProperty(property.id)}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleViewProperty(property)}
                            title="View property details"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteProperty(property)}
                            title="Delete property"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Property Details
            </DialogTitle>
            <DialogDescription>
              Complete information about the property
            </DialogDescription>
          </DialogHeader>
          
          {selectedProperty && (
            <div className="space-y-6">
              {/* Property Title and Status */}
              <div className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedProperty.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedProperty.address}</span>
                    </div>
                  </div>
                  {getStatusBadge(selectedProperty.status)}
                </div>
              </div>

              {/* Property Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Price:</span>
                    <span className="text-sm">{formatPrice(selectedProperty.price, selectedProperty.type)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Type:</span>
                    <span className="text-sm">{selectedProperty.propertyType || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Bedrooms:</span>
                    <span className="text-sm">{selectedProperty.bedrooms}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Bathrooms:</span>
                    <span className="text-sm">{selectedProperty.bathrooms}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Size:</span>
                    <span className="text-sm">{selectedProperty.size} sq ft</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Furnishing:</span>
                    <span className="text-sm">{selectedProperty.furnishing}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Listed On:</span>
                    <span className="text-sm">{selectedProperty.listed}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Views:</span>
                    <span className="text-sm">{selectedProperty.views}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Description</h4>
                <p className="text-sm text-gray-600">{selectedProperty.description}</p>
              </div>

              {/* Owner & Agent Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <User className="h-4 w-4" /> Owner Information
                  </h4>
                  <div className="space-y-1">
                    <p className="text-sm">Name: {selectedProperty.owner}</p>
                    {selectedProperty.ownerEmail && (
                      <p className="text-sm flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {selectedProperty.ownerEmail}
                      </p>
                    )}
                    {selectedProperty.ownerMobile && (
                      <p className="text-sm flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {selectedProperty.ownerMobile}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <User className="h-4 w-4" /> Agent Information
                  </h4>
                  <div className="space-y-1">
                    <p className="text-sm">Name: {selectedProperty.agent}</p>
                    {selectedProperty.agentEmail && (
                      <p className="text-sm flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {selectedProperty.agentEmail}
                      </p>
                    )}
                    {selectedProperty.agentMobile && (
                      <p className="text-sm flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {selectedProperty.agentMobile}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Approval Status */}
              <div className="border-t pt-4 space-y-2">
                <h4 className="font-semibold text-sm">Approval Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Owner Approval:</span>
                    <Badge className="ml-2" variant={selectedProperty.ownerApprovalStatus === 'approved' ? 'default' : selectedProperty.ownerApprovalStatus === 'pending' ? 'secondary' : 'destructive'}>
                      {selectedProperty.ownerApprovalStatus}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Admin Approval:</span>
                    <Badge className="ml-2" variant={selectedProperty.adminApprovalStatus === 'approved' ? 'default' : selectedProperty.adminApprovalStatus === 'pending' ? 'secondary' : 'destructive'}>
                      {selectedProperty.adminApprovalStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center border-t pt-4">
                <div className="flex gap-2">
                  {selectedProperty.status === 'pending' && (
                    <>
                      <Button 
                        onClick={() => {
                          handleApproveProperty(selectedProperty.id);
                          setIsViewModalOpen(false);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          handleRejectProperty(selectedProperty.id);
                          setIsViewModalOpen(false);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
                <Button 
                  variant="outline"
                  onClick={() => handleViewFullDetails(selectedProperty.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Page
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AdminProperties;
