/**
 * ============================================================================
 * Message Service (Frontend API & Socket.IO Real-Time Service Layer)
 * ============================================================================
 * Handles persistent campus conversation lifecycles and real-time Socket.IO
 * bidirectional event streams for student marketplace chat.
 * ============================================================================
 */

import { io } from 'socket.io-client';
import apiClient, { getStoredToken } from './apiClient';

let socketInstance = null;
const connectionListeners = new Set();
let inMemoryTokenGetter = null;

/**
 * Configure dynamic token provider for Socket.IO authentication.
 * @param {Function} getter - Async or sync function returning active Keycloak access token
 */
export const setTokenGetter = (getter) => {
  inMemoryTokenGetter = getter;
};

const resolveActiveToken = () => {
  if (typeof inMemoryTokenGetter === 'function') {
    return inMemoryTokenGetter();
  }
  return getStoredToken();
};

/**
 * Notify all subscribed UI components of socket connection state changes.
 * @param {'connected'|'connecting'|'disconnected'} state
 */
const notifyConnectionChange = (state) => {
  connectionListeners.forEach((listener) => {
    try {
      listener(state);
    } catch (err) {
      console.error('[Socket] Connection listener error:', err);
    }
  });
};

/**
 * Get or initialize the singleton authenticated Socket.IO client instance.
 * Synchronizes Keycloak access token in-memory.
 */
export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io({
      path: '/socket.io',
      auth: (cb) => {
        // Socket.io v4 dynamic auth callback support
        Promise.resolve(resolveActiveToken()).then((t) => {
          cb({ token: t || '' });
        });
      },
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      notifyConnectionChange('connected');
    });

    socketInstance.on('connecting', () => {
      notifyConnectionChange('connecting');
    });

    socketInstance.on('disconnect', () => {
      notifyConnectionChange('disconnected');
    });

    socketInstance.on('connect_error', () => {
      notifyConnectionChange('disconnected');
    });

    // Before every reconnect attempt, refresh token via Keycloak
    socketInstance.io.on('reconnect_attempt', async () => {
      const freshToken = await Promise.resolve(resolveActiveToken());
      if (freshToken) {
        socketInstance.auth = { token: freshToken };
      }
    });
  }

  return socketInstance;
};

/**
 * Explicitly connect the socket if an authenticated Keycloak session exists.
 */
export const connectSocket = async () => {
  const token = await Promise.resolve(resolveActiveToken());
  if (!token) return null;

  const socket = getSocket();
  if (!socket.connected) {
    notifyConnectionChange('connecting');
    socket.auth = { token };
    socket.connect();
  }
  return socket;
};

/**
 * Cleanly disconnect and tear down socket on user logout or session expiry.
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    notifyConnectionChange('disconnected');
  }
};

/**
 * Subscribe to socket connection state changes ('connected'|'connecting'|'disconnected').
 * Returns an unsubscribe callback.
 */
export const subscribeConnectionState = (listener) => {
  connectionListeners.add(listener);
  // Emit current known state immediately
  if (socketInstance?.connected) {
    listener('connected');
  } else {
    listener('disconnected');
  }

  return () => {
    connectionListeners.delete(listener);
  };
};

export const messageService = {
  // --------------------------------------------------------------------------
  // REST API Methods (Backed by PostgreSQL & Prisma)
  // --------------------------------------------------------------------------

  /**
   * Start a new conversation for a listing or retrieve the existing thread.
   * @param {string} listingId - Target marketplace listing ObjectId
   * @param {string} [initialMessage] - Optional introductory greeting text
   * @returns {Promise<{ conversation: Object }>}
   */
  startConversation: async (listingId, initialMessage = '') => {
    return apiClient.post('/messages/conversations', {
      listingId,
      initialMessage: initialMessage ? initialMessage.trim() : undefined,
    });
  },

  /**
   * Retrieve paginated conversations belonging to current student.
   * @param {number} [page=1]
   * @param {number} [limit=20]
   * @returns {Promise<{ conversations: Array, pagination: Object }>}
   */
  getConversations: async (page = 1, limit = 20) => {
    return apiClient.get('/messages/conversations', {
      params: { page, limit },
    });
  },

  /**
   * Retrieve message history for a specific conversation.
   * @param {string} conversationId
   * @param {number} [page=1]
   * @param {number} [limit=50]
   * @returns {Promise<{ messages: Array, conversation: Object, pagination: Object }>}
   */
  getMessages: async (conversationId, page = 1, limit = 50) => {
    return apiClient.get(`/messages/conversations/${conversationId}/messages`, {
      params: { page, limit },
    });
  },

  /**
   * Send a message to an active conversation via REST fallback.
   * @param {string} conversationId
   * @param {string} text
   * @returns {Promise<{ message: Object }>}
   */
  sendMessage: async (conversationId, text) => {
    return apiClient.post(`/messages/conversations/${conversationId}/messages`, {
      text: text.trim(),
    });
  },

  /**
   * Mark all unread incoming messages in a conversation as read.
   * @param {string} conversationId
   * @returns {Promise<{ modifiedCount: number }>}
   */
  markAsRead: async (conversationId) => {
    return apiClient.patch(`/messages/conversations/${conversationId}/read`, {});
  },

  // --------------------------------------------------------------------------
  // Socket.IO Real-Time Helper Methods
  // --------------------------------------------------------------------------

  setTokenGetter,
  getSocket,
  connectSocket,
  disconnectSocket,
  subscribeConnectionState,

  /**
   * Join an authorized conversation room.
   * @param {string} conversationId
   * @param {Function} [callback]
   */
  joinConversationRoom: (conversationId, callback) => {
    const socket = connectSocket();
    if (socket && conversationId) {
      socket.emit('conversation:join', { conversationId }, callback);
    }
  },

  /**
   * Leave a conversation room.
   * @param {string} conversationId
   */
  leaveConversationRoom: (conversationId) => {
    const socket = getSocket();
    if (socket && conversationId) {
      socket.emit('conversation:leave', { conversationId });
    }
  },

  /**
   * Send real-time message through authenticated Socket.IO channel.
   * Server persists message in PostgreSQL database before broadcasting.
   *
   * @param {string} conversationId
   * @param {string} text
   * @param {Function} [callback] - (response: { success: boolean, message?: Object, error?: string })
   */
  sendSocketMessage: (conversationId, text, callback) => {
    const socket = connectSocket();
    if (socket) {
      socket.emit(
        'message:send',
        {
          conversationId,
          text: text.trim(),
        },
        callback
      );
    }
  },

  /**
   * Emit real-time read event to update partner's UI in the conversation room.
   * @param {string} conversationId
   */
  sendSocketRead: (conversationId) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('message:read', { conversationId });
    }
  },
};

export default messageService;
