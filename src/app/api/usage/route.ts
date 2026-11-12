import { NextResponse } from 'next/server';

// GET /api/usage — mode tanpa login & tanpa database: statis tanpa pemakaian.
export async function GET() {
  return NextResponse.json({
    tools: [],
    daily: [],
    total: 0,
  });
}

// POST /api/usage — mode tanpa login & tanpa database: tidak pernah menyimpan.
export async function POST() {
  return NextResponse.json({ ok: true });
}
