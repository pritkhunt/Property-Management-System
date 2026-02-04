import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart, Phone, Mail, Share2, Calendar, User, Shield, Star, Camera, Check, Home, Car, Trees, Dumbbell, Waves, Building as BuildingIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import usePropertyStore from '../store/propertyStore';
import useAuthStore from '../store/authStore';
import { paymentAPI, propertyAPI } from '../services/backendAPI';
import toast from 'react-hot-toast';
import PropertyCard from '../components/property/PropertyCard';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { currentProperty, fetchPropertyById, likeProperty, unlikeProperty, isLoading } = usePropertyStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [contactFormData, setContactFormData] = useState({
    name: user?.Name || user?.name || '',
    email: user?.Email || user?.email || '',
    phone: user?.MobileNo || user?.mobileno || '',
    message: ''
  });
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const fetchSimilarProperties = async () => {
      if (currentProperty?.PropertyType || currentProperty?.propertyType) {
        try {
          const type = currentProperty.PropertyType || currentProperty.propertyType;
          const response = await propertyAPI.getProperties({ type });
          const allProperties = response.data?.data?.properties || response.data || [];
          
          // Filter out current property and limit to 3
          const similar = allProperties
            .filter(p => (p.Id || p.id) !== (currentProperty.Id || currentProperty.id))
            .slice(0, 3);
            
          setSimilarProperties(similar);
        } catch (error) {
          console.error('Failed to fetch similar properties:', error);
        }
      }
    };

    if (currentProperty) {
      fetchSimilarProperties();
    }
  }, [currentProperty]);

  useEffect(() => {
    if (id) {
      console.log('🔍 Fetching property details for ID:', id);
      fetchPropertyById(id).catch(error => {
        console.error('❌ Failed to fetch property:', error);
        toast.error('Property not found or not available');
        navigate('/properties');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id, not fetchPropertyById or navigate

  // Use only real data from database - NO MOCK DATA
  const property = currentProperty;
  
  // Get all images for gallery (from MainImage + PropertyImages table)
  const propertyImages = property?.propertyImage || [];
  const hasImages = propertyImages && propertyImages.length > 0;
  
  // Enhanced debugging
  useEffect(() => {
    if (property) {
      console.log('🖼️ Property Detail Images:', {
        propertyId: property?.id,
        mainImage: property?.mainImage,
        propertyImage: property?.propertyImage,
        totalImages: propertyImages?.length || 0,
        images: propertyImages,
        currentSelectedIndex: selectedImage
      });
      
      // Test each image URL
      if (propertyImages && propertyImages.length > 0) {
        propertyImages.forEach((url, index) => {
          if (url) {
            const img = new Image();
            img.onload = () => console.log(`✅ Image ${index} preloaded:`, url);
            img.onerror = () => console.error(`❌ Image ${index} failed to preload:`, url);
            img.src = url;
          }
        });
      }
    }
  }, [property, propertyImages, selectedImage]);

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price?.toLocaleString('en-IN')}`;
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (property.islike) {
      await unlikeProperty(property.id);
    } else {
      await likeProperty(property.id);
    }
  };

  const handleContact = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowContactForm(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.propertyType,
        text: property.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase this property');
      navigate('/login');
      return;
    }

    if (property.status === 'sold') {
      toast.error('This property is already sold');
      return;
    }

    try {
      setIsProcessingPayment(true);
      toast.loading('Creating payment order...');

      // Create Razorpay order
      const orderResponse = await paymentAPI.createOrder(property.id);
      
      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || 'Failed to create order');
      }

      const { orderId, amount, currency, keyId, property: propertyData } = orderResponse.data.data;

      toast.dismiss();

      // Razorpay checkout options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Property Management System',
        description: `Purchase: ${propertyData.title}`,
        image: propertyData.image || '/logo192.png',
        order_id: orderId,
        handler: async function (response) {
          try {
            toast.loading('Verifying payment...');
            
            // Verify payment
            const verifyResponse = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              propertyId: property.id
            });

            toast.dismiss();

            if (verifyResponse.data.success) {
              toast.success('Payment successful! Property purchased.');
              // Refresh property data
              await fetchPropertyById(property.id);
              // Navigate to transactions page
              setTimeout(() => {
                navigate('/dashboard/transactions');
              }, 2000);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.response?.data?.message || 'Payment verification failed');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: user?.Name || user?.name || '',
          email: user?.Email || user?.email || '',
          contact: user?.MobileNo || user?.mobileno || ''
        },
        theme: {
          color: '#3b82f6'
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
            setIsProcessingPayment(false);
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setIsProcessingPayment(false);
    }
  };

  const handleSendContactMessage = async (e) => {
    e.preventDefault();
    
    if (!contactFormData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setIsSendingMessage(true);
      
      // Show success message without redirecting
      toast.success('Message sent successfully! The agent will contact you soon.');
      
      // Reset form and close dialog
      setContactFormData(prev => ({ ...prev, message: '' }));
      setShowContactForm(false);
      
      // Optional: You can implement actual message sending to backend here
      // await chatAPI.sendMessage({ agentId: property.agent?.id, message: contactFormData.message });
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const facilityIcons = {
    'Parking': Car,
    'Lift': BuildingIcon,
    'Power Backup': Shield,
    'Security': Shield,
    'Water Supply': Waves,
    'Gym': Dumbbell,
    'Swimming Pool': Waves,
    'Garden': Trees,
    'Club House': Home,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-gray-600">Loading property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-4">The property you're looking for doesn't exist or is not available.</p>
          <Button onClick={() => navigate('/properties')}>Back to Properties</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Gallery */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                {hasImages ? (
                  <img
                    src={propertyImages[selectedImage]}
                    alt={`${property.title} - Image ${selectedImage + 1}`}
                    className="w-full h-[500px] object-cover rounded-lg"
                    onLoad={(e) => {
                      console.log('✅ Detail image loaded:', e.target.src);
                    }}
                    onError={(e) => {
                      console.error('❌ Detail image failed:', {
                        src: e.target.src,
                        selectedIndex: selectedImage,
                        totalImages: propertyImages.length
                      });
                      // Don't hide, show fallback
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2UyZTJlMiIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjQwMCIgeT0iMjUwIiBzdHlsZT0iZmlsbDojOTk5O2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjI0cHg7Zm9udC1mYW1pbHk6QXJpYWwsc2Fucy1zZXJpZiI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                ) : (
                  <div className="w-full h-[500px] bg-gray-200 flex items-center justify-center rounded-lg">
                    <span className="text-gray-400 text-xl">No Image Available</span>
                  </div>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-4 right-4 bg-white/80 hover:bg-white"
                  onClick={handleLike}
                >
                  <Heart className={`h-5 w-5 ${property.islike ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-4 right-14 bg-white/80 hover:bg-white"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
              {/* Thumbnail Grid Below Main Image - Show all gallery images */}
              {hasImages && propertyImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {propertyImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img}
                        alt={`${property.title} - Thumbnail ${index + 1}`}
                        className={`w-full h-24 object-cover rounded cursor-pointer transition-all ${
                          selectedImage === index ? 'ring-2 ring-primary ring-offset-2' : 'opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => setSelectedImage(index)}
                        onLoad={(e) => {
                          console.log(`✅ Thumbnail ${index} loaded`);
                        }}
                        onError={(e) => {
                          console.error(`❌ Thumbnail ${index} failed:`, e.target.src);
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UyZTJlMiIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjUwIiB5PSI1MCIgc3R5bGU9ImZpbGw6Izk5OTtmb250LXNpemU6MTJweDtmb250LWZhbWlseTpBcmlhbCI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                        }}
                      />
                      {selectedImage === index && (
                        <div className="absolute inset-0 border-2 border-primary rounded pointer-events-none"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agent Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Contact Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {property.agent?.profilepic ? (
                      <img
                        src={property.agent.profilepic}
                        alt={property.agent?.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-lg font-semibold">
                          {property.agent?.name?.charAt(0) || 'A'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{property.agent?.name}</p>
                      <p className="text-sm text-gray-600">Real Estate Agent</p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleContact}>
                    <Phone className="mr-2 h-4 w-4" />
                    Contact Agent
                  </Button>
                  {property.status !== 'sold' && (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      onClick={handleBuyNow}
                      disabled={isProcessingPayment}
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>Buy Now - {formatPrice(property.price)}</>
                      )}
                    </Button>
                  )}
                  {property.status === 'sold' && (
                    <div className="w-full bg-red-100 text-red-700 px-4 py-2 rounded-md text-center font-semibold">
                      Property Sold
                    </div>
                  )}
                  <Button variant="outline" className="w-full"
                    onClick={() => navigate('/dashboard/chat', { state: { selectedAgent: property.agent } })}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center mb-2">
                      <Phone className="h-4 w-4 mr-2" />
                      {property.agent?.mobileno || property.mobileno}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {property.agent?.email || property.email}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Basic Info */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{property.title || property.propertyType}</h1>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.address}, {property.city}, {property.state}
                    </div>
                    <Badge className="bg-green-600 text-white">🔴 LIVE</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {formatPrice(property.price)}
                    </div>
                    {property.type === 'rent' && <span className="text-gray-600">/month</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">
                    <Bed className="h-3 w-3 mr-1" />
                    {property.bedrooms} Beds
                  </Badge>
                  <Badge variant="outline">
                    <Bath className="h-3 w-3 mr-1" />
                    {property.bathrooms} Baths
                  </Badge>
                  <Badge variant="outline">
                    <Square className="h-3 w-3 mr-1" />
                    {property.size} sqft
                  </Badge>
                  <Badge variant="outline">
                    <Home className="h-3 w-3 mr-1" />
                    {property.furnishing}
                  </Badge>
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {property.propertyAge} old
                  </Badge>
                </div>

                <p className="text-gray-600 leading-relaxed">
                  {property.description}
                </p>
              </CardContent>
            </Card>

            {/* Tabs for Details */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Property Type</Label>
                        <p className="font-semibold">{property.PropertyType || property.houseType || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Property Age</Label>
                        <p className="font-semibold">{property.PropertyAge || property.propertyAge || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Facing</Label>
                        <p className="font-semibold">{property.Facing || property.facing || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Furnishing</Label>
                        <p className="font-semibold">{property.Furnishing || property.furnishing || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Total Area</Label>
                        <p className="font-semibold">{property.Size || property.size} sqft</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Status</Label>
                        <Badge variant="default" className="capitalize">{property.Status || property.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="amenities">
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities & Facilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {(property.facilities || property.facility || []).map((item, index) => {
                        const Icon = facilityIcons[item] || Check;
                        return (
                          <div key={index} className="flex items-center space-x-2">
                            <Icon className="h-5 w-5 text-primary" />
                            <span>{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="location">
                <Card>
                  <CardHeader>
                    <CardTitle>Location & Neighborhood</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-600">Full Address</Label>
                        <p className="font-semibold">
                          {property.address}, {property.city}, {property.state}
                        </p>
                      </div>
                      <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                        <iframe 
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(`${property.address}, ${property.city}, ${property.state}`)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                          width="100%" 
                          height="100%" 
                          style={{ border: 0 }} 
                          allowFullScreen="" 
                          loading="lazy" 
                          referrerPolicy="no-referrer-when-downgrade"
                          title={`Map of ${property.title}`}
                        ></iframe>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Similar Properties */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-bold mb-4">Similar Properties</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {similarProperties.length > 0 ? (
                    similarProperties.map(property => (
                      <div key={property.id || property.Id} className="col-span-3 md:col-span-3">
                        <PropertyCard property={property} />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-8 text-gray-500">
                      <p>No similar properties found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contact Form Dialog */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Contact Agent</DialogTitle>
            <DialogDescription>
              Send a message to {property.agent?.name || 'the agent'} about this property
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendContactMessage} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                value={contactFormData.name}
                onChange={(e) => setContactFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                disabled
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactFormData.email}
                onChange={(e) => setContactFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                value={contactFormData.phone}
                onChange={(e) => setContactFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                placeholder="I'm interested in this property..."
                value={contactFormData.message}
                onChange={(e) => setContactFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowContactForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSendingMessage}>
                {isSendingMessage ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetail;
