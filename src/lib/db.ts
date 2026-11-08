import { Pool, QueryResult, QueryResultRow, PoolConfig } from 'pg';

const connectionString = process.env.DATABASE_URL;

export interface LocalDbConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

let customConfig: LocalDbConfig | null = null;
let pool: Pool | null = null;

function buildPoolConfig(): PoolConfig {
  if (customConfig) {
    return {
      host: customConfig.host,
      port: Number(customConfig.port) || 5432,
      database: customConfig.database,
      user: customConfig.user,
      password: customConfig.password,
      ssl: false,
    };
  }
  return { connectionString };
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(buildPoolConfig());
  }
  return pool;
}

/**
 * Ganti konfigurasi koneksi PostgreSQL lokal (dari dashboard > Database).
 * Kirim `null` untuk kembali ke DATABASE_URL dari env.
 */
export async function setPoolConfig(config: LocalDbConfig | null): Promise<void> {
  if (pool) {
    await pool.end().catch(() => undefined);
    pool = null;
  }
  customConfig = config
    ? { ...config, host: config.host || 'localhost', port: config.port || '5432' }
    : null;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = getPool();
  return client.query<T>(text, params);
}

/** Ambil versi PostgreSQL terhubung (query SELECT version()). */
export async function getDbVersion(): Promise<string> {
  const result = await query<{ version: string }>('SELECT version()');
  return result.rows[0]?.version || '';
}

/** Ringkas string version() menjadi label singkat, mis. "PostgreSQL 16.3". */
export function summarizeDbVersion(version: string): string {
  const m = /PostgreSQL[\s]+(\d+\.\d+)/.exec(version);
  return m ? `PostgreSQL ${m[1]}` : version.split(' on ')[0].trim();
}

/**
 * Tes koneksi tanpa mengubah pool global — membuat koneksi ephemeral.
 * `config` null => memakai DATABASE_URL env. Mengembalikan string version().
 */
export async function testLocalConnection(
  config: LocalDbConfig | null
): Promise<{ ok: boolean; message: string; version?: string }> {
  const { Client } = await import('pg');
  const client = new Client(
    config
      ? {
          host: config.host,
          port: Number(config.port) || 5432,
          database: config.database,
          user: config.user,
          password: config.password,
          ssl: false,
        }
      : { connectionString }
  );
  try {
    await client.connect();
    const result = await client.query('SELECT version()');
    const version = result.rows[0]?.version as string | undefined;
    return version
      ? { ok: true, version: summarizeDbVersion(version), message: 'Terhubung dengan sukses.' }
      : { ok: false, message: 'Respon aneh dari database.' };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error && err.message
          ? err.message
          : 'Tidak dapat terhubung ke PostgreSQL lokal.',
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

// Gracefully close the pool on shutdown (useful for tests / hot-reload)
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}