/**
 * Server-side session helpers used by App Router layout & pages.
 * These wrap the session module so components don't import it directly.
 */
import { cookies } from 'next/headers';
import { verifySession, SessionUser, clearSession as clearCookie } from '@/lib/session';

const TOKEN_KEY = 'randmail_session';

export async function getUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function signOut() {
  'use server';
  await clearCookie();
}
