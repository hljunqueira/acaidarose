/**
 * scripts/migrate_printer_logo_qr.js
 * Adiciona as colunas print_logo e print_qr_code na tabela store_printer_settings
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
    console.log('1. Atualizando tabela store_printer_settings com print_logo e print_qr_code...');

    await client.query(`
      ALTER TABLE store_printer_settings ADD COLUMN IF NOT EXISTS print_logo BOOLEAN DEFAULT TRUE;
      ALTER TABLE store_printer_settings ADD COLUMN IF NOT EXISTS print_qr_code BOOLEAN DEFAULT TRUE;
    `);

    await client.query('COMMIT');
    console.log('✅ Migração de print_logo e print_qr_code concluída com sucesso!');
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
