import { Server } from 'socket.io';
import config from '../config/environment.js';
import { prisma } from '../config/database.js';
import { verifyKeycloakToken } from '../services/keycloakService.js';
import { findOrCreateUserFromKeycloak } from '../services/userService.js';
import { isValidUUID, fromDbEnum } from '../constants/marketplace.js';
import { createMessage, markConversationAsRead } from '../services/messageService.js';

let ioInstance = null;

// Per-user sliding-window rate limiter for Socket.IO message sends (30 messages / 60 seconds)
const userMessageRateMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_MESSAGES = 30;

const checkSocketRateLimit = (userId) => {
  const now = Date.now();
  let timestamps = userMessageRateMap.get(userId) || [];
  // Filter out timestamps older than the window
  timestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
    userMessageRateMap.set(userId, timestamps);
    return false;
  }

  timestamps.push(now);
  userMessageRateMap.set(userId, timestamps);
  return true;
};

/**
 * Initialize and attach Socket.IO server to HTTP server.
 * Enforces Keycloak authentication, active status verification, and participant room authorization.
 *
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
export const initSocketServer = (httpServer) => {
  if (ioInstance) {
    return ioInstance;
  }

  const allowedOrigins = [
    config.clientUrl,
    !config.isProduction ? 'http://localhost:5173' : null,
    !config.isProduction ? 'http://127.0.0.1:5173' : null,
  ].filter(Boolean);

  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin "${origin}" not allowed by Socket.IO CORS.`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // ==============================================================================
  // 1. HANDSHAKE AUTHENTICATION MIDDLEWARE
  // ==============================================================================
  ioInstance.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Fallback check in authorization header
      if (!token && socket.handshake.headers?.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7).trim();
        }
      }

      if (!token || typeof token !== 'string') {
        return next(new Error('AUTHENTICATION_REQUIRED: No token provided in handshake.'));
      }

      // Verify token signature and claims via Keycloak
      let decoded;
      try {
        decoded = await verifyKeycloakToken(token);
      } catch (err) {
        return next(new Error(`INVALID_TOKEN: ${err.message || 'Token signature or structure is invalid.'}`));
      }

      if (!decoded || !decoded.sub) {
        return next(new Error('INVALID_TOKEN: Token payload missing user identifier.'));
      }

      // Check current user state in database or provision
      const user = await findOrCreateUserFromKeycloak(decoded);

      if (!user) {
        return next(new Error('USER_NOT_FOUND: User account does not exist.'));
      }

      const status = fromDbEnum(user.accountStatus);
      if (status === 'banned') {
        return next(new Error('ACCOUNT_BANNED: Your account has been permanently banned.'));
      }

      if (status === 'suspended') {
        return next(new Error('ACCOUNT_SUSPENDED: Your account is suspended.'));
      }

      // Enforce Keycloak email verification (must verify email ownership before marketplace actions)
      if (!decoded.email_verified) {
        return next(
          new Error('KEYCLOAK_EMAIL_UNVERIFIED: Please verify your email address before connecting to real-time messaging.')
        );
      }

      if (!user.isVerified) {
        return next(
          new Error('UNVERIFIED_COLLEGE_USER: Institutional college email verification required.')
        );
      }

      // Attach authenticated identity to socket
      socket.userId = user.id;
      socket.keycloakUserId = user.keycloakUserId;
      socket.userName = user.name;
      socket.college = user.college;

      next();
    } catch (error) {
      next(new Error(`AUTHENTICATION_FAILED: ${error.message || 'Handshake failed.'}`));
    }
  });

  // ==============================================================================
  // 2. SOCKET CONNECTION & EVENT DISPATCHER
  // ==============================================================================
  ioInstance.on('connection', (socket) => {
    // Automatically join the user's personal notification room
    socket.join(`user:${socket.userId}`);

    // --------------------------------------------------------------------------
    // EVENT: conversation:join
    // Verifies participant authorization before allowing room entry
    // --------------------------------------------------------------------------
    socket.on('conversation:join', async (payload, callback) => {
      try {
        const conversationId = typeof payload === 'string' ? payload : payload?.conversationId;

        if (
          !conversationId ||
          typeof conversationId !== 'string' ||
          !isValidUUID(conversationId.trim())
        ) {
          const errResponse = { success: false, error: 'INVALID_CONVERSATION_ID' };
          if (typeof callback === 'function') callback(errResponse);
          return socket.emit('error', errResponse);
        }

        const validId = conversationId.trim();

        // Strict authorization: user MUST be one of the participants
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: validId,
            participants: {
              some: {
                userId: socket.userId,
              },
            },
          },
        });

        if (!conversation) {
          const notFoundResponse = {
            success: false,
            error: 'CONVERSATION_NOT_FOUND',
            message: 'Conversation not found or you are not an authorized participant.',
          };
          if (typeof callback === 'function') callback(notFoundResponse);
          return socket.emit('error', notFoundResponse);
        }

        const roomName = `conversation:${validId}`;
        socket.join(roomName);

        const successResponse = { success: true, conversationId: validId };
        if (typeof callback === 'function') callback(successResponse);
      } catch (err) {
        const serverErr = { success: false, error: 'JOIN_ERROR', message: err.message };
        if (typeof callback === 'function') callback(serverErr);
        socket.emit('error', serverErr);
      }
    });

    // --------------------------------------------------------------------------
    // EVENT: conversation:leave
    // Leaves the conversation room
    // --------------------------------------------------------------------------
    socket.on('conversation:leave', (payload, callback) => {
      try {
        const conversationId = typeof payload === 'string' ? payload : payload?.conversationId;
        if (conversationId && typeof conversationId === 'string') {
          socket.leave(`conversation:${conversationId.trim()}`);
        }
        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // --------------------------------------------------------------------------
    // EVENT: message:send
    // Flow: Validate -> Rate-limit -> Persist to PostgreSQL -> Emit message:new
    // --------------------------------------------------------------------------
    socket.on('message:send', async (payload, callback) => {
      try {
        if (!payload || typeof payload !== 'object') {
          const err = { success: false, error: 'INVALID_PAYLOAD', message: 'Payload must be an object.' };
          if (typeof callback === 'function') callback(err);
          return socket.emit('error', err);
        }

        const { conversationId, text } = payload;

        // 1. Validate conversationId
        if (
          !conversationId ||
          typeof conversationId !== 'string' ||
          !isValidUUID(conversationId.trim())
        ) {
          const err = { success: false, error: 'INVALID_CONVERSATION_ID', message: 'Invalid conversation identifier.' };
          if (typeof callback === 'function') callback(err);
          return socket.emit('error', err);
        }

        // 2. Validate message text
        if (text === undefined || text === null || typeof text !== 'string') {
          const err = { success: false, error: 'INVALID_MESSAGE', message: 'Message text is required and must be a string.' };
          if (typeof callback === 'function') callback(err);
          return socket.emit('error', err);
        }

        const trimmedText = text.trim();
        if (trimmedText.length === 0 || trimmedText.length > 1000) {
          const err = {
            success: false,
            error: 'INVALID_MESSAGE_LENGTH',
            message: 'Message must be between 1 and 1000 characters.',
          };
          if (typeof callback === 'function') callback(err);
          return socket.emit('error', err);
        }

        // 3. Check anti-spam rate limit
        if (!checkSocketRateLimit(socket.userId)) {
          const err = {
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'You are sending messages too quickly. Please wait a moment.',
          };
          if (typeof callback === 'function') callback(err);
          return socket.emit('error', err);
        }

        const cleanConvId = conversationId.trim();

        // 4. Persistence First in PostgreSQL (verifies participant authorization inside createMessage)
        const messageDTO = await createMessage(socket.userId, cleanConvId, trimmedText);

        // 5. Broadcast real-time message to conversation room
        const roomName = `conversation:${cleanConvId}`;
        ioInstance.to(roomName).emit('message:new', messageDTO);

        // 6. Notify conversation participants via their personal rooms to update conversation lists
        const conv = await prisma.conversation.findUnique({
          where: { id: cleanConvId },
          include: { participants: true },
        });

        if (conv && Array.isArray(conv.participants)) {
          conv.participants.forEach((p) => {
            ioInstance.to(`user:${p.userId}`).emit('conversation:updated', {
              conversationId: cleanConvId,
              lastMessage: messageDTO,
            });
          });
        }

        if (typeof callback === 'function') {
          callback({ success: true, message: messageDTO });
        }
      } catch (err) {
        const errorResponse = {
          success: false,
          error: err.code || 'SEND_MESSAGE_FAILED',
          message: err.message || 'Could not send message.',
        };
        if (typeof callback === 'function') callback(errorResponse);
        socket.emit('error', errorResponse);
      }
    });

    // --------------------------------------------------------------------------
    // EVENT: message:read
    // Marks messages as read and informs room participants
    // --------------------------------------------------------------------------
    socket.on('message:read', async (payload, callback) => {
      try {
        const conversationId = typeof payload === 'string' ? payload : payload?.conversationId;

        if (
          !conversationId ||
          typeof conversationId !== 'string' ||
          !isValidUUID(conversationId.trim())
        ) {
          const err = { success: false, error: 'INVALID_CONVERSATION_ID' };
          if (typeof callback === 'function') callback(err);
          return socket.emit('error', err);
        }

        const validId = conversationId.trim();

        const result = await markConversationAsRead(socket.userId, validId);

        // Notify room that messages were marked as read
        ioInstance.to(`conversation:${validId}`).emit('message:read', {
          conversationId: validId,
          readerId: socket.userId,
        });

        if (typeof callback === 'function') {
          callback({ success: true, modifiedCount: result.modifiedCount });
        }
      } catch (err) {
        const errResponse = { success: false, error: err.code || 'READ_FAILED', message: err.message };
        if (typeof callback === 'function') callback(errResponse);
        socket.emit('error', errResponse);
      }
    });

    // --------------------------------------------------------------------------
    // DISCONNECT
    // --------------------------------------------------------------------------
    socket.on('disconnect', () => {
      // Automatic cleanup handled by Socket.IO rooms
    });
  });

  return ioInstance;
};

/**
 * Retrieve current active Socket.IO server instance.
 * @returns {Server|null}
 */
export const getSocketServer = () => ioInstance;

/**
 * Close and reset the Socket.IO server (useful for test suites).
 */
export const closeSocketServer = async () => {
  if (ioInstance) {
    await new Promise((resolve) => ioInstance.close(resolve));
    ioInstance = null;
  }
};

export default {
  initSocketServer,
  getSocketServer,
  closeSocketServer,
};
