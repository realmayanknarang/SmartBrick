/**
 * client/src/hooks/useSocket.js
 *
 * Custom hook to interface with the Socket.io client.
 * Uses a singleton connection instance to avoid opening redundant connections.
 */

import { useRef } from 'react';
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

  if (!socketRef.current) {
    socketRef.current = getSocket();
  }

  /**
   * Listen for "notification_update" events.
   * Returns a cleanup function to unsubscribe.
   *
   * @param {function} callback - Called with ({ recipientId })
   * @returns {function} cleanup function
   */
  const onNotificationUpdate = (callback) => {
    const socket = socketRef.current;
    socket.on('notification_update', callback);
    return () => {
      socket.off('notification_update', callback);
    };
  };

  return {
    socket: socketRef.current,
    onNotificationUpdate,
  };
}
