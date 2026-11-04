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
    console.log('--- Iniciando atualização dos Milk Shakes no PostgreSQL ---');
    await client.query('BEGIN');

    const updateRes = await client.query(`
      UPDATE product_containers
      SET
        product_type = 'ITEM',
        limite_bases = 0,
        limite_complementos_gratis = 0,
        image_url = '/images/official/milkshake_acai.png',
        video_poster = '/images/official/milkshake_acai.png',
        updated_at = NOW()
      WHERE 
        category_id = 'cat-milkshakes'
        OR name ILIKE '%shake%'
        OR name ILIKE '%batido%'
      RETURNING id, name, category_id, product_type, limite_bases, image_url;
    `);

    console.log(`✅ ${updateRes.rowCount} produtos de Milk Shake atualizados com sucesso!`);
    console.table(updateRes.rows);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao atualizar Milk Shakes:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

