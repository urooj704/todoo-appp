'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { Conversation, Message } from '@/lib/types';
import ConversationList from '@/components/ConversationList';

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userId = getSession()?.user?.id;

  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!userId) return;
    try {
      const convos = await api.listConversations(userId);
      setConversations(convos);
    } catch {
      // Silently fail — sidebar will show empty
    }
  };

  const loadConversation = async (conversationId: string) => {
    if (!userId) return;
    try {
      const detail = await api.getConversation(userId, conversationId);
      setActiveConversationId(conversationId);
      setMessages(detail.messages);
      setSidebarOpen(false);
      setError(null);
    } catch {
      setError('Failed to load conversation.');
    }
  };

  const startNewChat = () => {
    setActiveConversationId(undefined);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  const sendMessage = async () => {
    if (!input.trim() || !userId || loading) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await api.sendMessage(userId, userMessage.content, activeConversationId);

      if (!activeConversationId) {
        setActiveConversationId(response.conversation_id);
        loadConversations();
      }

      const assistantMessage: ChatMessage = {
        id: `resp-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] -mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-8">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r transition-transform lg:transition-none`}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={loadConversation}
          onNew={startNewChat}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-sm font-medium text-gray-700">
            {activeConversationId ? 'Conversation' : 'New Chat'}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">How can I help you?</p>
                <p className="text-sm mt-1">
                  Ask me to manage your tasks — create, list, update, complete, or delete.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="border-t p-3 bg-gray-50">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={loading}
              className="input flex-1 text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="btn btn-primary text-sm px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
