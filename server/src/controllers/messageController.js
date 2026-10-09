import { apiResponse } from '../utils/apiResponse.js';
import {
  startOrGetConversation as startOrGetConversationService,
  getUserConversations as getUserConversationsService,
  getConversationMessages as getConversationMessagesService,
  createMessage as createMessageService,
  markConversationAsRead as markConversationAsReadService,
} from '../services/messageService.js';
import { getSocketServer } from '../sockets/socketManager.js';

/**
 * Start or retrieve a conversation for a listing.
 * POST /api/messages/conversations
 */
export const startConversation = async (req, res, next) => {
  try {
    const result = await startOrGetConversationService(
      req.userId,
      req.cleanConversationData
    );

    // If a new message was created with the initialMessage, notify via Socket.IO
    if (req.cleanConversationData?.initialMessage && result.conversation?.lastMessage) {
      const io = getSocketServer();
      if (io) {
        io.to(`conversation:${result.conversation.id}`).emit(
          'message:new',
          result.conversation.lastMessage
        );
        // Also notify the other participant's personal room
        if (result.conversation.otherParticipant?.id) {
          io.to(`user:${result.conversation.otherParticipant.id}`).emit(
            'conversation:updated',
            result.conversation
          );
        }
      }
    }

    const statusCode = result.isNew ? 201 : 200;
    return res.status(statusCode).json(
      apiResponse.success(
        { conversation: result.conversation },
        { message: result.isNew ? 'Conversation created.' : 'Existing conversation retrieved.' }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated list of conversations for current user.
 * GET /api/messages/conversations
 */
export const getConversations = async (req, res, next) => {
  try {
    const result = await getUserConversationsService(req.userId, req.pagination);
    return res.status(200).json(
      apiResponse.success(
        { conversations: result.conversations, pagination: result.pagination },
        result.pagination
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated messages for a specific conversation.
 * GET /api/messages/conversations/:conversationId/messages
 */
export const getMessages = async (req, res, next) => {
  try {
    const result = await getConversationMessagesService(
      req.userId,
      req.params.conversationId,
      req.pagination
    );
    return res.status(200).json(
      apiResponse.success(
        {
          messages: result.messages,
          conversation: result.conversation,
          pagination: result.pagination,
        },
        result.pagination
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message to a conversation (REST fallback).
 * POST /api/messages/conversations/:conversationId/messages
 */
export const sendMessage = async (req, res, next) => {
  try {
    const message = await createMessageService(
      req.userId,
      req.params.conversationId,
      req.cleanMessageText
    );

    // Broadcast in real time via Socket.IO
    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${req.params.conversationId}`).emit('message:new', message);
    }

    return res.status(201).json(
      apiResponse.success({ message }, { message: 'Message sent successfully.' })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all incoming messages in a conversation as read.
 * PATCH /api/messages/conversations/:conversationId/read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const result = await markConversationAsReadService(
      req.userId,
      req.params.conversationId
    );

    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${req.params.conversationId}`).emit('message:read', {
        conversationId: req.params.conversationId,
        readerId: req.userId,
      });
    }

    return res.status(200).json(
      apiResponse.success(
        { modifiedCount: result.modifiedCount },
        { message: 'Messages marked as read.' }
      )
    );
  } catch (error) {
    next(error);
  }
};

export default {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
};
