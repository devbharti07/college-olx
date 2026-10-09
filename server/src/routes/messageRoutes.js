import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from '../controllers/messageController.js';
import {
  validateConversationId,
  validateCreateConversation,
  validateSendMessage,
  validatePagination,
} from '../validators/messageValidators.js';
import { requireAuth, requireKeycloakEmailVerified, requireVerifiedUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==============================================================================
// RATE LIMITING
// 30 messages per minute per authenticated user to prevent chat spam
// ==============================================================================
export const messageRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  keyGenerator: (req) => req.userId || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
        message: 'Message rate limit exceeded. Please wait a moment before sending more messages.',
      },
    });
  },
});

// All messaging endpoints require authentication and collegiate email verification
router.use(requireAuth, requireKeycloakEmailVerified, requireVerifiedUser);

// ==============================================================================
// CONVERSATION ROUTES
// ==============================================================================

// POST /api/messages/conversations - Start or retrieve a conversation for a listing
router.post('/conversations', messageRateLimiter, validateCreateConversation, startConversation);

// GET /api/messages/conversations - List conversations for current user
router.get('/conversations', validatePagination, getConversations);

// GET /api/messages/conversations/:conversationId/messages - Get messages in a conversation
router.get(
  '/conversations/:conversationId/messages',
  validateConversationId,
  validatePagination,
  getMessages
);

// POST /api/messages/conversations/:conversationId/messages - Send message (REST fallback)
router.post(
  '/conversations/:conversationId/messages',
  messageRateLimiter,
  validateConversationId,
  validateSendMessage,
  sendMessage
);

// PATCH /api/messages/conversations/:conversationId/read - Mark conversation as read
router.patch(
  '/conversations/:conversationId/read',
  validateConversationId,
  markAsRead
);

export default router;
