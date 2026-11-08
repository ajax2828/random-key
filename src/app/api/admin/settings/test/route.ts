import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings, testDataConnection, AppSettings } from '@/lib/dataProvider';
import { getSessionUser } from '@/lib/session';
import { pingAi } from '@/lib/ai';

// POST /api/admin/settings/test — tes koneksi DB & AI
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let settings: AppSettings;
  try {
    settings = await getAppSettings();
  } catch {
    settings = {
      db_provider: 'local',
      supabase_url: '',
      supabase_anon_key: '',
      supabase_service_key: '',
      local_host: '',
      local_port: '',
      local_database: '',
      local_user: '',
      local_password: '',
      ai_provider: 'openai',
      ai_model: 'gpt-4o-mini',
      ai_api_key: '',
      ai_base_url: '',
    };
  }

  // Override dengan body jika disertakan
  const body = await request.json().catch(() => ({}));
  if (body.db_provider) settings.db_provider = body.db_provider;
  if (body.supabase_url) settings.supabase_url = body.supabase_url;
  if (body.supabase_service_key) settings.supabase_service_key = body.supabase_service_key;
  ['local_host', 'local_port', 'local_database', 'local_user'].forEach((f) => {
    if (body[f] !== undefined) (settings as unknown as Record<string, unknown>)[f] = body[f];
  });
  if (body.local_password) settings.local_password = body.local_password;
  if (body.ai_provider) settings.ai_provider = body.ai_provider;
  if (body.ai_model) settings.ai_model = body.ai_model;
  if (body.ai_api_key) settings.ai_api_key = body.ai_api_key;
  if (body.ai_base_url) settings.ai_base_url = body.ai_base_url;

  const dbResult = await testDataConnection(settings);
  const aiResult = await pingAi(settings);

  return NextResponse.json({ db: dbResult, ai: aiResult });
}