import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

// GET /api/accounts  — list accounts
// POST /api/accounts  — insert one or more
// DELETE /api/accounts?id=uuid  — delete single
// DELETE /api/accounts?all=true  — delete all for user
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query(
    'SELECT id, email, password, created_at FROM generated_accounts WHERE user_id = $1 ORDER BY created_at DESC',
    [user.id]
  );
  return NextResponse.json({ data: result.rows });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const items = Array.isArray(body) ? body : [body];

  const values: string[] = [];
  const params: (string | number)[] = [user.id];
  let paramIdx = 2;

  for (const item of items) {
    values.push(`($1, $${paramIdx}, $${paramIdx + 1})`);
    params.push(item.email, item.password);
    paramIdx += 2;
  }

  const result = await query(
    `INSERT INTO generated_accounts (user_id, email, password)
     VALUES ${values.join(', ')}
     RETURNING id, email, password, created_at`,
    params
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
    await query('DELETE FROM generated_accounts WHERE user_id = $1', [user.id]);
    return NextResponse.json({ deleted: true });
  }

  if (id) {
    await query('DELETE FROM generated_accounts WHERE id = $1 AND user_id = $2', [id, user.id]);
    return NextResponse.json({ deleted: true });
  }

  return NextResponse.json({ error: 'Missing id' }, { status: 400 });
}
