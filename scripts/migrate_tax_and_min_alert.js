require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  require('dotenv').config({ path: '.env' });
}

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('--- Migrando colunas de IVA e Limite Mínimo ---');

    // 1. Adicionar purchase_tax_rate e min_alert_quantity em inventory_items se não existir
    await client.query(`
      ALTER TABLE inventory_items 
      ADD COLUMN IF NOT EXISTS purchase_tax_rate NUMERIC DEFAULT 23.00,
      ADD COLUMN IF NOT EXISTS min_alert_quantity NUMERIC DEFAULT 2.00;
    `);
    console.log('Colunas purchase_tax_rate e min_alert_quantity adicionadas a inventory_items.');

    // Se has_purchase_tax = false, sincroniza purchase_tax_rate = 0
    await client.query(`
      UPDATE inventory_items 
      SET purchase_tax_rate = 0 
      WHERE has_purchase_tax = false AND (purchase_tax_rate IS NULL OR purchase_tax_rate = 23);
    `);
    console.log('purchase_tax_rate sincronizado para itens isentos na compra.');

    // 2. Verificar colunas de store_inventory
    await client.query(`
      ALTER TABLE store_inventory 
      ADD COLUMN IF NOT EXISTS min_alert_quantity NUMERIC DEFAULT 2.00;
    `);
    console.log('store_inventory verificado com min_alert_quantity.');

    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items'
    `);
    console.log('inventory_items columns:', res.rows.map(r => r.column_name).join(', '));
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => {
    console.log('--- Migração concluída com sucesso! ---');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Erro na migração:', err);
    process.exit(1);
  });
