/**
 * server/config/socket.js
 *
 * Socket.io Initialization & Config — Phase M3
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Server } from 'socket.io';
import { getAuth } from '@clerk/express';
import User from '../models/User.js';
import Conversation from '../models/marketplace/Conversation.js';

let io = null;

export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', async (socket) => {
    console.log('Socket connected:', socket.id);

    try {
      // Use Clerk's getAuth with the socket handshake request
      const { userId } = getAuth(socket.request);
      if (!userId) {
        throw new Error('Unauthorized: No Clerk session found');
      }

      // Look up user in MongoDB
      const user = await User.findOne({ clerkUserId: userId })
        .select('_id role')
        .lean();
      
      if (!user) {
        throw new Error('Unauthorized: No user found');
      }

      // Attach user to socket
      socket.user = user;

      // Join a user-specific room for notifications
      socket.join(`user:${user._id}`);

      console.log(`Socket ${socket.id} authenticated as user ${user._id}`);
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      socket.disconnect();
      return;
    }

    // Handle joining a conversation room
    socket.on('join_conversation', async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId)
          .select('owner builder')
          .lean();
        
        if (!conversation) return;

        // Verify user is a participant
        const userId = socket.user._id.toString();
        const isParticipant = 
          conversation.owner.toString() === userId || 
          conversation.builder.toString() === userId;
        
        if (!isParticipant) return;

        socket.join(`conversation:${conversationId}`);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
      } catch (err) {
        console.error('Failed to join conversation:', err);
      }
    });

    // Handle typing events
    socket.on('typing_start', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('typing_start', {
        userId: socket.user._id
      });
    });

    socket.on('typing_stop', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('typing_stop', {
        userId: socket.user._id
      });
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
