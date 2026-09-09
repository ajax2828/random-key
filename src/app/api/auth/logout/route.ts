import { NextResponse } from 'next/server';

// POST /api/auth/logout
export async function POST() {
  try {
    // The session cookie is cleared client-side via fetch; here we just clear the cookie.
    const response = NextResponse.json({ success: true });
    response.cookies.set('randmail_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (err: unknown) {
    console.error('Logout error:', err);
    const message = err instanceof Error ? err.message : 'Logout gagal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
