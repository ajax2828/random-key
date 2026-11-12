import { NextRequest, NextResponse } from 'next/server';

// GET /api/vault — mode tanpa login & tanpa database: list selalu kosong.
export async function GET() {
  return NextResponse.json({ data: [] });
}

// POST /api/vault — mode tanpa login & tanpa database: tidak menyimpan apa pun.
export async function POST() {
  return NextResponse.json({ data: [] });
}

// DELETE /api/vault?id=uuid — mode tanpa login & tanpa database: tidak ada yang dihapus.
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const all = searchParams.get('all') === 'true';

  if (all || id) {
    return NextResponse.json({ deleted: true });
  }
  return NextResponse.json({ error: 'Missing id' }, { status: 400 });
}
