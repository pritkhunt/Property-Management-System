import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { chatAPI } from '../../../services/api';
import ChatWindow from '../../../components/chat/ChatWindow';
import { formatDistanceToNow } from 'date-fns';

const UserMessages = () => {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle navigation from Agent Profile "Send Message"
  useEffect(() => {
    if (location.state?.selectedAgent) {
      // If we have a selected agent passed via navigation, set it as selected
      // We might need to add it to the list if it's not there yet, but for now let's assume
      // the user will appear in the list or we just open the chat window directly.
      // A better approach is to check if this agent is in conversations, if not, create a temporary one.
      const agent = location.state.selectedAgent;
      const existingConv = conversations.find(c => c.Id === agent.Id);
      
      if (existingConv) {
        setSelectedConversation(existingConv);
      } else {
        // Create temp conversation object matching the API structure
        setSelectedConversation({
          Id: agent.Id,
          Name: agent.Name,
          ProfilePic: agent.ProfilePic,
          // Other fields might be missing but ChatWindow mainly needs Id and Name
        });
      }
    }
  }, [location.state, conversations]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await chatAPI.getConversations();
      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.Name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-gray-600 mt-2">Communicate with property agents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col h-full">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations found</div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map(conv => (
                  <div
                    key={conv.Id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
                      selectedConversation?.Id === conv.Id ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={conv.ProfileImage} alt={conv.Name} />
                          <AvatarFallback>{conv.Name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold truncate">{conv.Name}</p>
                            <p className="text-sm text-gray-600 truncate">{conv.Email}</p>
                          </div>
                          {conv.LastMessageTime && (
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatDistanceToNow(new Date(conv.LastMessageTime), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm text-gray-600 truncate">{conv.LastMessage || 'No messages yet'}</p>
                          {/* Unread count would require DB support, skipping for now */}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Window */}
        <div className="lg:col-span-2 h-full">
          {selectedConversation ? (
            <ChatWindow 
              otherUser={{
                Id: selectedConversation.Id,
                Name: selectedConversation.Name,
                ProfilePic: selectedConversation.ProfilePic
              }} 
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-gray-600">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMessages;
