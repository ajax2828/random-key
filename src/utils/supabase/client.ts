/**
 * Local API client (replaces Supabase browser client).
 *
 * Provides a thin wrapper around fetch() that talks to the Next.js API routes
 * in this project. Auth is handled via httpOnly cookies so the client never
 * sees the session token.
 */

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  status: string;
  user_metadata?: {
    full_name?: string;
  };
}

export interface AuthResponse {
  user: User | null;
  error?: string;
}

function api(path: string, opts: RequestInit = {}) {
  return fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...opts.headers,
    },
    ...opts,
  });
}

export const localApiClient = {
  // -------- Auth --------
  async getUser(): Promise<User | null> {
    try {
      const res = await api('/api/auth/user');
      if (!res.ok) return null;
      const data = (await res.json()) as { user: User };
      return data.user;
    } catch {
      return null;
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { user: null, error: data.error || 'Login failed' };
      return { user: data.user };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return { user: null, error: message };
    }
  },

  async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    try {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      const data = await res.json();
      if (!res.ok) return { user: null, error: data.error || 'Register failed' };
      return { user: data.user };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Register failed';
      return { user: null, error: message };
    }
  },

  async signOut(): Promise<void> {
    await api('/api/auth/logout', { method: 'POST' });
  },
};
