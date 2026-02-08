'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your Todoo AI assistant. I can help you manage tasks, set reminders, and plan your day. How can I help?",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const session = getSession();
      const userId = session?.user?.id;

      if (!userId) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: 'Please sign in to use the AI assistant.',
          },
        ]);
        setSending(false);
        return;
      }

      const res = await api.sendMessage(userId, trimmed, conversationId);

      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: res.response,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: "Sorry, I couldn't process that. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] animate-chat-open">
          <div className="glass-panel-strong rounded-2xl shadow-glass-xl flex flex-col h-[500px] max-h-[70vh]">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/30">
              {/* Mini bot avatar in header */}
              <div className="relative w-9 h-9 flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-brand" />
                <div className="relative w-full h-full rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="4" width="18" height="12" rx="3" />
                    <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
                    <circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none" />
                    <path strokeLinecap="round" d="M9 20h6" />
                    <path strokeLinecap="round" d="M12 16v4" />
                    <path strokeLinecap="round" d="M12 4V2" />
                    <path strokeLinecap="round" d="M7 4L5 2" />
                    <path strokeLinecap="round" d="M17 4l2-2" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-800">Todoo AI</h3>
                <p className="text-xs text-gray-400">Always here to help</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100/60 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex animate-message-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-2xl rounded-br-md shadow-sm'
                        : 'bg-white/80 text-gray-700 rounded-2xl rounded-bl-md border border-gray-100/60 shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start animate-message-in">
                  <div className="bg-white/80 text-gray-400 rounded-2xl rounded-bl-md border border-gray-100/60 px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-4 pb-4 pt-2 border-t border-white/30">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/70 border border-gray-200/50 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow-brand hover:shadow-glow-brand-lg transition-all duration-200 disabled:opacity-40 disabled:shadow-none flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating chatbot icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 group"
        aria-label={isOpen ? 'Close chat' : 'Open AI chat'}
      >
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 opacity-40 blur-md group-hover:opacity-60 transition-opacity duration-300 animate-glow-pulse" />

          {/* Main button */}
          <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 shadow-glow-brand-lg flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${!isOpen ? 'animate-float' : ''}`}>
            {/* Inner shine */}
            <div className="absolute top-1 left-1.5 w-5 h-3 rounded-full bg-white/25 blur-[2px]" />

            {isOpen ? (
              /* Close icon */
              <svg className="w-6 h-6 text-white transition-transform duration-300 rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Bot face icon */
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="none">
                {/* Head */}
                <rect x="4" y="5" width="16" height="11" rx="3.5" stroke="currentColor" strokeWidth="1.6" />
                {/* Left eye */}
                <circle cx="9.5" cy="10.5" r="1.5" fill="currentColor" />
                {/* Right eye */}
                <circle cx="14.5" cy="10.5" r="1.5" fill="currentColor" />
                {/* Smile */}
                <path d="M10 13.5c.5.5 1.2.8 2 .8s1.5-.3 2-.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                {/* Antenna */}
                <line x1="12" y1="5" x2="12" y2="2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="12" cy="2" r="1" fill="currentColor" />
                {/* Neck / body connector */}
                <line x1="12" y1="16" x2="12" y2="19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                {/* Ears */}
                <rect x="1" y="8" width="3" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <rect x="20" y="8" width="3" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            )}
          </div>

          {/* Notification dot (when chat is closed) */}
          {!isOpen && (
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 border-2 border-white shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          )}
        </div>
      </button>
    </>
  );
}
