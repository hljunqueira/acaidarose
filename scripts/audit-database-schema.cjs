// Explicitly read-only. Use --live to inspect the configured PostgreSQL schema.
// Never prints connection strings, row data, secrets, or SQL default values.
const fs = require('node:fs');
const path = require('node:path');
if (!process.argv.includes('--live')) {
  console.log('Usage: node scripts/audit-database-schema.cjs --live (READ ONLY)');
  process.exit(0);
}
require('@next/env').loadEnvConfig(process.cwd());
const { Client } = require('pg');
const raw = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!raw) { console.log('DB_NOT_CONFIGURED'); process.exit(1); }
const client = new Client({ connectionString: raw.trim().replace(/^["']|["']$/g, ''), ssl: false, connectionTimeoutMillis: 5000 });
(async () => {
  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout = '10000ms'");
    const tables = await client.query("SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    const columns = await client.query("SELECT table_name, column_name, data_type, is_nullable, column_default IS NOT NULL AS has_default FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position");
    const constraints = await client.query("SELECT table_name, constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_schema = 'public' ORDER BY table_name, constraint_name");
    await client.query('ROLLBACK');
    const destination = path.join(process.cwd(), 'docs/audits/2026-11-18/database-schema-observed.json');
    fs.writeFileSync(destination, JSON.stringify({ inspectedAt: new Date().toISOString(), readOnly: true, tables: tables.rows, columns: columns.rows, constraints: constraints.rows }, null, 2) + '\n');
    console.log(JSON.stringify({ success: true, tables: tables.rowCount, columns: columns.rowCount }));
  } catch (error) {
    console.log(JSON.stringify({ success: false, code: error.code || error.name, schemaObserved: false }));
    process.exitCode = 1;
  } finally { await client.end(); }
})();
