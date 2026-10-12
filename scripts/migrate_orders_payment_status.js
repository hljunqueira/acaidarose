/**
 * scripts/migrate_orders_payment_status.js
 * 
 * Adiciona colunas reais em orders para controle estrito e sem suposições:
 * - payment_status VARCHAR(50) DEFAULT 'PENDING'
 * - is_qr_code BOOLEAN DEFAULT FALSE
 * - channel VARCHAR(50) DEFAULT 'POS'
 * 
 * Corrige o pedido #001 (Rosane) para Autoatendimento QR Code e status PENDING.
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

    console.log('1. Criando colunas payment_status, is_qr_code e channel se não existirem...');
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS is_qr_code BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'POS';
    `);

    console.log('2. Atualizando pedidos anteriores que já foram completados/pagos...');
    await client.query(`
      UPDATE orders 
      SET payment_status = 'PAID' 
      WHERE status IN ('PAID', 'COMPLETED') AND (payment_status IS NULL OR payment_status = 'PENDING');
    `);

    console.log('3. Corrigindo o pedido #001 (Rosane) para Autoatendimento QR Code com pagamento pendente no balcão...');
    await client.query(`
      UPDATE orders 
      SET cashier_name = 'Autoatendimento QR Code',
          cashier_id = NULL,
          is_qr_code = TRUE,
          channel = 'QR_CODE',
          payment_status = 'PENDING'
      WHERE id = '0fccce5d-b983-431d-bf58-67592aa7d71b';
    `);

    await client.query('COMMIT');
    console.log('✅ Migração de orders concluída com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração de orders:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
