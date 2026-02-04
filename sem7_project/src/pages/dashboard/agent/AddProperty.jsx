import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, MapPin, Home, DollarSign, Save, X, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import { userAPI, propertyAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const AddProperty = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [propertyData, setPropertyData] = useState({
    type: '',
    propertyType: '',
    description: '',
    address: '',
    city: '',
    state: '',
    size: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    propertyAge: '',
    facing: '',
    houseType: '',
    furnishing: '',
    facilities: [],
    ownerId: '',
    ownerName: '',
    ownerUsercode: '',
  });
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setLoadingSellers(true);
    try {
      const response = await userAPI.getSellers();
      if (response.data.success) {
        setSellers(response.data.data);
        console.log('✅ Sellers loaded:', response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching sellers:', error);
      toast.error('Failed to load sellers');
    } finally {
      setLoadingSellers(false);
    }
  };

  const facilities = [
    'Parking', 'Lift', 'Power Backup', 'Security', 'Water Supply',
    'Gym', 'Swimming Pool', 'Club House', 'Garden', 'Playground'
  ];

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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!propertyData.ownerId || !propertyData.type || !propertyData.propertyType || !propertyData.price || !propertyData.size || !propertyData.address || !propertyData.city || !propertyData.state || !propertyData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      
      // Add property data
      formData.append('ownerId', propertyData.ownerId);
      formData.append('ownerName', propertyData.ownerName);
      formData.append('ownerUsercode', propertyData.ownerUsercode);
      formData.append('type', propertyData.type);
      formData.append('propertyType', propertyData.propertyType);
      formData.append('description', propertyData.description);
      formData.append('price', propertyData.price);
      formData.append('size', propertyData.size);
      formData.append('address', propertyData.address);
      formData.append('city', propertyData.city);
      formData.append('state', propertyData.state);
      
      // Add optional fields if they exist
      if (propertyData.bedrooms) formData.append('bedrooms', propertyData.bedrooms);
      if (propertyData.bathrooms) formData.append('bathrooms', propertyData.bathrooms);
      if (propertyData.propertyAge) formData.append('propertyAge', propertyData.propertyAge);
      if (propertyData.facing) formData.append('facing', propertyData.facing);
      if (propertyData.houseType) formData.append('houseType', propertyData.houseType);
      if (propertyData.furnishing) formData.append('furnishing', propertyData.furnishing);
      
      // Add facilities as JSON string
      if (propertyData.facilities && propertyData.facilities.length > 0) {
        formData.append('facilities', JSON.stringify(propertyData.facilities));
      }
      
      // Add images
      images.forEach((image) => {
        formData.append('images', image);
      });
      
      console.log('📋 Submitting property data...');
      
      const response = await propertyAPI.createProperty(formData);
      
      console.log('✅ Property created:', response.data);
      toast.success('Property added successfully!');
      
      // Navigate to properties list
      navigate('/agent-dashboard/properties');
    } catch (error) {
      console.error('❌ Failed to add property:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add property';
      toast.error(errorMessage);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Property</h1>
        <p className="text-gray-600 mt-2">List a new property for sale or rent</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= i ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {i}
            </div>
            {i < 3 && (
              <div className={`w-full h-1 mx-2 ${
                step > i ? 'bg-primary' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && 'Basic Information'}
            {step === 2 && 'Property Details'}
            {step === 3 && 'Images & Facilities'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  <User className="inline h-4 w-4 mr-1" />
                  Property Owner *
                </Label>
                <Select 
                  value={propertyData.ownerId} 
                  onValueChange={(value) => {
                    const selectedSeller = sellers.find(s => s.Id.toString() === value);
                    setPropertyData(prev => ({
                      ...prev,
                      ownerId: value,
                      ownerName: selectedSeller?.Name || '',
                      ownerUsercode: selectedSeller?.usercode || ''
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingSellers ? "Loading sellers..." : "Select property owner"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sellers.map((seller) => (
                      <SelectItem key={seller.Id} value={seller.Id.toString()}>
                        {seller.Name} ({seller.usercode || 'No ID'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {propertyData.ownerId && (
                  <p className="text-xs text-gray-500">
                    Selected: {propertyData.ownerName} - ID: {propertyData.ownerUsercode}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Listing Type *</Label>
                <Select value={propertyData.type} onValueChange={(value) => setPropertyData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Property Type *</Label>
                <Select value={propertyData.propertyType} onValueChange={(value) => setPropertyData(prev => ({ ...prev, propertyType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="plot">Plot</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price *</Label>
                <Input
                  type="number"
                  name="price"
                  value={propertyData.price}
                  onChange={handleInputChange}
                  placeholder="Enter price"
                />
              </div>

              <div className="space-y-2">
                <Label>Size (sqft) *</Label>
                <Input
                  type="number"
                  name="size"
                  value={propertyData.size}
                  onChange={handleInputChange}
                  placeholder="Enter size in sqft"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Description *</Label>
                <Textarea
                  name="description"
                  value={propertyData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your property..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Address *</Label>
                <Input
                  name="address"
                  value={propertyData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                />
              </div>

              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  name="city"
                  value={propertyData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label>State *</Label>
                <Input
                  name="state"
                  value={propertyData.state}
                  onChange={handleInputChange}
                  placeholder="Enter state"
                />
              </div>

              <div className="space-y-2">
                <Label>Property Age</Label>
                <Input
                  name="propertyAge"
                  value={propertyData.propertyAge}
                  onChange={handleInputChange}
                  placeholder="e.g., 2 years"
                />
              </div>

              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Input
                  type="number"
                  name="bedrooms"
                  value={propertyData.bedrooms}
                  onChange={handleInputChange}
                  placeholder="Number of bedrooms"
                />
              </div>

              <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Input
                  type="number"
                  name="bathrooms"
                  value={propertyData.bathrooms}
                  onChange={handleInputChange}
                  placeholder="Number of bathrooms"
                />
              </div>

              <div className="space-y-2">
                <Label>Facing</Label>
                <Select value={propertyData.facing} onValueChange={(value) => setPropertyData(prev => ({ ...prev, facing: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select facing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north">North</SelectItem>
                    <SelectItem value="south">South</SelectItem>
                    <SelectItem value="east">East</SelectItem>
                    <SelectItem value="west">West</SelectItem>
                    <SelectItem value="north-east">North-East</SelectItem>
                    <SelectItem value="north-west">North-West</SelectItem>
                    <SelectItem value="south-east">South-East</SelectItem>
                    <SelectItem value="south-west">South-West</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Furnishing</Label>
                <Select value={propertyData.furnishing} onValueChange={(value) => setPropertyData(prev => ({ ...prev, furnishing: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select furnishing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="furnished">Fully Furnished</SelectItem>
                    <SelectItem value="semi-furnished">Semi Furnished</SelectItem>
                    <SelectItem value="unfurnished">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <Label>Property Images</Label>
                <div className="mt-2">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Click to upload images or drag and drop
                        </p>
                      </div>
                    </label>
                  </div>
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Property ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Facilities */}
              <div>
                <Label>Facilities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
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
          )}

          <div className="flex justify-between mt-6">
            {step > 1 && (
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={nextStep} className="ml-auto">
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProperty;
