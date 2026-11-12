import { NextResponse } from 'next/server';

// GET /api/health — status layanan (mode tanpa login & tanpa database).
// Tidak lagi terhubung ke PostgreSQL/Supabase.
export async function GET() {
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    db: 'down',
    db_version: null,
    provider: 'none',
  });
}
