import { NextResponse } from 'next/server';
import { query, getDbVersion, summarizeDbVersion } from '@/lib/db';
import { getAppSettings } from '@/lib/dataProvider';

// GET /api/health — status layanan: DB & provider data aktif
export async function GET() {
  let db: 'up' | 'down' = 'down';
  let dbVersion: string | null = null;
  try {
    const result = await query('SELECT 1 AS ok');
    const ok = result.rows[0]?.ok === 1;
    if (ok) {
      db = 'up';
      try {
        const version = await getDbVersion();
        if (version) dbVersion = summarizeDbVersion(version);
      } catch {}
    }
  } catch {
    db = 'down';
  }

  let settings;
  try {
    settings = await getAppSettings();
  } catch {
    settings = { db_provider: 'local' as const };
  }

  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    db,
    db_version: dbVersion,
    provider: settings.db_provider || 'local',
  });
}
