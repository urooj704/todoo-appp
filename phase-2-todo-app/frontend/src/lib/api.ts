/**
 * Single API client abstraction for all backend communication.
 * JWT is attached to every request automatically.
 */

import { Task, TaskCreate, TaskUpdate, ApiError, Conversation, ConversationDetail, ChatResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private accessToken: string | null = null;

  /**
   * Set the access token for authenticated requests.
   */
  setToken(token: string | null): void {
    this.accessToken = token;
  }

  /**
   * Get the current access token.
   */
  getToken(): string | null {
    return this.accessToken;
  }

  /**
   * Make an authenticated fetch request with timeout and error handling.
   */
  private async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Add request timeout (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiClientError('Request timed out', 408, {
          error: 'Timeout',
          detail: 'The request took too long to complete. Please try again.',
        });
      }
      // Network error (offline, DNS failure, etc.)
      throw new ApiClientError('Network error', 0, {
        error: 'Network error',
        detail: 'Unable to connect to the server. Please check your connection.',
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Request failed',
        detail: `HTTP ${response.status}`,
      }));

      if (response.status === 401) {
        // Token expired or invalid - clear it
        this.accessToken = null;
        throw new ApiClientError('Session expired. Please sign in again.', 401, error);
      }

      if (response.status === 403) {
        throw new ApiClientError('You do not have access to this resource.', 403, error);
      }

      if (response.status === 404) {
        throw new ApiClientError('The requested resource was not found.', 404, error);
      }

      if (response.status >= 500) {
        throw new ApiClientError('Server error. Please try again later.', response.status, error);
      }

      throw new ApiClientError(error.detail || error.error || 'Request failed', response.status, error);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * List all tasks for the authenticated user.
   */
  async listTasks(): Promise<Task[]> {
    return this.fetch<Task[]>('/tasks');
  }

  /**
   * Create a new task.
   */
  async createTask(data: TaskCreate): Promise<Task> {
    return this.fetch<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get a specific task.
   */
  async getTask(id: string): Promise<Task> {
    return this.fetch<Task>(`/tasks/${id}`);
  }

  /**
   * Update a task.
   */
  async updateTask(id: string, data: TaskUpdate): Promise<Task> {
    return this.fetch<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a task.
   */
  async deleteTask(id: string): Promise<void> {
    return this.fetch<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Toggle task completion status.
   */
  async toggleTaskComplete(id: string): Promise<Task> {
    return this.fetch<Task>(`/tasks/${id}/complete`, {
      method: 'PATCH',
    });
  }

  /**
   * Send a chat message and receive an AI response.
   */
  async sendMessage(userId: string, message: string, conversationId?: string): Promise<ChatResponse> {
    return this.fetch<ChatResponse>(`/${userId}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_id: conversationId || null,
      }),
    });
  }

  /**
   * List all conversations for a user.
   */
  async listConversations(userId: string): Promise<Conversation[]> {
    return this.fetch<Conversation[]>(`/${userId}/conversations`);
  }

  /**
   * Get a conversation with its full message history.
   */
  async getConversation(userId: string, conversationId: string): Promise<ConversationDetail> {
    return this.fetch<ConversationDetail>(`/${userId}/conversations/${conversationId}`);
  }

  /**
   * Get a ChatKit session token.
   */
  async getChatkitSession(): Promise<{ client_secret: string }> {
    return this.fetch<{ client_secret: string }>('/chatkit/session', {
      method: 'POST',
    });
  }
}

/**
 * Custom error class for API errors.
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public apiError: ApiError
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// Singleton instance
export const api = new ApiClient();
