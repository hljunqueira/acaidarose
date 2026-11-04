require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  require('dotenv').config({ path: '.env' });
}

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.DIRECT_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('--- Iniciando migração de colunas na tabela tenants ---');
    await client.query('BEGIN');

    // 1. Adicionar colunas se não existirem
    await client.query(`
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{
        "seg": {"open": "12:00", "close": "22:00", "closed": false},
        "ter": {"open": "12:00", "close": "22:00", "closed": false},
        "qua": {"open": "12:00", "close": "22:00", "closed": false},
        "qui": {"open": "12:00", "close": "22:00", "closed": false},
        "sex": {"open": "12:00", "close": "23:00", "closed": false},
        "sab": {"open": "12:00", "close": "23:00", "closed": false},
        "dom": {"open": "13:00", "close": "22:00", "closed": false}
      }'::jsonb;
    `);

    await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);`);
    await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS wifi_network VARCHAR(100);`);
    await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS wifi_password VARCHAR(100);`);
    await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS about_text TEXT;`);
    await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS instagram_url TEXT;`);
    await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_maps_url TEXT;`);

    // 2. Garantir que tenants existentes com opening_hours nulo recebam o objeto padrão
    await client.query(`
      UPDATE tenants
      SET opening_hours = '{
        "seg": {"open": "12:00", "close": "22:00", "closed": false},
        "ter": {"open": "12:00", "close": "22:00", "closed": false},
        "qua": {"open": "12:00", "close": "22:00", "closed": false},
        "qui": {"open": "12:00", "close": "22:00", "closed": false},
        "sex": {"open": "12:00", "close": "23:00", "closed": false},
        "sab": {"open": "12:00", "close": "23:00", "closed": false},
        "dom": {"open": "13:00", "close": "22:00", "closed": false}
      }'::jsonb
      WHERE opening_hours IS NULL;
    `);

    await client.query('COMMIT');
    console.log('✅ Migração da tabela tenants realizada com sucesso!');

    // 3. Verificar estrutura
    const checkRes = await client.query(`
      SELECT id, name, slug, opening_hours IS NOT NULL as has_hours
      FROM tenants
      WHERE deleted_at IS NULL;
    `);
    console.table(checkRes.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração de tenants:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

