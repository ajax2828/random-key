import { Pool, QueryResult, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL;

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      // Optional extra tuning can be appended here
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const client = getPool();
  return client.query<T>(text, params);
}

// Gracefully close the pool on shutdown (useful for tests / hot-reload)
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
