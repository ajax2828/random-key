import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

// GET /api/auth/user
// Returns the currently authenticated user (or null if not logged in)
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const { ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error('Get user error:', err);
    return NextResponse.json({ user: null });
  }
}
