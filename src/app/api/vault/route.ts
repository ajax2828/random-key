import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

// GET /api/vault     — list vault items
// POST /api/vault    — insert one
// DELETE /api/vault?id=uuid       — delete single
// DELETE /api/vault?all=true      — delete all for user

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query(
    `SELECT id, label, password, length, strength,
            use_upper, use_lower, use_numbers, use_symbols, created_at
     FROM password_vault
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [user.id]
  );
  return NextResponse.json({ data: result.rows });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const result = await query(
    `INSERT INTO password_vault
       (user_id, label, password, length, strength, use_upper, use_lower, use_numbers, use_symbols)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, label, password, length, strength,
               use_upper, use_lower, use_numbers, use_symbols, created_at`,
    [
      user.id,
      body.label || null,
      body.password,
      body.length || 18,
      body.strength || 'Sedang',
      body.use_upper ?? true,
      body.use_lower ?? true,
      body.use_numbers ?? true,
      body.use_symbols ?? true,
    ]
  );
  return NextResponse.json({ data: result.rows });
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const all = searchParams.get('all') === 'true';

  if (all) {
    await query('DELETE FROM password_vault WHERE user_id = $1', [user.id]);
    return NextResponse.json({ deleted: true });
  }

  if (id) {
    await query('DELETE FROM password_vault WHERE id = $1 AND user_id = $2', [id, user.id]);
    return NextResponse.json({ deleted: true });
  }

  return NextResponse.json({ error: 'Missing id' }, { status: 400 });
}
