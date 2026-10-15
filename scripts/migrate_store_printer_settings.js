/**
 * scripts/migrate_store_printer_settings.js
 * 
 * Cria a tabela store_printer_settings para suporte multi-impressoras 1-para-N por loja.
 * Sem registros mockados / sem seeds estáticas.
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

    console.log('1. Criando tabela store_printer_settings se não existir...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_printer_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        driver_name VARCHAR(255) NOT NULL,
        printer_type VARCHAR(50) DEFAULT 'EPSON_ESC_POS',
        connection_type VARCHAR(50) DEFAULT 'QZ_TRAY',
        categories JSONB DEFAULT '[]'::jsonb,
        products JSONB DEFAULT '[]'::jsonb,
        copies INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        is_backup BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE store_printer_settings ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]'::jsonb;
      CREATE INDEX IF NOT EXISTS idx_store_printers_tenant ON store_printer_settings(tenant_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Migração de store_printer_settings executada com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração de store_printer_settings:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
