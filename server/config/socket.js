/**
 * server/config/socket.js
 *
 * Socket.io Initialization & Config — Phase M3
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import Conversation from '../models/marketplace/Conversation.js';
import Message from '../models/marketplace/Message.js';
import MarketplaceNotification from '../models/marketplace/MarketplaceNotification.js';

let io = null;
const onlineSocketCounts = new Map();

function incrementOnlineSocketCount(userId) {
  const key = userId.toString();
  const nextCount = (onlineSocketCounts.get(key) || 0) + 1;
  onlineSocketCounts.set(key, nextCount);
  return nextCount;
}

function decrementOnlineSocketCount(userId) {
  const key = userId.toString();
  const nextCount = Math.max((onlineSocketCounts.get(key) || 1) - 1, 0);

  if (nextCount === 0) {
    onlineSocketCounts.delete(key);
  } else {
    onlineSocketCounts.set(key, nextCount);
  }

  return nextCount;
}

function emitPresenceToRooms(socket, eventName, roomIds, userId) {
  if (!roomIds?.length || !userId) return;
  socket.to(roomIds).emit(eventName, { userId: userId.toString() });
}

function emitCurrentlyOnlineParticipants(socket, conversations, currentUserId) {
  const currentId = currentUserId.toString();
  const onlineParticipantIds = new Set();

  conversations.forEach((conversation) => {
    [conversation.owner, conversation.builder].forEach((participantId) => {
      const id = participantId?.toString();
      if (id && id !== currentId && onlineSocketCounts.has(id)) {
        onlineParticipantIds.add(id);
      }
    });
  });

  onlineParticipantIds.forEach((userId) => {
    socket.emit('user_online', { userId });
  });
}

export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId)
        .select('-passwordHash');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.userId = user._id.toString();
      socket.data.userMongoId = user._id;
      socket.data.role = user.role;
      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('Socket connected:', socket.id);

    try {
      const user = socket.data.user;
      
      // Join a user-specific room for notifications
      socket.join(`user:${user._id}`);

      // Fetch all conversations where this user is owner or builder
      const conversations = await Conversation.find({
        $or: [
          { owner: user._id },
          { builder: user._id }
        ]
      }).select('_id owner builder');

      // Join a room for each conversation
      const roomIds = conversations.map(c => `conversation:${c._id.toString()}`);
      socket.join(roomIds);
      socket.data.conversationRoomIds = roomIds;
      console.log(`User ${user._id} joined ${roomIds.length} conversation rooms`);

      if (incrementOnlineSocketCount(user._id) === 1) {
        emitPresenceToRooms(socket, 'user_online', roomIds, user._id);
      }
      emitCurrentlyOnlineParticipants(socket, conversations, user._id);

    } catch (err) {
      console.error('Socket setup failed:', err.message);
      socket.disconnect();
      return;
    }

    // Handle joining a NEW conversation room after a proposal is approved
    socket.on('join_conversation', async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId)
          .select('owner builder')
          .lean();

        if (!conversation) return;

        // Verify user is a participant
        const userId = socket.data.userMongoId.toString();
        const isParticipant =
          conversation.owner.toString() === userId ||
          conversation.builder.toString() === userId;

        if (!isParticipant) return;

        const roomId = `conversation:${conversationId}`;
        socket.join(roomId);
        socket.data.conversationRoomIds = Array.from(
          new Set([...(socket.data.conversationRoomIds || []), roomId])
        );
        socket.to(roomId).emit('user_online', { userId: socket.data.userMongoId });
        emitCurrentlyOnlineParticipants(socket, [conversation], socket.data.userMongoId);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
      } catch (err) {
        console.error('Failed to join conversation:', err);
      }
    });

    // EVENT: send_message
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, content, messageType, fileUrl } = data;

        // 1. Verify the sender is a participant in this conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return callback({ error: 'Conversation not found' });
        }

        const isParticipant =
          conversation.owner.toString() === socket.data.userMongoId.toString() ||
          conversation.builder.toString() === socket.data.userMongoId.toString();

        if (!isParticipant) {
          return callback({ error: 'Not a participant' });
        }

        // 2. Validate content
        if (!content && messageType === 'text') {
          return callback({ error: 'Message content required' });
        }

        // 3. Save to MongoDB
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.data.userMongoId,
          content,
          messageType: messageType || 'text',
          fileUrl: fileUrl || null,
          readBy: [socket.data.userMongoId]
        });

        // 4. Populate sender for the emit
        await message.populate('sender', 'name');

        // 5. Emit to the conversation room (all participants including sender)
        io.to(`conversation:${conversationId}`).emit('new_message', message);

        // 6. Create notification for the OTHER participant
        const recipientId =
          conversation.owner.toString() === socket.data.userMongoId.toString()
            ? conversation.builder
            : conversation.owner;

        await MarketplaceNotification.create({
          recipient: recipientId,
          type: 'new_message',
          message: 'You have a new message',
          relatedProject: conversation.project
        });

        // 7. Emit notification to the recipient's socket
        emitNotificationUpdate(recipientId);

        // 8. Acknowledge success to the sender
        callback({ success: true, message });
      } catch (err) {
        console.error('send_message error:', err);
        callback({ error: 'Failed to send message' });
      }
    });

    // EVENT: typing_start and typing_stop
    socket.on('typing_start', ({ conversationId }) => {
      // Emit to OTHER participants in the room only
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.data.userMongoId,
        isTyping: true
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.data.userMongoId,
        isTyping: false
      });
    });

    // EVENT: mark_read
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        await Message.updateMany(
          {
            conversation: conversationId,
            readBy: { $ne: socket.data.userMongoId }
          },
          { $addToSet: { readBy: socket.data.userMongoId } }
        );
        // Notify other participant that messages were read
        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: socket.data.userMongoId
        });
      } catch (err) {
        console.error('mark_read error:', err);
      }
    });

    socket.on('disconnecting', () => {
      const remainingSockets = decrementOnlineSocketCount(socket.data.userMongoId);
      if (remainingSockets === 0) {
        emitPresenceToRooms(
          socket,
          'user_offline',
          socket.data.conversationRoomIds || [],
          socket.data.userMongoId
        );
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

// Helper function to emit notification updates
export function emitNotificationUpdate(recipientId) {
  if (io) {
    io.to(`user:${recipientId}`).emit('notification_update', { recipientId });
  }
}

