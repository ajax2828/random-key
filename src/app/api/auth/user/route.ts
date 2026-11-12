import { NextResponse } from 'next/server';
import { getAnonymousUser } from '@/lib/session';

// GET /api/auth/user
// Mode tanpa login: selalu mengembalikan pengguna anonim (tanpa session/database).
export async function GET() {
  const user = getAnonymousUser();
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
    },
  });
}
