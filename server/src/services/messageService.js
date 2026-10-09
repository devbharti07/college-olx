import { ApiError } from '../utils/apiError.js';
import { prisma } from '../config/database.js';
import {
  isValidUUID,
  fromDbEnum,
} from '../constants/marketplace.js';

/**
 * Format strictly sanitized public user DTO for chat participants.
 * Guarantees zero leakage of private credentials, email addresses, or token states.
 */
export const formatUserSummaryDTO = (userDoc) => {
  if (!userDoc) return null;

  if (typeof userDoc === 'string') {
    return { id: userDoc };
  }

  return {
    id: userDoc.id || '',
    name: userDoc.name || 'Campus Student',
    avatar: userDoc.avatar || null,
    college: userDoc.college || '',
    department: userDoc.department || '',
    isVerified: Boolean(userDoc.isVerified),
  };
};

/**
 * Format listing summary DTO for conversation context banner.
 */
export const formatListingSummaryDTO = (listingDoc) => {
  if (!listingDoc) return null;

  if (typeof listingDoc === 'string') {
    return { id: listingDoc };
  }

  const image =
    Array.isArray(listingDoc.images) && listingDoc.images.length > 0
      ? listingDoc.images[0]?.url || listingDoc.images[0]
      : null;

  return {
    id: listingDoc.id || '',
    title: listingDoc.title || 'Marketplace Item',
    price: typeof listingDoc.price === 'number' ? listingDoc.price : parseFloat(listingDoc.price) || 0,
    image,
    status: fromDbEnum(listingDoc.status) || 'active',
    location: listingDoc.location || 'Campus Meetup',
  };
};

/**
 * Format standardized message DTO.
 */
export const formatMessageDTO = (msgDoc) => {
  if (!msgDoc) return null;

  const readBy = Array.isArray(msgDoc.readBy)
    ? msgDoc.readBy.map((r) => (typeof r === 'string' ? r : r.userId || r.id))
    : [];

  return {
    id: msgDoc.id,
    conversationId: msgDoc.conversationId,
    sender: formatUserSummaryDTO(msgDoc.sender),
    text: msgDoc.text,
    readBy,
    createdAt: msgDoc.createdAt,
  };
};

/**
 * Format conversation DTO with populated participants, other participant, last message, and unread count.
 */
export const formatConversationDTO = (convDoc, currentUserId, unreadCount = 0) => {
  if (!convDoc) return null;

  const participants = Array.isArray(convDoc.participants)
    ? convDoc.participants.map((p) => formatUserSummaryDTO(p.user || p))
    : [];

  const otherParticipant =
    participants.find((p) => p.id !== currentUserId.toString()) || participants[0] || null;

  return {
    id: convDoc.id,
    listing: formatListingSummaryDTO(convDoc.listing),
    participants,
    otherParticipant,
    lastMessage: convDoc.lastMessage ? formatMessageDTO(convDoc.lastMessage) : null,
    unreadCount,
    createdAt: convDoc.createdAt,
    updatedAt: convDoc.updatedAt,
  };
};

/**
 * Start a new conversation or retrieve an existing conversation for a listing.
 * Verifies listing availability, prohibits self-messaging, and validates seller eligibility.
 *
 * @param {string} buyerId - Authenticated student identifier
 * @param {Object} options - { listingId, initialMessage }
 * @returns {Promise<Object>} Formatted conversation DTO
 */
export const startOrGetConversation = async (buyerId, { listingId, initialMessage }) => {
  if (!isValidUUID(listingId)) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found or is no longer available.');
  }

  // 1. Load target listing
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { images: true },
  });

  if (!listing || fromDbEnum(listing.status) === 'removed') {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found or is no longer available.');
  }

  const sellerId = listing.sellerId;

  // 2. Prohibit student from initiating a conversation on their own listing
  if (sellerId === buyerId.toString()) {
    throw new ApiError(
      400,
      'CANNOT_MESSAGE_SELF',
      'You cannot initiate a conversation on an item you have listed for sale.'
    );
  }

  // 3. Verify seller account is active
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
  });

  if (!seller || ['banned', 'suspended'].includes(fromDbEnum(seller.accountStatus))) {
    throw new ApiError(
      404,
      'SELLER_UNAVAILABLE',
      'The seller account for this listing is currently unavailable.'
    );
  }

  // 4. Check if an active conversation between buyer and seller already exists for this listing
  let conversation = await prisma.conversation.findFirst({
    where: {
      listingId,
      AND: [
        { participants: { some: { userId: buyerId } } },
        { participants: { some: { userId: sellerId } } },
      ],
    },
    include: {
      listing: { include: { images: true } },
      participants: { include: { user: true } },
      lastMessage: {
        include: {
          sender: true,
          readBy: true,
        },
      },
    },
  });

  let isNew = false;
  if (!conversation) {
    isNew = true;
    conversation = await prisma.$transaction(async (tx) => {
      return tx.conversation.create({
        data: {
          listingId,
          participants: {
            create: [{ userId: buyerId }, { userId: sellerId }],
          },
        },
        include: {
          listing: { include: { images: true } },
          participants: { include: { user: true } },
          lastMessage: {
            include: {
              sender: true,
              readBy: true,
            },
          },
        },
      });
    });
  }

  // 5. If an initial message was provided, persist it immediately inside a transaction
  if (initialMessage && typeof initialMessage === 'string' && initialMessage.trim()) {
    const text = initialMessage.trim();
    await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: buyerId,
          text,
          readBy: {
            create: {
              userId: buyerId,
            },
          },
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageId: message.id,
          updatedAt: new Date(),
        },
      });
    });

    conversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        listing: { include: { images: true } },
        participants: { include: { user: true } },
        lastMessage: {
          include: {
            sender: true,
            readBy: true,
          },
        },
      },
    });
  }

  // Compute unread count for current user
  const unreadCount = await prisma.message.count({
    where: {
      conversationId: conversation.id,
      senderId: { not: buyerId },
      readBy: { none: { userId: buyerId } },
    },
  });

  return {
    conversation: formatConversationDTO(conversation, buyerId, unreadCount),
    isNew,
  };
};

/**
 * Retrieve paginated conversations belonging to the authenticated student.
 * Sorted by newest activity first with real-time unread counts and context DTOs.
 *
 * @param {string} userId - Authenticated user identifier
 * @param {Object} pagination - { page, limit }
 * @returns {Promise<Object>} { conversations, pagination }
 */
export const getUserConversations = async (userId, { page = 1, limit = 20 }) => {
  const where = {
    participants: {
      some: {
        userId,
      },
    },
  };

  const [total, records] = await prisma.$transaction([
    prisma.conversation.count({ where }),
    prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        listing: { include: { images: true } },
        participants: { include: { user: true } },
        lastMessage: {
          include: {
            sender: true,
            readBy: true,
          },
        },
      },
    }),
  ]);

  // Compute unread count per conversation for this user
  const conversationsWithUnread = await Promise.all(
    records.map(async (doc) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: doc.id,
          senderId: { not: userId },
          readBy: { none: { userId } },
        },
      });
      return formatConversationDTO(doc, userId, unreadCount);
    })
  );

  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

  return {
    conversations: conversationsWithUnread,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

/**
 * Retrieve messages for a specific conversation with strict participant verification.
 * Defends against IDOR: non-participants receive 404.
 *
 * @param {string} userId - Authenticated user identifier
 * @param {string} conversationId - Conversation identifier
 * @param {Object} pagination - { page, limit }
 * @returns {Promise<Object>} { messages, conversation, pagination }
 */
export const getConversationMessages = async (userId, conversationId, { page = 1, limit = 50 }) => {
  if (!isValidUUID(conversationId)) {
    throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { include: { images: true } },
      participants: { include: { user: true } },
    },
  });

  if (!conversation) {
    throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  }

  // Strict participant authorization check
  const isParticipant = conversation.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  }

  const where = { conversationId };

  const [total, records] = await prisma.$transaction([
    prisma.message.count({ where }),
    prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: true,
        readBy: true,
      },
    }),
  ]);

  const messages = records.map(formatMessageDTO);
  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

  return {
    messages,
    conversation: formatConversationDTO(conversation, userId, 0),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

/**
 * Persist and dispatch a new message within an existing conversation.
 * Verifies participant membership before persistence.
 *
 * @param {string} userId - Authenticated sender identifier
 * @param {string} conversationId - Conversation identifier
 * @param {string} text - Validated message text
 * @returns {Promise<Object>} Formatted message DTO
 */
export const createMessage = async (userId, conversationId, text) => {
  if (!isValidUUID(conversationId)) {
    throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: true,
    },
  });

  if (!conversation) {
    throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  }

  const isParticipant = conversation.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  }

  // Atomic transaction: create message, mark sender as read, update conversation lastMessage and timestamp
  const messageRecord = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        text: text.trim(),
        readBy: {
          create: {
            userId,
          },
        },
      },
      include: {
        sender: true,
        readBy: true,
      },
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: msg.id,
        updatedAt: new Date(),
      },
    });

    return msg;
  });

  return formatMessageDTO(messageRecord);
};

/**
 * Mark all unread incoming messages in a conversation as read by the current user.
 *
 * @param {string} userId - Authenticated user identifier
 * @param {string} conversationId - Conversation identifier
 * @returns {Promise<{ modifiedCount: number }>}
 */
export const markConversationAsRead = async (userId, conversationId) => {
  if (!isValidUUID(conversationId)) {
    throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: true,
    },
  });

  if (!conversation) {
    throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  }

  const isParticipant = conversation.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  }

  // Find all unread incoming messages
  const unreadMessages = await prisma.message.findMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readBy: { none: { userId } },
    },
    select: { id: true },
  });

  if (unreadMessages.length > 0) {
    await prisma.messageRead.createMany({
      data: unreadMessages.map((m) => ({
        messageId: m.id,
        userId,
      })),
      skipDuplicates: true,
    });
  }

  return {
    modifiedCount: unreadMessages.length,
  };
};

export default {
  startOrGetConversation,
  getUserConversations,
  getConversationMessages,
  createMessage,
  markConversationAsRead,
  formatUserSummaryDTO,
  formatListingSummaryDTO,
  formatMessageDTO,
  formatConversationDTO,
};
