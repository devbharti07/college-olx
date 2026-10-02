/**
 * ============================================================================
 * Message Service (Frontend API Service Layer)
 * ============================================================================
 * Defines methods for retrieving campus conversations and sending messages.
 * Ready for WebSocket / Socket.IO / backend real-time messaging integration.
 * In production UI, returns empty conversations until real messages exist.
 * ============================================================================
 */

const CONVERSATIONS_STORAGE_KEY = 'campus_classifieds_messages';

function getStoredConversations() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local conversations:', e);
  }
  return [];
}

export const messageService = {
  /**
   * Get student conversations.
   * Returns empty array by default unless session conversations were started.
   * @returns {Promise<Array>}
   */
  getConversations: async () => {
    return getStoredConversations();
  },

  /**
   * Send a message to an active conversation in the current session.
   * @param {string} conversationId
   * @param {string} text
   * @returns {Promise<Object>}
   */
  sendMessage: async (conversationId, text) => {
    const conversations = getStoredConversations();
    const newMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      sender: 'me',
      text: text.trim(),
      timestamp: 'Just now',
    };

    const updated = conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          messages: [...(c.messages || []), newMessage],
        };
      }
      return c;
    });

    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to store conversation message:', e);
    }

    return newMessage;
  },
};

export default messageService;
