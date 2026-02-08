/**
 * Authentication client for Better Auth integration.
 * Handles signin, signup, signout, and session management.
 */

import { api } from './api';
import { User, Session } from './types';

// Simple in-memory session storage (in production, use secure cookies)
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
  // In a real implementation, this would call Better Auth's signup endpoint
  // For now, we'll simulate the flow
  const response = await fetch(`${process.env.BETTER_AUTH_URL || ''}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Signup failed' }));
    throw new Error(error.error || 'Signup failed');
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
  const response = await fetch(`${process.env.BETTER_AUTH_URL || ''}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Invalid credentials' }));
    throw new Error(error.error || 'Invalid credentials');
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
  try {
    await fetch(`${process.env.BETTER_AUTH_URL || ''}/api/auth/signout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore errors during signout
  }

  currentSession = null;
  api.setToken(null);
}

/**
 * Restore session from storage (call on app init).
 */
export async function restoreSession(): Promise<Session | null> {
  try {
    const response = await fetch(`${process.env.BETTER_AUTH_URL || ''}/api/auth/session`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.user && data.accessToken) {
      currentSession = {
        user: data.user,
        accessToken: data.accessToken,
      };
      api.setToken(currentSession.accessToken);
      return currentSession;
    }
  } catch {
    // Session restoration failed
  }

  return null;
}
