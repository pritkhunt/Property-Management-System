import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { chatAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ChatWindow = ({ otherUser, onClose }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Determine sender and receiver types
  const senderType = user.userType || user.role; // 'user' or 'agent'
  const receiverType = senderType === 'user' ? 'agent' : 'user';

  // Fetch initial history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!otherUser?.Id && !otherUser?.id) return;
      
      try {
        setIsLoading(true);
        const response = await chatAPI.getHistory(otherUser.Id || otherUser.id);
        if (response.data.success) {
          setMessages(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [otherUser?.Id, otherUser?.id]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Join chat room (optional, but good for specific room logic)
    // const roomId = `chat:${[user.id, otherUser.id].sort().join('-')}`;
    // socket.emit('chat:join', roomId);

    const handleReceiveMessage = (message) => {
      console.log('📩 Message received:', message);
      // Only add if it belongs to this conversation
      if (
        (message.senderId === (otherUser.Id || otherUser.id) && message.senderType === receiverType) ||
        (message.senderId === (user.id || user.Id) && message.senderType === senderType)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('chat:receive', handleReceiveMessage);

    return () => {
      socket.off('chat:receive', handleReceiveMessage);
      // socket.emit('chat:leave', roomId);
    };
  }, [socket, user.id, user.Id, otherUser.Id, otherUser.id, senderType, receiverType]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected) return;

    // Debug: Check user and otherUser objects
    console.log('🔍 Sending message - User:', user);
    console.log('🔍 Sending message - Other User:', otherUser);
    
    // Try multiple possible field names for user ID
    const userId = user.id || user.Id || user.ID || user.userId;
    const receiverId = otherUser.Id || otherUser.id || otherUser.ID;
    
    if (!userId || !receiverId) {
      console.error('❌ Missing user IDs:', { 
        userId, 
        receiverId,
        userKeys: Object.keys(user),
        otherUserKeys: Object.keys(otherUser)
      });
      toast.error('Unable to send message - missing user information');
      return;
    }

    const messageData = {
      senderId: userId,
      receiverId: receiverId,
      senderType: senderType,
      receiverType: receiverType,
      message: newMessage.trim(),
      // room: `chat:${[userId, receiverId].sort().join('-')}` // Optional room
    };
    
    console.log('📤 Sending message data:', messageData);

    try {
      setIsSending(true);
      // Optimistic update (optional, but socket usually echoes back quickly)
      // setMessages(prev => [...prev, { ...messageData, CreatedAt: new Date().toISOString() }]);
      
      socket.emit('chat:send', messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!otherUser) {
    return (
      <Card className="h-[600px] flex items-center justify-center text-muted-foreground">
        Select a conversation to start chatting
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b p-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUser.ProfilePic || otherUser.ProfileImage || otherUser.image} />
            <AvatarFallback>{otherUser.Name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{otherUser.Name}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {isConnected ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-muted-foreground opacity-50">
              <p>No messages yet</p>
              <p className="text-sm">Say hello to start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.SenderId === (user.id || user.Id) && msg.SenderType === senderType;
              return (
                <div
                  key={index}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.Message}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.CreatedAt), 'HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={!isConnected || isSending}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!isConnected || isSending || !newMessage.trim()}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatWindow;
