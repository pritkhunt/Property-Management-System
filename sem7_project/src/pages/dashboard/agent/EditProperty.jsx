import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import toast from 'react-hot-toast';

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [propertyData, setPropertyData] = useState({
    type: 'sale',
    propertyType: 'apartment',
    description: 'Beautiful 3 BHK apartment with modern amenities',
    address: 'Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    size: '1500',
    price: '15000000',
    bedrooms: '3',
    bathrooms: '2',
    propertyAge: '2 years',
    facing: 'north-east',
    houseType: 'apartment',
    furnishing: 'semi-furnished',
    facilities: ['Parking', 'Lift', 'Security'],
  });

  const facilities = [
    'Parking', 'Lift', 'Power Backup', 'Security', 'Water Supply',
    'Gym', 'Swimming Pool', 'Club House', 'Garden', 'Playground'
  ];

  useEffect(() => {
    // Fetch property data
    fetchPropertyData();
  }, [id]);

  const fetchPropertyData = async () => {
    // Mock fetch property data
    // In real app, fetch from API
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPropertyData(prev => ({ ...prev, [name]: value }));
  };

  const handleFacilityToggle = (facility) => {
    setPropertyData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleSubmit = async () => {
    try {
      // Update property data
      toast.success('Property updated successfully!');
      navigate('/agent-dashboard/properties');
    } catch (error) {
      toast.error('Failed to update property');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Property</h1>
        <p className="text-gray-600 mt-2">Update property details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Listing Type</Label>
              <Select value={propertyData.type} onValueChange={(value) => setPropertyData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select value={propertyData.propertyType} onValueChange={(value) => setPropertyData(prev => ({ ...prev, propertyType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                type="number"
                name="price"
                value={propertyData.price}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Size (sqft)</Label>
              <Input
                type="number"
                name="size"
                value={propertyData.size}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <Input
                type="number"
                name="bedrooms"
                value={propertyData.bedrooms}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Bathrooms</Label>
              <Input
                type="number"
                name="bathrooms"
                value={propertyData.bathrooms}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Input
                name="city"
                value={propertyData.city}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>State</Label>
              <Input
                name="state"
                value={propertyData.state}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input
                name="address"
                value={propertyData.address}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                name="description"
                value={propertyData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Facilities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {facilities.map(facility => (
                  <div key={facility} className="flex items-center space-x-2">
                    <Checkbox
                      id={facility}
                      checked={propertyData.facilities.includes(facility)}
                      onCheckedChange={() => handleFacilityToggle(facility)}
                    />
                    <Label
                      htmlFor={facility}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {facility}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={() => navigate('/agent-dashboard/properties')}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              Update Property
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProperty;
