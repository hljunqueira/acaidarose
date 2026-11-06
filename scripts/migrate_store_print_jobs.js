/**
 * scripts/migrate_store_print_jobs.js
 * 
 * Cria a tabela store_print_jobs para a fila de impressão em nuvem (Padrão Goomer).
 * Suporte a polling autônomo do agente Windows via Token da Loja.
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

    console.log('1. Criando tabela store_print_jobs se não existir...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_print_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        order_id VARCHAR(100),
        order_number VARCHAR(50),
        printer_name VARCHAR(255) NOT NULL,
        doc_name VARCHAR(255) DEFAULT 'Açaí da Rose - Cupom',
        payload_base64 TEXT,
        payload_text TEXT,
        copies INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'PENDING',
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        printed_at TIMESTAMP WITH TIME ZONE
      );

      CREATE INDEX IF NOT EXISTS idx_store_print_jobs_tenant_status 
        ON store_print_jobs(tenant_id, status);
    `);

    await client.query('COMMIT');
    console.log('✅ Migração de store_print_jobs executada com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração de store_print_jobs:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

