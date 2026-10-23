/**
 * scripts/migrate_printer_layout.js
 * Adiciona as colunas print_layout e highlight_customer na tabela store_printer_settings
 */

require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  require('dotenv').config({ path: '.env' });
}

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('1. Atualizando tabela store_printer_settings...');

    await client.query(`
      ALTER TABLE store_printer_settings ADD COLUMN IF NOT EXISTS print_layout VARCHAR(50) DEFAULT 'FULL_RECEIPT';
      ALTER TABLE store_printer_settings ADD COLUMN IF NOT EXISTS highlight_customer BOOLEAN DEFAULT TRUE;
    `);

    await client.query('COMMIT');
    console.log('✅ Migração de print_layout e highlight_customer concluída com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
