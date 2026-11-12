import { cookies } from 'next/headers';

export interface SessionUser {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  status: string;
}

const TOKEN_KEY = 'randmail_session';

/**
 * Mode tanpa login: semua pengunjung aplikasi masuk sebagai pengguna anonim.
 * Tidak ada JWT, cookie, atau database yang dipakai sama sekali.
 */
export function getAnonymousUser(): SessionUser {
  return {
    id: 'anonymous',
    email: 'anonymous@randmail.app',
    full_name: null,
    role: 'user',
    status: 'active',
  };
}

/**
 * Kembali pengguna sesi aktif — selalu mode tanpa login (pengguna anonim).
 * Tidak pernah null karena aplikasi berjalan tanpa autentikasi.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  return getAnonymousUser();
}

/**
 * Bersihkan cookie sesi (tidak ada sesi permanen — hanya hapus cookie).
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_KEY, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
