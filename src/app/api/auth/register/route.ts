import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';
import { createSession } from '@/lib/session';

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);
    const result = await query(
      `INSERT INTO users (email, password, full_name, role, status)
       VALUES ($1, $2, $3, 'user', 'active')
       RETURNING id, email, full_name, role, status`,
      [email, hashed, full_name || null]
    );

    const user = result.rows[0];
    await createSession(user.id);

    return NextResponse.json({ user });
  } catch (err: unknown) {
    console.error('Register error:', err);
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
