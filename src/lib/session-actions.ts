/**
 * Server-side session helpers — mode tanpa login.
 * Pengguna selalu anonim, tanpa cookie/JWT/database.
 */
import { getAnonymousUser, SessionUser, clearSession as clearCookie } from '@/lib/session';

export async function getUser(): Promise<SessionUser | null> {
  return getAnonymousUser();
}

export async function signOut() {
  'use server';
  await clearCookie();
}
