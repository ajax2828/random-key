import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running schema...');
  await client.query(schema);
  console.log('Schema applied successfully.');

  // Verify tables
  const res = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  const tables = res.rows.map((r) => r.tablename);
  console.log('Tables:', tables.join(', '));

  await client.end();
  console.log('Done.');
}

main().catch((err) => {
  console.error('DB setup error:', err);
  process.exit(1);
});
