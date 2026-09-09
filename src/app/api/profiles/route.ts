import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

// GET /api/profiles      — list profiles
// POST /api/profiles     — insert one or more
// DELETE /api/profiles?id=uuid
// DELETE /api/profiles?all=true

interface ProfileFields {
  gender?: string;
  fullname?: string;
  email?: string;
  password?: string;
  phone?: string;
  birthdate?: string;
  username?: string;
  address?: string;
  job?: string;
  nik?: string;
  hobby?: string;
  education?: string;
  religion?: string;
  form_link?: string;
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query(
    `SELECT id, gender, fullname, email, password, phone, birthdate, username,
            address, job, nik, hobby, education, religion, form_link, created_at
     FROM form_profiles
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
  const items: ProfileFields[] = Array.isArray(body) ? body : [body];

  const values: string[] = [];
  const params: (string | number | null)[] = [user.id];
  let paramIdx = 2;

  const fields = [
    'gender', 'fullname', 'email', 'password', 'phone', 'birthdate',
    'username', 'address', 'job', 'nik', 'hobby', 'education', 'religion', 'form_link',
  ];

  for (const item of items) {
    const placeholders = fields.map(() => `$${paramIdx++}`).join(', ');
    values.push(`($1, ${placeholders})`);
    const fieldValues = fields.map((f) => item[f as keyof ProfileFields] ?? null);
    params.push(...fieldValues);
  }

  const result = await query(
    `INSERT INTO form_profiles
       (user_id, ${fields.join(', ')})
     VALUES ${values.join(', ')}
     RETURNING id, ${fields.join(', ')}, created_at`,
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
    await query('DELETE FROM form_profiles WHERE user_id = $1', [user.id]);
    return NextResponse.json({ deleted: true });
  }

  if (id) {
    await query('DELETE FROM form_profiles WHERE id = $1 AND user_id = $2', [id, user.id]);
    return NextResponse.json({ deleted: true });
  }

  return NextResponse.json({ error: 'Missing id' }, { status: 400 });
}
