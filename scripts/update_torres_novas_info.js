require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  require('dotenv').config({ path: '.env' });
}

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('--- Atualizando dados cadastrais e fiscais de Torres Novas ---');
    const res = await client.query(`
      UPDATE tenants
      SET nif = '517968223',
          address = 'Av Manoel de Figueiredo 12 RC Direito',
          phone = '+351 911 050 264',
          mbway_phone = '+351 911 050 264',
          updated_at = NOW()
      WHERE id = '22222222-2222-2222-2222-222222222222' OR slug = 'torres-novas'
      RETURNING id, name, slug, nif, address, phone, mbway_phone;
    `);

    console.log('Resultado do UPDATE:');
    console.table(res.rows);
  } catch (err) {
    console.error('Erro ao atualizar tenants:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
