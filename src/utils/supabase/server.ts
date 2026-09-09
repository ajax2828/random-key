/**
 * Server-side session helpers (replaces @supabase/ssr createServerClient).
 *
 * The actual session logic lives in src/lib/session.ts.
 * This module re-exports convenience wrappers that match the old
 * `createClient()` call signature so that App Router pages can do:
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 * But internally everything is routed to the local API + DB sessions.
 */
import { SessionUser, verifySession, clearSession } from '@/lib/session';
import { cookies } from 'next/headers';

const TOKEN_KEY = 'randmail_session';

async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Drop-in replacement for the old `createClient()` server utility.
 * Returns an object with a `auth.getUser()` method so existing call-sites
 * like `await supabase.auth.getUser()` keep working.
 */
export async function createClient() {
  return {
    auth: {
      getUser: async () => {
        const user = await getCurrentUser();
        return { data: { user }, error: null };
      },
      signOut: async () => {
        await clearSession();
        return { error: null };
      },
    },
  };
}
