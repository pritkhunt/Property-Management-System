import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Star, Building, Calendar, Shield, Award, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import PropertyCard from '../components/property/PropertyCard';
import { agentAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const AgentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [agent, setAgent] = useState(null);
  const [properties, setProperties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAgentData();
  }, [id]);

  const fetchAgentData = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching agent profile for ID:', id);
      const [agentRes, propertiesRes] = await Promise.all([
        agentAPI.getAgentById(id),
        agentAPI.getAgentProperties(id),
      ]);
      
      console.log('✅ Agent response:', agentRes.data);
      console.log('✅ Properties response:', propertiesRes.data);
      
      // Backend returns { success: true, data: {...} }
      const agentData = agentRes.data?.data || null;
      const propertiesData = propertiesRes.data?.data?.properties || [];
      
      console.log('✅ Agent data:', agentData);
      console.log('✅ Properties count:', propertiesData.length);
      
      setAgent(agentData);
      setProperties(propertiesData);
      setReviews([]); // TODO: Fetch real reviews when implemented
    } catch (error) {
      console.error('❌ Error fetching agent data:', error);
      setAgent(null);
      setProperties([]);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  // No mock data - all data fetched from database

  const handleContactAgent = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Handle contact logic
  };

  const handleStartChat = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/dashboard/messages', { state: { selectedAgent: agent } });
  };

  const handleSendMessage = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!message.trim()) return;
    
    // Instead of just logging, let's navigate to chat with the message
    // Ideally we would send the message first, but for now let's just go to chat
    navigate('/dashboard/messages', { state: { selectedAgent: agent } });
    setMessage('');
  };

  const getRatingStars = (rating = 5) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="h-5 w-5 fill-yellow-400/50 text-yellow-400" />
        );
      } else {
        stars.push(
          <Star key={i} className="h-5 w-5 text-gray-300" />
        );
      }
    }
    return stars;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Agent Not Found</h2>
          <p className="text-gray-600">The agent you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => navigate('/agents')}>View All Agents</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Agent Header */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-start gap-6">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={agent?.profilepic} alt={agent?.name} />
                  <AvatarFallback className="text-2xl">
                    {agent?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold">{agent?.name}</h1>
                    {agent?.status === 'verified' && (
                      <Badge variant="default">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center mb-3">
                    {getRatingStars(agent?.rating)}
                    <span className="ml-2 text-gray-600">
                      {agent?.rating} ({agent?.totalReviews} reviews)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {agent?.city}, {agent?.state}
                    </div>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      {agent?.propertyCount} Properties
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {agent?.experience} Experience
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">
                    {agent?.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">
                      Languages: {agent?.languages}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Card className="lg:w-80">
              <CardHeader>
                <CardTitle>Contact Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-600" />
                    {agent?.mobileno}
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-600" />
                    {agent?.email}
                  </div>
                  <div className="flex items-start text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-600 mt-0.5" />
                    <span>{agent?.address}</span>
                  </div>
                </div>
                <Button className="w-full" onClick={handleContactAgent}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call Now
                </Button>
                <Button variant="outline" className="w-full" onClick={handleStartChat}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <div className="mt-6">
                <h2 className="text-2xl font-bold mb-6">Listed Properties ({properties.length})</h2>
                {properties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8">
                    <div className="text-center">
                      <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No properties listed yet</p>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About {agent?.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Specialization</h3>
                    <p className="text-gray-600">{agent?.specialization}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Languages</h3>
                    <p className="text-gray-600">{agent?.languages}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Experience</h3>
                    <p className="text-gray-600">{agent?.experience} in real estate</p>
                  </div>

                  {agent?.achievements && (
                    <div>
                      <h3 className="font-semibold mb-2">Achievements</h3>
                      <ul className="space-y-2">
                        {agent.achievements.map((achievement, index) => (
                          <li key={index} className="flex items-center text-gray-600">
                            <Award className="h-4 w-4 mr-2 text-primary" />
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Customer Reviews ({reviews.length})</h2>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage src={review.profilepic} alt={review.name} />
                              <AvatarFallback>{review.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold">{review.name}</h4>
                                  <div className="flex items-center">
                                    {getRatingStars(review.rating)}
                                  </div>
                                </div>
                                <span className="text-sm text-gray-500">{review.date}</span>
                              </div>
                              <p className="text-gray-600">{review.comment}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No reviews yet</p>
                      <p className="text-sm text-gray-500 mt-2">Be the first to review this agent!</p>
                    </div>
                  </Card>
                )}              </div>
            </TabsContent>

            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Send a Message</CardTitle>
                  <CardDescription>
                    Get in touch with {agent?.name} directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Hi, I'm interested in..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <Button onClick={handleSendMessage} className="w-full">
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default AgentProfile;
