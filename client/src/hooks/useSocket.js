/**
 * client/src/hooks/useSocket.js
 *
 * Custom hook to interface with the Socket.io client.
 * Uses a singleton connection instance to avoid opening redundant connections.
 */

import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '@clerk/clerk-react'

export function useSocket() {
  const { getToken } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let socket

    async function connect() {
      try {
        // Get the current Clerk session token
        const token = await getToken()
        if (!token) return

        socket = io(
          import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001',
          {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
          }
        )

        socket.on('connect', () => {
          setConnected(true)
          setError(null)
          console.log('Socket connected:', socket.id)
        })

        socket.on('disconnect', (reason) => {
          setConnected(false)
          console.log('Socket disconnected:', reason)
        })

        socket.on('connect_error', (err) => {
          setError(err.message)
          setConnected(false)
          console.error('Socket connection error:', err.message)
        })

        socketRef.current = socket
      } catch (err) {
        setError(err.message)
      }
    }

    connect()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [getToken])

  // Expose methods for chat UI to use
  const sendMessage = (conversationId, content, messageType = 'text', fileUrl = null) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Not connected'))
        return
      }
      socketRef.current.emit(
        'send_message',
        { conversationId, content, messageType, fileUrl },
        (response) => {
          if (response.error) reject(new Error(response.error))
          else resolve(response.message)
        }
      )
    })
  }

  const joinConversation = (conversationId) => {
    socketRef.current?.emit('join_conversation', conversationId)
  }

  const startTyping = (conversationId) => {
    socketRef.current?.emit('typing_start', { conversationId })
  }

  const stopTyping = (conversationId) => {
    socketRef.current?.emit('typing_stop', { conversationId })
  }

  const markRead = (conversationId) => {
    socketRef.current?.emit('mark_read', { conversationId })
  }

  const onNewMessage = (callback) => {
    socketRef.current?.on('new_message', callback)
    return () => socketRef.current?.off('new_message', callback)
  }

  const onTyping = (callback) => {
    socketRef.current?.on('user_typing', callback)
    return () => socketRef.current?.off('user_typing', callback)
  }

  const onMessagesRead = (callback) => {
    socketRef.current?.on('messages_read', callback)
    return () => socketRef.current?.off('messages_read', callback)
  }

  const onNotificationUpdate = (callback) => {
    socketRef.current?.on('notification_update', callback)
    return () => socketRef.current?.off('notification_update', callback)
  }

  return {
    socket: socketRef.current,
    connected,
    error,
    sendMessage,
    joinConversation,
    startTyping,
    stopTyping,
    markRead,
    onNewMessage,
    onTyping,
    onMessagesRead,
    onNotificationUpdate
  }
}
