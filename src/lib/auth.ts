/**
 * Authentication client.
 * Handles signin, signup, signout, and session management.
 */

import { api } from './api';
import { User, Session } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Simple in-memory session storage
let currentSession: Session | null = null;

/**
 * Get the current session.
 */
export function getSession(): Session | null {
  return currentSession;
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated(): boolean {
  return currentSession !== null;
}

/**
 * Sign up a new user.
 */
export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<Session> {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Signup failed' }));
    throw new Error(error.detail || 'Signup failed');
  }

  const data = await response.json();
  currentSession = {
    user: data.user,
    accessToken: data.accessToken,
  };

  // Set token in API client
  api.setToken(currentSession.accessToken);

  return currentSession;
}

/**
 * Sign in an existing user.
 */
export async function signIn(
  email: string,
  password: string
): Promise<Session> {
  const response = await fetch(`${API_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Invalid credentials' }));
    throw new Error(error.detail || 'Invalid credentials');
  }

  const data = await response.json();
  currentSession = {
    user: data.user,
    accessToken: data.accessToken,
  };

  // Set token in API client
  api.setToken(currentSession.accessToken);

  return currentSession;
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  currentSession = null;
  api.setToken(null);
}

/**
 * Restore session from storage (call on app init).
 */
export async function restoreSession(): Promise<Session | null> {
  // JWT is stateless - session is restored from localStorage if available
  return null;
}
