import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Send, 
  Search, 
  ArrowLeft, 
  ShieldCheck, 
  MapPin, 
  ExternalLink, 
  CheckCheck, 
  MessageSquare, 
  User, 
  Tag,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../layouts';
import { Badge, Button, EmptyState, LoadingState } from '../components';
import { formatPrice } from '../utils/formatters';
import { messageService, subscribeConnectionState } from '../services/messageService';

const QUICK_REPLIES = [
  'Yes, it is still available!',
  'Can we meet at the campus library?',
  'Does 2:00 PM today work for you?',
  'Cash or campus UPI works for me.',
];

/**
 * Format timestamp for message bubbles and conversation preview.
 */
function formatMessageTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Messages() {
  useDocumentTitle('Campus Messages');

  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryConversationId = searchParams.get('conversationId');

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(queryConversationId || null);
  const [activeConversationData, setActiveConversationData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'

  // Mobile responsive layout: on mobile (< 768px), show conversations list first, open chat window separately
  const [showMobileChat, setShowMobileChat] = useState(Boolean(queryConversationId));

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to Socket.IO connection status
  useEffect(() => {
    const unsubscribe = subscribeConnectionState((state) => {
      setConnectionState(state);
    });
    return unsubscribe;
  }, []);

  // --------------------------------------------------------------------------
  // 1. Fetch Conversations List
  // --------------------------------------------------------------------------
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setLoadingConversations(false);
      return;
    }

    try {
      setError(null);
      const res = await messageService.getConversations();
      const list = res?.conversations || [];
      setConversations(list);

      // Select active conversation if none selected yet
      if (!activeConversationId && list.length > 0) {
        const targetId = queryConversationId || list[0].id;
        setActiveConversationId(targetId);
      }
    } catch (err) {
      console.error('[Messages] Failed to load conversations:', err);
      setError(err.message || 'Unable to load campus conversations.');
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated, activeConversationId, queryConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // --------------------------------------------------------------------------
  // 2. Fetch Messages for Active Conversation & Room Management
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!activeConversationId || !isAuthenticated) return;

    let isMounted = true;
    setLoadingMessages(true);

    // Join Socket.IO room for real-time delivery
    messageService.joinConversationRoom(activeConversationId);

    // Fetch persistent message history
    messageService
      .getMessages(activeConversationId)
      .then((res) => {
        if (!isMounted) return;
        setMessages(res.messages || []);
        if (res.conversation) {
          setActiveConversationData(res.conversation);
        }
        // Mark conversation as read
        messageService.markAsRead(activeConversationId).catch(() => {});
        messageService.sendSocketRead(activeConversationId);

        // Clear local unread count badge
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[Messages] Failed to load messages:', err);
        setError(err.message || 'Failed to load messages.');
      })
      .finally(() => {
        if (isMounted) setLoadingMessages(false);
      });

    return () => {
      isMounted = false;
      messageService.leaveConversationRoom(activeConversationId);
    };
  }, [activeConversationId, isAuthenticated]);

  // --------------------------------------------------------------------------
  // 3. Real-Time Socket Event Listeners
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = messageService.connectSocket();
    if (!socket) return;

    // Handler: New message received via Socket.IO
    const handleNewMessage = (newMsg) => {
      if (!newMsg || !newMsg.conversationId) return;

      // If message belongs to currently active conversation
      if (newMsg.conversationId === activeConversationId) {
        setMessages((prev) => {
          // Guard against duplicate message render
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });

        // Mark as read if sent by other participant
        if (newMsg.sender?.id !== user?.id) {
          messageService.markAsRead(newMsg.conversationId).catch(() => {});
          messageService.sendSocketRead(newMsg.conversationId);
        }
      }

      // Update conversation in sidebar list
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === newMsg.conversationId);
        if (!exists) {
          loadConversations();
          return prev;
        }

        const isViewing = newMsg.conversationId === activeConversationId;
        const updated = prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            return {
              ...c,
              lastMessage: newMsg,
              unreadCount: isViewing ? 0 : (c.unreadCount || 0) + 1,
              updatedAt: newMsg.createdAt,
            };
          }
          return c;
        });

        // Reorder conversation with newest message to the top
        return updated.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      });
    };

    // Handler: Read receipt event
    const handleMessageRead = ({ conversationId, readerId }) => {
      if (conversationId === activeConversationId && readerId !== user?.id) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.sender?.id === user?.id) {
              const currentReadBy = Array.isArray(msg.readBy) ? msg.readBy : [];
              if (!currentReadBy.includes(readerId)) {
                return { ...msg, readBy: [...currentReadBy, readerId] };
              }
            }
            return msg;
          })
        );
      }
    };

    // Handler: Conversation updated out-of-band
    const handleConversationUpdated = () => {
      loadConversations();
    };

    // Handler: Auto-rejoin active conversation room on reconnect
    const handleReconnect = () => {
      if (activeConversationId) {
        messageService.joinConversationRoom(activeConversationId);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleMessageRead);
    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleMessageRead);
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('connect', handleReconnect);
    };
  }, [isAuthenticated, activeConversationId, user?.id, loadConversations]);

  // Active conversation object from list or fetched metadata
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || activeConversationData || null;

  // Handle selecting a conversation
  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setSearchParams({ conversationId: id });
    setShowMobileChat(true);

    // Clear unread badge
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Back button for mobile view
  const handleBackToConversations = () => {
    setShowMobileChat(false);
  };

  // --------------------------------------------------------------------------
  // 4. Send Message Handler (Socket.IO with REST Fallback)
  // --------------------------------------------------------------------------
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || !activeConversationId || isSending) return;

    setIsSending(true);

    // Clear input box immediately for responsive typing experience
    setInputMessage('');

    // Try sending via real-time Socket.IO first
    messageService.sendSocketMessage(activeConversationId, trimmed, async (ack) => {
      if (ack?.success && ack.message) {
        // Appended safely via socket acknowledgment (deduped if message:new also fires)
        setMessages((prev) => {
          if (prev.some((m) => m.id === ack.message.id)) return prev;
          return [...prev, ack.message];
        });
        setIsSending(false);
      } else {
        // Fallback to REST API if socket send failed or unacknowledged
        try {
          const res = await messageService.sendMessage(activeConversationId, trimmed);
          if (res?.message) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === res.message.id)) return prev;
              return [...prev, res.message];
            });
          }
        } catch (restErr) {
          console.error('[Messages] Message send failed via both Socket and REST:', restErr);
          // Restore unsent message text to input box so student does not lose their typed text
          setInputMessage(trimmed);
        } finally {
          setIsSending(false);
        }
      }
    });
  };

  const handleQuickReply = (text) => {
    setInputMessage(text);
  };

  // Filter conversations by search term (student name or listing title)
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = c.otherParticipant?.name || '';
    const title = c.listing?.title || '';
    const dept = c.otherParticipant?.department || '';
    return (
      name.toLowerCase().includes(q) ||
      title.toLowerCase().includes(q) ||
      dept.toLowerCase().includes(q)
    );
  });

  // --------------------------------------------------------------------------
  // Guards: Unauthenticated or Unverified Student
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="py-12 max-w-xl mx-auto space-y-4">
        <PageHeader
          title="Campus Messages"
          description="Direct peer-to-peer chat for verifying items and planning campus meetups."
        />
        <EmptyState
          icon={MessageSquare}
          title="Sign in to view messages"
          description="You must be logged in with your verified college credentials to chat with buyers and sellers."
          actionLabel="Log In to Campus Account"
          actionTo="/login"
        />
      </div>
    );
  }

  if (user && !user.isVerified) {
    return (
      <div className="py-12 max-w-xl mx-auto space-y-4">
        <PageHeader
          title="Campus Messages"
          description="Direct peer-to-peer chat for verifying items and planning campus meetups."
        />
        <EmptyState
          icon={ShieldCheck}
          title="College Email Verification Required"
          description="To protect student safety, messaging is restricted to verified campus members. Please click the verification link sent to your institutional email."
          actionLabel="Go to Profile"
          actionTo="/profile"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header with Real-Time Connection Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Campus Messages"
          description="Direct peer-to-peer chat for verifying items and planning campus meetups."
          badge={
            <Badge variant="primary" size="sm" icon={ShieldCheck}>
              Verified Student Chat
            </Badge>
          }
        />

        {/* Small non-intrusive Connection State Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-xl border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] shadow-2xs text-xs">
          {connectionState === 'connected' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#16A34A] dark:bg-[#22C55E] animate-pulse" />
              <Wifi className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#22C55E]" />
              <span className="font-semibold text-[#16A34A] dark:text-[#22C55E]">Live</span>
            </>
          ) : connectionState === 'connecting' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span className="font-medium text-amber-700 dark:text-amber-400">Connecting...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
              <span className="font-medium text-[#71717A] dark:text-[#A1A1AA]">Offline</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#DC2626]/30 text-xs text-[#DC2626] dark:text-[#F87171] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loadingConversations ? (
        <div className="py-20 max-w-xl mx-auto">
          <LoadingState message="Connecting to campus chat network..." />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="When buyers or sellers reach out about campus items, your direct conversations will appear here."
          actionLabel="Browse Listings"
          actionTo="/listings"
        />
      ) : (
        /* Responsive 2-Pane Chat Layout */
        <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs overflow-hidden flex flex-col md:flex-row h-[680px]">
          {/* LEFT SIDEBAR: Conversation List */}
          <div
            className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#18181B] shrink-0 ${
              showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search conversations */}
            <div className="p-3 border-b border-[#E4E4E7] dark:border-[#27272A]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students or items..."
                  className="w-full bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#18181B] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] shadow-2xs"
                />
              </div>
            </div>

            {/* Conversation list items */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#E4E4E7]/60 dark:divide-[#27272A]/60">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((c) => {
                  const isActive = activeConversationId === c.id;
                  const partner = c.otherParticipant || {};
                  const lastMsg = c.lastMessage;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectConversation(c.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-[#18181B] shadow-xs ring-1 ring-[#6366F1]/30 dark:ring-[#818CF8]/30'
                          : 'hover:bg-[#F4F4F5]/60 dark:hover:bg-[#27272A]/40'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {partner.avatar ? (
                          <img
                            src={partner.avatar}
                            alt={partner.name || 'Student'}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display = 'flex';
                              }
                            }}
                            className="w-10 h-10 rounded-full object-cover border border-[#E4E4E7] dark:border-[#27272A]"
                          />
                        ) : null}
                        <div
                          className={`${
                            partner.avatar ? 'hidden' : 'flex'
                          } w-10 h-10 rounded-full bg-[#F4F4F5] dark:bg-[#27272A] items-center justify-center text-[#71717A] dark:text-[#A1A1AA]`}
                        >
                          <User className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Info & Last message preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className={`text-xs font-bold truncate ${
                              isActive
                                ? 'text-[#4F46E5] dark:text-[#A5B4FC]'
                                : 'text-[#18181B] dark:text-[#FAFAFA]'
                            }`}
                          >
                            {partner.name || 'Campus Student'}
                          </span>
                          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] shrink-0">
                            {formatMessageTime(lastMsg?.createdAt || c.updatedAt)}
                          </span>
                        </div>

                        {/* Item title */}
                        {c.listing && (
                          <div className="text-[11px] font-medium text-[#6366F1] dark:text-[#818CF8] truncate mb-0.5">
                            {c.listing.title}
                          </div>
                        )}

                        {/* Last message text preview */}
                        <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] truncate leading-snug">
                          {lastMsg
                            ? lastMsg.sender?.id === user?.id
                              ? `You: ${lastMsg.text}`
                              : lastMsg.text
                            : 'Conversation started'}
                        </p>
                      </div>

                      {/* Unread indicator badge */}
                      {c.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No matching student chats.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Active Chat Window */}
          <div
            className={`w-full flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0 ${
              !showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 sm:px-5 border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between gap-3 bg-white dark:bg-[#18181B] z-10 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Back button for mobile view */}
                    <button
                      type="button"
                      onClick={handleBackToConversations}
                      className="md:hidden p-1 -ml-1 text-[#71717A] hover:text-[#18181B] dark:hover:text-white"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* Partner avatar */}
                    <div className="relative shrink-0">
                      {activeConversation.otherParticipant?.avatar ? (
                        <img
                          src={activeConversation.otherParticipant.avatar}
                          alt={activeConversation.otherParticipant.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling) {
                              e.target.nextElementSibling.style.display = 'flex';
                            }
                          }}
                          className="w-10 h-10 rounded-full object-cover border border-[#E4E4E7] dark:border-[#27272A]"
                        />
                      ) : null}
                      <div
                        className={`${
                          activeConversation.otherParticipant?.avatar ? 'hidden' : 'flex'
                        } w-10 h-10 rounded-full bg-[#F4F4F5] dark:bg-[#27272A] items-center justify-center text-[#71717A] dark:text-[#A1A1AA]`}
                      >
                        <User className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Name, college/department, verification */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[#18181B] dark:text-[#FAFAFA] truncate">
                          {activeConversation.otherParticipant?.name || 'Campus Student'}
                        </span>
                        {activeConversation.otherParticipant?.isVerified && (
                          <span
                            title="Verified University Student"
                            className="text-[#16A34A] dark:text-[#22C55E]"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] block truncate">
                        {activeConversation.otherParticipant?.college ||
                          activeConversation.otherParticipant?.department ||
                          'Verified Member'}
                      </span>
                    </div>
                  </div>

                  {/* Linked Item Preview Card */}
                  {activeConversation.listing && (
                    <Link
                      to={`/listings/${activeConversation.listing.id}`}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#27272A] hover:bg-[#F4F4F5] flex items-center gap-2 text-xs transition-colors shrink-0 group max-w-[140px] sm:max-w-xs"
                      title={`View ${activeConversation.listing.title}`}
                    >
                      {activeConversation.listing.image ? (
                        <img
                          src={activeConversation.listing.image}
                          alt={activeConversation.listing.title}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling) {
                              e.target.nextElementSibling.style.display = 'flex';
                            }
                          }}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : null}
                      <div
                        className={`${
                          activeConversation.listing.image ? 'hidden' : 'flex'
                        } w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 items-center justify-center text-slate-400 shrink-0`}
                      >
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 hidden sm:block">
                        <span className="font-bold text-[#18181B] dark:text-[#FAFAFA] truncate block text-[11px]">
                          {activeConversation.listing.title}
                        </span>
                        <span className="text-[#6366F1] dark:text-[#818CF8] font-extrabold text-[11px]">
                          {formatPrice(activeConversation.listing.price)}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] group-hover:text-[#6366F1] shrink-0" />
                    </Link>
                  )}
                </div>

                {/* Safe Meetup Recommendation Banner */}
                {activeConversation.listing?.location && (
                  <div className="px-4 py-2 bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#E4E4E7] dark:border-[#27272A] text-[11px] text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-2 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-[#6366F1] dark:text-[#818CF8] shrink-0" />
                    <span className="truncate">
                      Suggested pickup meetup: <strong className="text-[#18181B] dark:text-[#FAFAFA]">{activeConversation.listing.location}</strong>. Always meet in daylight in public campus buildings.
                    </span>
                  </div>
                )}

                {/* Message Scroll Area */}
                <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-[#FAFAFA]/50 dark:bg-[#09090B]/50">
                  {loadingMessages ? (
                    <div className="py-12 flex justify-center">
                      <LoadingState message="Loading conversation history..." />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-16 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      No messages yet in this conversation. Say hello!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender?.id === user?.id;
                      const isReadByPartner =
                        isMe &&
                        Array.isArray(msg.readBy) &&
                        activeConversation.otherParticipant &&
                        msg.readBy.includes(activeConversation.otherParticipant.id);

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                              isMe
                                ? 'bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] rounded-tr-xs'
                                : 'bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#FAFAFA] border border-[#E4E4E7] dark:border-[#27272A] rounded-tl-xs'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-[#71717A] dark:text-[#A1A1AA] px-1">
                            <span>{formatMessageTime(msg.createdAt)}</span>
                            {isMe && (
                              <CheckCheck
                                className={`w-3 h-3 ${
                                  isReadByPartner
                                    ? 'text-[#6366F1] dark:text-[#818CF8]'
                                    : 'text-[#71717A] dark:text-[#A1A1AA]'
                                }`}
                                title={isReadByPartner ? 'Read' : 'Delivered'}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reply Suggestions */}
                <div className="px-4 py-2 bg-white dark:bg-[#18181B] border-t border-[#E4E4E7] dark:border-[#27272A] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                  <span className="text-[10px] font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider shrink-0">
                    Quick replies:
                  </span>
                  {QUICK_REPLIES.map((reply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickReply(reply)}
                      className="px-2.5 py-1 rounded-lg bg-[#F4F4F5] dark:bg-[#27272A] hover:bg-[#EEF2FF] dark:hover:bg-[#312E81]/40 hover:text-[#4F46E5] dark:hover:text-[#A5B4FC] text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-medium transition-colors shrink-0 cursor-pointer"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {/* Message Input Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 bg-white dark:bg-[#18181B] border-t border-[#E4E4E7] dark:border-[#27272A] flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message to discuss condition, price, or meetup..."
                    maxLength={1000}
                    className="flex-1 bg-[#FAFAFA] dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-1 focus:ring-[#6366F1] dark:focus:ring-[#818CF8] shadow-2xs"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    leftIcon={Send}
                    disabled={!inputMessage.trim() || isSending}
                    className="shrink-0"
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <EmptyState
                  icon={MessageSquare}
                  title="Select a conversation"
                  description="Choose a conversation from the sidebar to chat with students."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
