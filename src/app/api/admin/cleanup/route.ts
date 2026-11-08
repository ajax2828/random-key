import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDataProvider } from '@/lib/dataProvider';
import { getSessionUser } from '@/lib/session';

// POST /api/admin/cleanup — bersihkan sampah backend
//  - Hapus semua session expired (global, sampah backend)
//  - Jika includeHistory=true, hapus semua data history milik user aktif
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { includeHistory?: boolean };
  const includeHistory = body.includeHistory !== false; // default true

  let expiredSessions = 0;
  let accounts = 0;
  let vaults = 0;
  let profiles = 0;

  // Sampah backend: hapus session expired (global, tidak terikat user)
  try {
    const res = await query('DELETE FROM sessions WHERE expires_at <= NOW()');
    expiredSessions = res.rowCount ?? 0;
  } catch {
    // DB down — skip
  }

  if (includeHistory) {
    try {
      const aProv = await getDataProvider('accounts');
      await aProv.deleteAll(user.id);
      accounts = 1; // indikator bahwa operasi delete all sudah jalan
    } catch { /* skip */ }
    try {
      const vProv = await getDataProvider('vault');
      await vProv.deleteAll(user.id);
      vaults = 1;
    } catch { /* skip */ }
    try {
      const pProv = await getDataProvider('profiles');
      await pProv.deleteAll(user.id);
      profiles = 1;
    } catch { /* skip */ }
  }

  return NextResponse.json({
    ok: true,
    expiredSessions,
    includeHistory,
    historyCleared: includeHistory ? { accounts, vaults, profiles } : null,
  });
}