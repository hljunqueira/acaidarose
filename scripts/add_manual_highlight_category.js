const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    console.error('DATABASE_URL não configurada.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  console.log('--- Adicionando suporte a highlight_category em manual_articles ---');

  try {
    await pool.query(`
      ALTER TABLE manual_articles
      ADD COLUMN IF NOT EXISTS highlight_category VARCHAR(100) NULL;
    `);
    console.log('✓ Coluna highlight_category adicionada com sucesso.');
  } catch (err) {
    console.error('Erro na migração:', err);
  } finally {
    await pool.end();
  }
}

run();
