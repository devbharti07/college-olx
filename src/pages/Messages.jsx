import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Send, 
  Search, 
  ArrowLeft, 
  ShieldCheck, 
  MapPin, 
  ExternalLink, 
  CheckCheck, 
  MessageSquare,
  Server,
  User,
  Tag
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../layouts';
import { Badge, Button, EmptyState } from '../components';
import { formatPrice } from '../utils/formatters';
import { messageService } from '../services/messageService';

const QUICK_REPLIES = [
  'Yes, it is still available!',
  'Can we meet at the campus library?',
  'Does 2:00 PM today work for you?',
  'Cash or campus UPI works for me.',
];

export default function Messages() {
  useDocumentTitle('Campus Messages');

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  
  // Mobile responsive layout:
  // On mobile (< 768px), show conversations list first, open chat window separately
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // In production without backend, conversations are empty by default
    messageService.getConversations(false).then((data) => {
      setConversations(data || []);
      if (data && data.length > 0) {
        setActiveConversationId(data[0].id);
      }
    });
  }, []);

  // Active conversation object
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;

  // Auto-scroll to bottom of chat when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  // Handle selecting a conversation
  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
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

  // Send message locally in frontend demo
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !activeConversation) return;

    const newMessage = await messageService.sendMessage(activeConversation.id, inputMessage);

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      })
    );

    setInputMessage('');
  };

  const handleQuickReply = (text) => {
    setInputMessage(text);
  };

  // Filter conversations by search term (seller name or item title)
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.user?.name || '').toLowerCase().includes(q) ||
      (c.item?.title || '').toLowerCase().includes(q) ||
      (c.user?.department || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Campus Messages"
        description="Direct peer-to-peer chat for verifying items and planning campus meetups."
        badge={
          <Badge variant="primary" size="sm" icon={ShieldCheck}>
            Verified Student Chat
          </Badge>
        }
      />

      {/* Honest Backend Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>Frontend Simulation:</strong> Direct peer delivery and real-time push notifications will connect when the messaging backend service is active.
          </span>
        </div>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="When buyers or sellers reach out about campus items, your direct conversations will appear here."
          actionLabel="Browse Listings"
          actionTo="/listings"
        />
      ) : (
        /* Responsive 2-Pane Chat Layout */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col md:flex-row h-[680px]">
          {/* LEFT SIDEBAR: Conversation List */}
          <div
            className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 shrink-0 ${
              showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search conversations */}
            <div className="p-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students or items..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>
            </div>

            {/* Conversation list items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((c) => {
                  const isActive = activeConversation?.id === c.id;
                  const lastMsg = c.messages?.[c.messages.length - 1];

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectConversation(c.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-slate-800 shadow-xs ring-1 ring-emerald-600/30'
                          : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {c.user?.avatar ? (
                          <img
                            src={c.user.avatar}
                            alt={c.user.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display = 'flex';
                              }
                            }}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : null}
                        <div className={`${c.user?.avatar ? 'hidden' : 'flex'} w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center text-slate-500`}>
                          <User className="w-5 h-5" />
                        </div>
                        {c.user?.online && (
                          <span
                            className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-600 border-2 border-white dark:border-slate-900 rounded-full"
                            title="Active on campus"
                          />
                        )}
                      </div>

                      {/* Info & Last message preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-xs font-bold truncate ${isActive ? 'text-emerald-950 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'}`}>
                            {c.user?.name || 'Student'}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {lastMsg?.timestamp || ''}
                          </span>
                        </div>

                        {/* Item tag */}
                        <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400 truncate mb-1">
                          {c.item?.title || 'Classified item'}
                        </div>

                        {/* Last message text preview */}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-snug">
                          {lastMsg ? (lastMsg.sender === 'me' ? `You: ${lastMsg.text}` : lastMsg.text) : 'No messages yet'}
                        </p>
                      </div>

                      {/* Unread indicator badge */}
                      {c.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
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
                <div className="p-3.5 sm:px-5 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 z-10 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Back button for mobile view */}
                    <button
                      type="button"
                      onClick={handleBackToConversations}
                      className="md:hidden p-1 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* Partner avatar */}
                    <div className="relative shrink-0">
                      {activeConversation.user?.avatar ? (
                        <img
                          src={activeConversation.user.avatar}
                          alt={activeConversation.user.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling) {
                              e.target.nextElementSibling.style.display = 'flex';
                            }
                          }}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : null}
                      <div className={`${activeConversation.user?.avatar ? 'hidden' : 'flex'} w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center text-slate-500`}>
                        <User className="w-5 h-5" />
                      </div>
                      {activeConversation.user?.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-600 border-2 border-white dark:border-slate-900 rounded-full" />
                      )}
                    </div>

                    {/* Name, department, verification */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {activeConversation.user?.name || 'Student'}
                        </span>
                        {activeConversation.user?.verified && (
                          <span title="Verified University Student" className="text-emerald-700 dark:text-emerald-400">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        {activeConversation.user?.department || 'Campus Member'}
                      </span>
                    </div>
                  </div>

                  {/* Linked Item Preview Card */}
                  {activeConversation.item && (
                    <Link
                      to={`/listings`}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 flex items-center gap-2 text-xs transition-colors shrink-0 group max-w-[140px] sm:max-w-xs"
                      title={`View ${activeConversation.item.title}`}
                    >
                      {activeConversation.item.image ? (
                        <img
                          src={activeConversation.item.image}
                          alt={activeConversation.item.title}
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
                      <div className={`${activeConversation.item.image ? 'hidden' : 'flex'} w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 items-center justify-center text-slate-400 shrink-0`}>
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 hidden sm:block">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate block text-[11px]">
                          {activeConversation.item.title}
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px]">
                          {formatPrice(activeConversation.item.price)}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 shrink-0" />
                    </Link>
                  )}
                </div>

                {/* Safe Meetup Recommendation Banner */}
                {activeConversation.user?.pickupSpot && (
                  <div className="px-4 py-2 bg-emerald-50/60 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-950 dark:text-emerald-300 flex items-center gap-2 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">
                      Preferred meetup: <strong>{activeConversation.user.pickupSpot}</strong>. Always meet in daylight in public campus buildings.
                    </span>
                  </div>
                )}

                {/* Message Scroll Area */}
                <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-50/30 dark:bg-slate-950/20">
                  {activeConversation.messages?.map((msg) => {
                    const isMe = msg.sender === 'me';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                            isMe
                              ? 'bg-emerald-800 dark:bg-emerald-700 text-white rounded-tr-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                          <span>{msg.timestamp}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reply Suggestions */}
                <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                    Quick replies:
                  </span>
                  {QUICK_REPLIES.map((reply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickReply(reply)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 text-[11px] text-slate-600 dark:text-slate-300 font-medium transition-colors shrink-0 cursor-pointer"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {/* Message Input Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message to discuss condition, price, or meetup..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    leftIcon={Send}
                    disabled={!inputMessage.trim()}
                    className="shrink-0"
                  >
                    Send
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
