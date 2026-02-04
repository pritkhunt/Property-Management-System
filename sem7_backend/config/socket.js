const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('⚠️  Socket connection attempt without token');
      return next();  // Allow unauthenticated connections for public updates
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      console.log('✅ Socket authenticated:', decoded.email, '- Type:', decoded.userType);
      next();
    } catch (error) {
      console.error('❌ Socket auth error:', error.message);
      return next();  // Allow connection even if token verification fails
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    if (socket.user) {
      const { id, userType } = socket.user;
      
      // Join user-specific room
      socket.join(`user:${id}`);
      console.log(`   Joined room: user:${id}`);
      
      // Join role-specific rooms
      if (userType === 'admin') {
        socket.join('admins');
        console.log('   Joined room: admins');
      } else if (userType === 'agent') {
        socket.join('agents');
        console.log('   Joined room: agents');
      } else if (userType === 'user') {
        socket.join('users');
        console.log('   Joined room: users');
      }
    }

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });

    // Test event
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Event emitters for different notification types
const emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
    console.log(`📨 Notification sent to user:${userId}`);
  }
};

const emitToAdmins = (event, data) => {
  if (io) {
    io.to('admins').emit(event, data);
    console.log(`📨 Event '${event}' sent to admins`);
  }
};

const emitToAgents = (event, data) => {
  if (io) {
    io.to('agents').emit(event, data);
    console.log(`📨 Event '${event}' sent to agents`);
  }
};

const emitToUsers = (event, data) => {
  if (io) {
    io.to('users').emit(event, data);
    console.log(`📨 Event '${event}' sent to users`);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
    console.log(`📨 Event '${event}' broadcast to all`);
  }
};

// Chat helper to save message to DB
const saveMessageToDB = async (messageData) => {
  const { runQuery } = require('./database');
  try {
    const query = `
      INSERT INTO Messages (SenderId, ReceiverId, Message, SenderType, ReceiverType, CreatedAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `;
    const result = await runQuery(query, [
      messageData.senderId,
      messageData.receiverId,
      messageData.message,
      messageData.senderType,
      messageData.receiverType
    ]);
    return result.id;
  } catch (error) {
    console.error('Error saving message to DB:', error);
    return null;
  }
};

module.exports = {
  initializeSocket: (server) => {
    io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Authentication middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.log('⚠️  Socket connection attempt without token');
        return next();  // Allow unauthenticated connections for public updates
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        console.log('✅ Socket authenticated:', decoded.email, '- Type:', decoded.userType);
        next();
      } catch (error) {
        console.error('❌ Socket auth error:', error.message);
        return next();  // Allow connection even if token verification fails
      }
    });

    io.on('connection', (socket) => {
      console.log('🔌 Client connected:', socket.id);
      
      if (socket.user) {
        const { id, userType } = socket.user;
        
        // Join user-specific room
        socket.join(`user:${id}`);
        console.log(`   Joined room: user:${id}`);
        
        // Join role-specific rooms
        if (userType === 'admin') {
          socket.join('admins');
        } else if (userType === 'agent') {
          socket.join('agents');
        } else if (userType === 'user') {
          socket.join('users');
        }
      }

      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
      });

      // Test event
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // ==========================================
      // CHAT EVENTS
      // ==========================================

      // Join a chat room
      socket.on('chat:join', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined chat room: ${room}`);
      });

      // Leave a chat room
      socket.on('chat:leave', (room) => {
        socket.leave(room);
        console.log(`Socket ${socket.id} left chat room: ${room}`);
      });

      // Send a message
      socket.on('chat:send', async (data) => {
        console.log('📨 Chat message received:', data);
        
        // 1. Save to database
        const messageId = await saveMessageToDB(data);
        
        if (messageId) {
          const messageWithId = { ...data, id: messageId, createdAt: new Date().toISOString() };
          
          // 2. Emit to the specific chat room (both users should be in this room)
          // Room format: chat:minId-maxId (to ensure unique room for pair)
          // But simpler: emit to receiver's user room AND sender's user room
          
          // Emit to receiver
          io.to(`user:${data.receiverId}`).emit('chat:receive', messageWithId);
          
          // Emit back to sender (for confirmation and immediate display)
          socket.emit('chat:receive', messageWithId);
          
          // Also emit to the specific conversation room if we use that strategy
          if (data.room) {
            socket.to(data.room).emit('chat:receive', messageWithId);
          }
          
          console.log(`✅ Message saved and emitted to user:${data.receiverId}`);
        }
      });

      // Typing indicator
      socket.on('chat:typing', (data) => {
        // data = { receiverId, isTyping }
        io.to(`user:${data.receiverId}`).emit('chat:typing', {
          senderId: socket.user?.id,
          isTyping: data.isTyping
        });
      });
    });

    console.log('✅ Socket.IO initialized');
    return io;
  },
  getIO,
  emitNotification,
  emitToAdmins,
  emitToAgents,
  emitToUsers,
  emitToAll
};
