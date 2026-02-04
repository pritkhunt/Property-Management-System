import React, { useState, useEffect } from 'react';
import { Users, Search, CheckCircle, XCircle, Clock, Shield, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { agentAPI } from '../../../services/backendAPI';
import { useSocket } from '../../../context/SocketContext';
import toast from 'react-hot-toast';

const AdminAgents = () => {
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchAgents();
    fetchStats();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new agent registrations
    socket.on('new_agent_registration', (newAgent) => {
      console.log('📨 New agent registered:', newAgent);
      toast.success(`New agent registration: ${newAgent.name}`);
      fetchAgents();
      fetchStats();
    });

    // Listen for agent status updates
    socket.on('agent_status_updated', (updatedAgent) => {
      console.log('📨 Agent status updated:', updatedAgent);
      setAgents(prev => {
        const updated = prev.map(agent => 
          agent.id === updatedAgent.id ? updatedAgent : agent
        );
        // Re-sort after update to maintain newest first order
        return updated.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      });
      fetchStats();
    });

    return () => {
      socket.off('new_agent_registration');
      socket.off('agent_status_updated');
    };
  }, [socket]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await agentAPI.getAdminAgents();
      if (response.success) {
        // API returns lowercase field names, sorted by date descending
        setAgents(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await agentAPI.getAgentStats();
      if (response.success) {
        setStats({
          total: response.data.totalAgents || 0,
          active: response.data.approved || 0,
          pending: response.data.pending || 0,
          rejected: response.data.rejected || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching agent stats:', error);
    }
  };


  const handleApproveAgent = async (agentId) => {
    try {
      const response = await agentAPI.updateAgentStatus(agentId, 'approved');
      if (response.success) {
        toast.success('Agent approved successfully');
        fetchAgents();
        fetchStats();
      }
    } catch (error) {
      console.error('Error approving agent:', error);
      toast.error(error.response?.data?.message || 'Failed to approve agent');
    }
  };

  const handleRejectAgent = async (agentId) => {
    try {
      const response = await agentAPI.updateAgentStatus(agentId, 'rejected');
      if (response.success) {
        toast.success('Agent rejected');
        fetchAgents();
        fetchStats();
      }
    } catch (error) {
      console.error('Error rejecting agent:', error);
      toast.error(error.response?.data?.message || 'Failed to reject agent');
    }
  };

  const filteredAgents = agents.filter(agent => {
    if (filters.search && !agent.name?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !agent.email?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && agent.status !== filters.status) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const config = {
      approved: { variant: 'default', icon: CheckCircle, label: 'Approved' },
      pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
    };
    const { variant, icon: Icon, label } = config[status] || { variant: 'outline', icon: Shield, label: status };
    return (
      <Badge variant={variant}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Agents</h1>
        <p className="text-gray-600 mt-2">Review and approve agent registrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
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
              <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
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
                  placeholder="Search agents..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>Review agent applications and manage verifications</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border rounded">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAgents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {filters.search || filters.status ? 'No agents found matching your filters' : 'No agents registered yet'}
                </div>
              ) : (
                filteredAgents.map(agent => (
                  <div key={agent.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={agent.profilepic} alt={agent.name} />
                          <AvatarFallback>{agent.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{agent.name}</h3>
                            {getStatusBadge(agent.status)}
                          </div>
                          <p className="text-sm text-gray-600">{agent.email}</p>
                          <p className="text-sm text-gray-600">{agent.mobileno}</p>
                          <p className="text-sm text-gray-600">{agent.city}, {agent.state}</p>
                          <div className="flex gap-4 mt-2">
                            <div className="text-sm">
                              <span className="text-gray-500">Age:</span> {agent.age}
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Gender:</span> {agent.gender}
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Properties:</span> {agent.propertyCount || 0}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="default">
                              Rating: {agent.rating} ⭐
                            </Badge>
                            <Badge variant="outline">
                              {agent.specialization}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {agent.status === 'pending' && (
                          <>
                            <Button 
                              size="sm"
                              onClick={() => handleApproveAgent(agent.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRejectAgent(agent.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedAgent(agent);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Details Modal */}
      {showDetailsModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Agent Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 border-b pb-2">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{selectedAgent.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedAgent.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mobile Number</p>
                      <p className="font-medium">{selectedAgent.mobileno}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-medium">{selectedAgent.age}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium capitalize">{selectedAgent.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedAgent.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 border-b pb-2">Address Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Full Address</p>
                      <p className="font-medium">{selectedAgent.address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">City</p>
                      <p className="font-medium">{selectedAgent.city}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">State</p>
                      <p className="font-medium">{selectedAgent.state}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 border-b pb-2">Additional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Property Count</p>
                      <p className="font-medium">{selectedAgent.propertyCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
                      <p className="font-medium">{selectedAgent.rating} ⭐</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Specialization</p>
                      <p className="font-medium">{selectedAgent.specialization}</p>
                    </div>
                  </div>
                </div>

                {/* Agent ID */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 border-b pb-2">Agent ID</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">ID</p>
                      <p className="font-medium">#{selectedAgent.id}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedAgent.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        handleApproveAgent(selectedAgent.id);
                        setShowDetailsModal(false);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Agent
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleRejectAgent(selectedAgent.id);
                        setShowDetailsModal(false);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Agent
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAgents;
