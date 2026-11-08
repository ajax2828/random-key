import { AI_PROVIDERS } from '@/lib/ai';
import { query, setPoolConfig, LocalDbConfig, testLocalConnection } from '@/lib/db';

/**
 * Data provider abstraction — routes CRUD untuk tabel data (accounts / vault /
 * profiles) ke PostgreSQL lokal ("local") atau Supabase ("supabase") sesuai
 * konfigurasi di tabel app_settings.
 *
 * Auth (users/sessions) selalu memakai PostgreSQL lokal dengan JWT cookie.
 */

export type Table = 'accounts' | 'vault' | 'profiles';

interface TableMeta {
  table: string;
  fields: string[];
  select: string;
}

export const DATA_TABLES: Record<Table, TableMeta> = {
  accounts: {
    table: 'generated_accounts',
    fields: ['email', 'password'],
    select: 'id, email, password, created_at',
  },
  vault: {
    table: 'password_vault',
    fields: ['label', 'password', 'length', 'strength', 'use_upper', 'use_lower', 'use_numbers', 'use_symbols'],
    select: 'id, label, password, length, strength, use_upper, use_lower, use_numbers, use_symbols, created_at',
  },
  profiles: {
    table: 'form_profiles',
    fields: [
      'gender', 'fullname', 'email', 'password', 'phone', 'birthdate', 'username',
      'address', 'job', 'nik', 'hobby', 'education', 'religion', 'form_link',
    ],
    select: 'id, gender, fullname, email, password, phone, birthdate, username, address, job, nik, hobby, education, religion, form_link, created_at',
  },
};

export interface AppSettings {
  db_provider: 'local' | 'supabase';
  supabase_url: string;
  supabase_anon_key: string;
  supabase_service_key: string;
  local_host: string;
  local_port: string;
  local_database: string;
  local_user: string;
  local_password: string;
  ai_provider: string;
  ai_model: string;
  ai_api_key: string;
  ai_base_url: string;
}

const DEFAULTS: AppSettings = {
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

// Fallback memori saat DB tidak tersedia — perubahan dashboard tetap tampil
// (berlaku sampai server dimulai ulang) dan ditandai `persisted: false`.
let memorySettings: Partial<AppSettings> | null = null;

let lastPoolFingerprint: string | null = null;

/**
 * Terapkan konfigurasi koneksi PostgreSQL lokal ke pg pool bila berubah.
 * Kosong => kembali ke DATABASE_URL env.
 */
async function syncPoolConfig(settings: AppSettings): Promise<void> {
  const cfg: LocalDbConfig | null =
    settings.local_host || settings.local_port || settings.local_database ||
    settings.local_user || settings.local_password
      ? {
          host: settings.local_host,
          port: settings.local_port,
          database: settings.local_database,
          user: settings.local_user,
          password: settings.local_password,
        }
      : null;
  const fingerprint = cfg
    ? JSON.stringify([cfg.host, cfg.port, cfg.database, cfg.user, cfg.password])
    : 'env';
  if (fingerprint === lastPoolFingerprint) return;
  lastPoolFingerprint = fingerprint;
  await setPoolConfig(cfg);
}

/**
 * Baca pengaturan aplikasi dari tabel app_settings (PostgreSQL lokal).
 * Urutan prioritas: DB > memori (session) > env AI key > default.
 * Jika DB tidak tersedia, tetap mengembalikan pengaturan terbaru yang disimpan
 * di memori proses (atau default) agar stabil.
 */
export async function getAppSettings(): Promise<AppSettings> {
  const settings: AppSettings = { ...DEFAULTS };

  // Env fallback untuk kunci AI
  const envAiKey =
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.MISTRAL_API_KEY ||
    process.env.XAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    '';
  if (envAiKey) settings.ai_api_key = envAiKey;

  // Env fallback untuk provider/model/base URL (prioritas di bawah DB/memori)
  if (process.env.AI_PROVIDER) settings.ai_provider = process.env.AI_PROVIDER;
  if (process.env.AI_MODEL) settings.ai_model = process.env.AI_MODEL;
  if (process.env.AI_BASE_URL) settings.ai_base_url = process.env.AI_BASE_URL;

  // Prioritas kedua: memori sesi (tersimpan walau DB mati)
  if (memorySettings) {
    Object.assign(settings, memorySettings);
  }

  try {
    const result = await query<{ key: string; value: string }>(
      'SELECT key, value FROM app_settings'
    );
    const map: Record<string, string> = {};
    result.rows.forEach((r) => {
      map[r.key] = r.value;
    });
    if (map.db_provider === 'local' || map.db_provider === 'supabase') {
      settings.db_provider = map.db_provider;
    }
    settings.supabase_url = map.supabase_url || '';
    settings.supabase_anon_key = map.supabase_anon_key || '';
    settings.supabase_service_key = map.supabase_service_key || '';
    settings.local_host = map.local_host || '';
    settings.local_port = map.local_port || '';
    settings.local_database = map.local_database || '';
    settings.local_user = map.local_user || '';
    settings.local_password = map.local_password || '';
    if (AI_PROVIDERS.some((p) => p.id === map.ai_provider)) {
      settings.ai_provider = map.ai_provider;
    }
    settings.ai_model = map.ai_model || DEFAULTS.ai_model;
    if (map.ai_api_key) settings.ai_api_key = map.ai_api_key;
    settings.ai_base_url = map.ai_base_url || '';
  } catch {
    // DB down — pakai default/memori
  }

  await syncPoolConfig(settings);
  return settings;
}

const LOCAL_KEY_OVERRIDES: (keyof AppSettings)[] = [
  'local_host',
  'local_port',
  'local_database',
  'local_user',
];

export async function saveAppSettings(
  partial: Partial<AppSettings>
): Promise<{ settings: AppSettings; persisted: boolean }> {
  const current = await getAppSettings();
  const merged: AppSettings = { ...current, ...partial };
  memorySettings = { ...merged };
  await syncPoolConfig(merged);

  const entries: [string, string][] = [
    ['db_provider', merged.db_provider],
    ['supabase_url', merged.supabase_url],
    ['supabase_anon_key', merged.supabase_anon_key],
    ['supabase_service_key', merged.supabase_service_key],
    ...LOCAL_KEY_OVERRIDES.map(
      (k) => [k as string, merged[k] as string] as [string, string]
    ),
    ['ai_provider', merged.ai_provider],
    ['ai_model', merged.ai_model],
  ];
  if (partial.ai_api_key !== undefined) entries.push(['ai_api_key', merged.ai_api_key]);
  if (partial.local_password !== undefined) entries.push(['local_password', merged.local_password]);
  entries.push(['ai_base_url', merged.ai_base_url]);

  let allPersisted = true;
  for (const [key, value] of entries) {
    try {
      await query(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, value]
      );
    } catch {
      allPersisted = false;
    }
  }

  return { settings: merged, persisted: allPersisted };
}

export interface DataProvider {
  kind: 'local' | 'supabase';
  list(userId: string): Promise<Record<string, unknown>[]>;
  insert(userId: string, items: Record<string, unknown>[]): Promise<Record<string, unknown>[]>;
  deleteById(userId: string, id: string): Promise<{ deleted: boolean }>;
  deleteAll(userId: string): Promise<{ deleted: boolean }>;
}

export async function getDataProvider(table: Table): Promise<DataProvider> {
  const settings = await getAppSettings();
  if (settings.db_provider === 'supabase' && settings.supabase_url && settings.supabase_service_key) {
    return { ...buildSupabaseProvider(DATA_TABLES[table], settings), kind: 'supabase' };
  }
  return { ...buildLocalProvider(DATA_TABLES[table]), kind: 'local' };
}

function buildLocalProvider(meta: TableMeta): DataProvider {
  return {
    kind: 'local',
    async list(userId: string) {
      const result = await query(
        `SELECT ${meta.select} FROM ${meta.table} WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows as Record<string, unknown>[];
    },
    async insert(userId: string, items: Record<string, unknown>[]) {
      const values: string[] = [];
      const params: (string | number | boolean | null)[] = [userId];
      let paramIdx = 2;
      for (const item of items) {
        const placeholders = meta.fields.map(() => `$${paramIdx++}`).join(', ');
        values.push(`($1, ${placeholders})`);
        meta.fields.forEach((f) => params.push((item[f] as string | number | boolean | null) ?? null));
      }
      const result = await query(
        `INSERT INTO ${meta.table} (user_id, ${meta.fields.join(', ')})
         VALUES ${values.join(', ')}
         RETURNING ${meta.select}`,
        params
      );
      return result.rows as Record<string, unknown>[];
    },
    async deleteById(userId: string, id: string) {
      await query(`DELETE FROM ${meta.table} WHERE id = $1 AND user_id = $2`, [id, userId]);
      return { deleted: true };
    },
    async deleteAll(userId: string) {
      await query(`DELETE FROM ${meta.table} WHERE user_id = $1`, [userId]);
      return { deleted: true };
    },
  };
}

function buildSupabaseProvider(
  meta: TableMeta,
  settings: AppSettings
): Omit<DataProvider, 'kind'> {
  const loadClient = async () => {
    const mod = await import('@supabase/supabase-js');
    return mod.createClient(settings.supabase_url, settings.supabase_service_key, {
      auth: { persistSession: false },
    });
  };

  return {
    async list(userId: string) {
      const client = await loadClient();
      const { data, error } = await client
        .from(meta.table)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data as Record<string, unknown>[]) || [];
    },
    async insert(userId: string, items: Record<string, unknown>[]) {
      const client = await loadClient();
      const { data, error } = await client
        .from(meta.table)
        .insert(items.map((i) => ({ user_id: userId, ...i })))
        .select();
      if (error) throw new Error(error.message);
      return (data as Record<string, unknown>[]) || [];
    },
    async deleteById(userId: string, id: string) {
      const client = await loadClient();
      const { error } = await client
        .from(meta.table)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
      return { deleted: true };
    },
    async deleteAll(userId: string) {
      const client = await loadClient();
      const { error } = await client.from(meta.table).delete().eq('user_id', userId);
      if (error) throw new Error(error.message);
      return { deleted: true };
    },
  };
}

/** Tes koneksi ke provider data terpilih. */
export async function testDataConnection(
  settings: AppSettings
): Promise<{ ok: boolean; message: string; version?: string }> {
  if (settings.db_provider === 'supabase') {
    if (!settings.supabase_url || !settings.supabase_service_key) {
      return { ok: false, message: 'Supabase URL & Service Key harus diisi.' };
    }
    try {
      const mod = await import('@supabase/supabase-js');
      const client = mod.createClient(settings.supabase_url, settings.supabase_service_key, {
        auth: { persistSession: false },
      });
      const { error } = await client.from('generated_accounts').select('id').limit(1);
      if (error) throw new Error(error.message);
      return {
        ok: true,
        version: 'Supabase (PostgreSQL 17 yang dikelola)',
        message: 'Terhubung ke Supabase dengan sukses.',
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Gagal konek Supabase.' };
    }
  }

  const config: LocalDbConfig | null =
    settings.local_host || settings.local_port || settings.local_database ||
    settings.local_user || settings.local_password
      ? {
          host: settings.local_host || 'localhost',
          port: settings.local_port || '5432',
          database: settings.local_database,
          user: settings.local_user,
          password: settings.local_password,
        }
      : null;

  return testLocalConnection(config);
}