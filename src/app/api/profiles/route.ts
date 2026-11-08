import { NextRequest, NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/dataProvider';
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

  try {
    const provider = await getDataProvider('profiles');
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
    const items: ProfileFields[] = Array.isArray(body) ? body : [body];
    const provider = await getDataProvider('profiles');
    const data = await provider.insert(user.id, items as Record<string, unknown>[]);
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
    const provider = await getDataProvider('profiles');

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