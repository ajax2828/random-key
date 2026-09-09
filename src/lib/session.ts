import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const TOKEN_KEY = 'randmail_session';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-change-me';
// 30 day session
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  status: string;
}

// Lazily import jsonwebtoken — only when this module runs (server side)
let jwt: typeof import('jsonwebtoken') | null = null;
async function getJwt() {
  if (!jwt) {
    jwt = await import('jsonwebtoken');
  }
  return jwt;
}

/**
 * Create a session for the given user and persist it to the DB + set cookie.
 */
export async function createSession(userId: string) {
  const { sign } = await getJwt();
  const userRes = await query(
    'SELECT id, email, full_name, role, status FROM users WHERE id = $1',
    [userId]
  );
  const user = userRes.rows[0] as SessionUser;
  if (!user) throw new Error('User not found');

  const token = sign({ uid: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '30d',
  });

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await query(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, token, expiresAt]
  );

  const cookieStore = await cookies();
  cookieStore.set(TOKEN_KEY, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS / 1000,
    path: '/',
  });

  return user;
}

/**
 * Verify the JWT token and return the session user (or null).
 */
export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { verify } = await getJwt();
    const payload = verify(token, JWT_SECRET) as { uid: string; email: string };

    // Check DB session still valid
    const sessionRes = await query(
      'SELECT s.expires_at, u.id, u.email, u.full_name, u.role, u.status ' +
      'FROM sessions s JOIN users u ON u.id = s.user_id ' +
      'WHERE s.token = $1 AND s.expires_at > NOW()',
      [token]
    );

    if (sessionRes.rowCount === 0) return null;
    const row = sessionRes.rows[0];
    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      role: row.role,
      status: row.status,
    };
  } catch {
    return null;
  }
}

/**
 * Return the current session user from a NextRequest (middleware / API route).
 */
export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(TOKEN_KEY)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Clear the session cookie.
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

  // Delete from DB if token present
  const token = cookieStore.get(TOKEN_KEY)?.value;
  if (token) {
    await query('DELETE FROM sessions WHERE token = $1', [token]);
  }
}

/**
 * Middleware helper: attach session user to NextResponse locals via header.
 * Returns a NextResponse that can be returned from middleware.
 */
export async function middlewareUpdateSession(
  request: NextRequest,
  protectedPaths: string[] = ['/dashboard', '/pass', '/history', '/tools', '/sertif', '/nota']
): Promise<NextResponse> {
  const response = NextResponse.next({ request });
  const token = request.cookies.get(TOKEN_KEY)?.value;

  let user: SessionUser | null = null;
  if (token) {
    user = await verifySession(token);
  }

  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}
