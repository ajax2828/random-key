import { NextRequest, NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/dataProvider';
import { getSessionUser } from '@/lib/session';

// GET /api/vault     — list vault items
// POST /api/vault    — insert one
// DELETE /api/vault?id=uuid       — delete single
// DELETE /api/vault?all=true      — delete all for user

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const provider = await getDataProvider('vault');
    const data = await provider.list(user.id);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const provider = await getDataProvider('vault');
    const data = await provider.insert(user.id, [
      {
        label: body.label ?? null,
        password: body.password,
        length: body.length ?? 18,
        strength: body.strength ?? 'Sedang',
        use_upper: body.use_upper ?? true,
        use_lower: body.use_lower ?? true,
        use_numbers: body.use_numbers ?? true,
        use_symbols: body.use_symbols ?? true,
      },
    ]);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const all = searchParams.get('all') === 'true';

  try {
    const provider = await getDataProvider('vault');

    if (all) {
      await provider.deleteAll(user.id);
      return NextResponse.json({ deleted: true });
    }

    if (id) {
      await provider.deleteById(user.id, id);
      return NextResponse.json({ deleted: true });
    }
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });
  }

  return NextResponse.json({ error: 'Missing id' }, { status: 400 });
}