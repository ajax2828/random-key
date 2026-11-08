import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings, saveAppSettings, AppSettings } from '@/lib/dataProvider';
import { getSessionUser } from '@/lib/session';

function maskKey(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function sanitizeSettings(s: AppSettings) {
  return {
    db_provider: s.db_provider,
    supabase_url: s.supabase_url,
    supabase_has_anon: !!s.supabase_anon_key,
    supabase_has_service: !!s.supabase_service_key,
    supabase_anon_key_preview: s.supabase_anon_key ? maskKey(s.supabase_anon_key) : '',
    supabase_service_key_preview: s.supabase_service_key ? maskKey(s.supabase_service_key) : '',
    local_host: s.local_host,
    local_port: s.local_port,
    local_database: s.local_database,
    local_user: s.local_user,
    local_has_password: !!s.local_password,
    local_password_preview: s.local_password ? '••••••••' : '',
    ai_provider: s.ai_provider,
    ai_model: s.ai_model,
    ai_has_key: !!s.ai_api_key,
    ai_key_preview: s.ai_api_key ? maskKey(s.ai_api_key) : '',
    ai_base_url: s.ai_base_url,
  };
}

// GET /api/admin/settings — baca konfigurasi (key di-mask)
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await getAppSettings();
  return NextResponse.json({ settings: sanitizeSettings(settings) });
}

// POST /api/admin/settings — simpan konfigurasi
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const partial: Partial<AppSettings> = {};
  if (body.db_provider === 'local' || body.db_provider === 'supabase') {
    partial.db_provider = body.db_provider;
  }
  if (typeof body.supabase_url === 'string') partial.supabase_url = body.supabase_url.trim();
  if ('supabase_anon_key' in body) {
    partial.supabase_anon_key = typeof body.supabase_anon_key === 'string' ? body.supabase_anon_key.trim() : '';
  }
  if ('supabase_service_key' in body) {
    partial.supabase_service_key = typeof body.supabase_service_key === 'string' ? body.supabase_service_key.trim() : '';
  }
  const localFields: (keyof AppSettings)[] = ['local_host', 'local_port', 'local_database', 'local_user', 'local_password'];
  for (const f of localFields) {
    if (f in body) {
      (partial as unknown as Record<string, unknown>)[f] = typeof body[f] === 'string' ? body[f].trim() : '';
    }
  }
  if (typeof body.ai_provider === 'string' && body.ai_provider.trim()) {
    partial.ai_provider = body.ai_provider.trim();
  }
  if (typeof body.ai_model === 'string' && body.ai_model.trim()) partial.ai_model = body.ai_model.trim();
  if ('ai_api_key' in body) {
    partial.ai_api_key = typeof body.ai_api_key === 'string' ? body.ai_api_key.trim() : '';
  }
  if ('ai_base_url' in body) {
    partial.ai_base_url = typeof body.ai_base_url === 'string' ? body.ai_base_url.trim() : '';
  }

  // Jika provider => local, abaikan data supabase yang diisi
  if (partial.db_provider === 'local') {
    partial.supabase_url = '';
    partial.supabase_anon_key = '';
    partial.supabase_service_key = '';
  }

  const saved = await saveAppSettings(partial);
  return NextResponse.json({
    settings: sanitizeSettings(saved.settings),
    persisted: saved.persisted,
  });
}