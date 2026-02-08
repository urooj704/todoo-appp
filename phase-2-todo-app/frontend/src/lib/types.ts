/**
 * TypeScript types for the Todo application.
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
}

export interface ApiError {
  error: string;
  detail?: string;
}

export interface Session {
  user: User;
  accessToken: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ConversationDetail {
  id: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface ToolCallInfo {
  name: string;
  result?: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  conversation_id: string;
  response: string;
  tool_calls: ToolCallInfo[];
}
