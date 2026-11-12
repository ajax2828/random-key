/**
 * Local API client (replaces Supabase browser client).
 *
 * Provides a thin wrapper around fetch() that talks to the Next.js API routes
 * in this project. Mode tanpa login: semua request memakai pengguna anonim
 * dari server (tidak ada session / database).
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
  // -------- Auth (mode tanpa login — selalu pengguna anonim) --------
  async getUser(): Promise<User | null> {
    try {
      const res = await api('/api/auth/user');
      if (!res.ok) return null;
      const data = (await res.json()) as { user: User };
      return data.user ?? null;
    } catch {
      return null;
    }
  },

  async signOut(): Promise<void> {
    await api('/api/auth/logout', { method: 'POST' });
  },
};
