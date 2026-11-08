import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

// GET /api/usage  — agregasi pemakaian per tool & per hari (7 hari)
// POST /api/usage — catat pemakaian { tool, action }
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [toolsRes, dailyRes, totalRes] = await Promise.all([
      query<{ tool: string; count: number }>(
        `SELECT tool, COUNT(*)::int AS count
         FROM usage_log
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY tool`,
        [user.id]
      ),
      query<{ day: string; count: number }>(
        `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
         FROM usage_log
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '14 days'
         GROUP BY day ORDER BY day`,
        [user.id]
      ),
      query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM usage_log WHERE user_id = $1`,
        [user.id]
      ),
    ]);

    return NextResponse.json({
      tools: toolsRes.rows,
      daily: dailyRes.rows,
      total: totalRes.rows[0]?.count ?? 0,
    });
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);

  const body = await request.json().catch(() => ({})) as { tool?: string; action?: string };
  if (!body.tool) return NextResponse.json({ error: 'Missing tool' }, { status: 400 });

  // Tamu: cukup catat di localStorage klien, tidak disimpan ke DB
  if (!user) return NextResponse.json({ ok: true });

  try {
    await query(
      'INSERT INTO usage_log (user_id, tool, action) VALUES ($1, $2, $3)',
      [user.id, body.tool.slice(0, 60), (body.action || 'generate').slice(0, 60)]
    );
    return NextResponse.json({ ok: true });
  } catch {
    // DB down — klien tetap mencatat ke localStorage
    return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });
  }
}