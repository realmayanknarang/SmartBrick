/**
 * client/src/hooks/useSocket.js
 *
 * Custom hook to interface with the Socket.io client.
 * Uses a singleton connection instance to avoid opening redundant connections.
 */

import { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

const getSocket = () => {
  if (!socketInstance) {
    // Determine the socket server URL by stripping /api from the VITE_API_URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const socketUrl = apiUrl.replace(/\/api$/, '');
    socketInstance = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });
  }
  return socketInstance;
};

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  if (!socketRef.current) {
    socketRef.current = getSocket();
  }

  const socket = socketRef.current;

  // Track connection status
  useEffect(() => {
    const handleConnect = () => {
      console.log('Socket connected');
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set initial connection status
    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  /**
   * Listen for "notification_update" events.
   * Returns a cleanup function to unsubscribe.
   *
   * @param {function} callback - Called with ({ recipientId })
   * @returns {function} cleanup function
   */
  const onNotificationUpdate = (callback) => {
    socket.on('notification_update', callback);
    return () => {
      socket.off('notification_update', callback);
    };
  };

  /**
   * Join a conversation room.
   * @param {string} conversationId
   */
  const joinConversation = (conversationId) => {
    socket.emit('join_conversation', conversationId);
  };

  /**
   * Send a message to the server (for chat).
   * Note: We use the REST API for sending messages, not socket directly.
   * This is just a placeholder for future use if needed.
   * @param {string} conversationId
   * @param {string} content
   */
  const sendMessage = (conversationId, content) => {
    socket.emit('send_message', { conversationId, content });
  };

  /**
   * Listen for new messages in a conversation.
   * @param {function} callback - Called with ({ message })
   * @returns {function} cleanup function
   */
  const onNewMessage = (callback) => {
    socket.on('new_message', callback);
    return () => {
      socket.off('new_message', callback);
    };
  };

  /**
   * Send typing start event.
   * @param {string} conversationId
   */
  const startTyping = (conversationId) => {
    socket.emit('typing_start', conversationId);
  };

  /**
   * Send typing stop event.
   * @param {string} conversationId
   */
  const stopTyping = (conversationId) => {
    socket.emit('typing_stop', conversationId);
  };

  /**
   * Listen for typing start events from other users.
   * @param {function} callback - Called with ({ userId })
   * @returns {function} cleanup function
   */
  const onTypingStart = (callback) => {
    socket.on('typing_start', callback);
    return () => {
      socket.off('typing_start', callback);
    };
  };

  /**
   * Listen for typing stop events from other users.
   * @param {function} callback - Called with ({ userId })
   * @returns {function} cleanup function
   */
  const onTypingStop = (callback) => {
    socket.on('typing_stop', callback);
    return () => {
      socket.off('typing_stop', callback);
    };
  };

  return {
    socket,
    connected,
    onNotificationUpdate,
    joinConversation,
    sendMessage,
    onNewMessage,
    startTyping,
    stopTyping,
    onTypingStart,
    onTypingStop,
  };
}
