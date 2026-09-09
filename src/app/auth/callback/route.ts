import { NextResponse } from 'next/server';

// GET /auth/callback  (legacy — kept for backward compat but no-op)
// Supabase OAuth redirects land here. Since we removed Supabase,
// this route now just redirects to the target or login.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') ?? '/dashboard';

  // If there's a code param, we don't use it anymore (no Supabase OAuth).
  // Just redirect to the target or login.
  return NextResponse.redirect(`${origin}${next}`);
}
