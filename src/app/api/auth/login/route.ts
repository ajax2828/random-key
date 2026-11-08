import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword } from '@/lib/auth-utils';
import { createSession, createDemoSession } from '@/lib/session';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/demo';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const demoUser = await createDemoSession(email.trim().toLowerCase());
      return NextResponse.json({ user: demoUser, demo: true });
    }

    const result = await query(
      'SELECT id, email, password, full_name, role, status FROM users WHERE email = $1',
      [email]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Email atau password salah. Jika belum daftar, silakan Register.' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: 'Email atau password salah. Jika belum daftar, silakan Register.' },
        { status: 401 }
      );
    }

    if (user.status === 'blocked' || user.status === 'inactive') {
      return NextResponse.json(
        { error: `Akun Anda di-status '${user.status}'. Hubungi admin.` },
        { status: 403 }
      );
    }

    const sessionUser = await createSession(user.id);

    // Return user data without sensitive fields
    const safeUser = {
      id: sessionUser.id,
      email: sessionUser.email,
      full_name: sessionUser.full_name,
      role: sessionUser.role,
      status: sessionUser.status,
    };
    return NextResponse.json({ user: safeUser });
  } catch (err: unknown) {
    console.error('Login error:', err);
    const message =
      err instanceof Error && err.message
        ? err.message
        : 'Terjadi kesalahan saat login. Pastikan database aktif dan coba lagi.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
