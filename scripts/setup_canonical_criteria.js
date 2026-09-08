require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log('Iniciando configuração dos critérios canônicos de avaliação...');

  const canonicalCriteria = [
    { code: 'COMIDA', title: 'Comida', display_order: 1 },
    { code: 'BEBIDA', title: 'Bebida', display_order: 2 },
    { code: 'AMBIENTE', title: 'Ambiente', display_order: 3 },
    { code: 'ATENDIMENTO', title: 'Atendimento', display_order: 4 },
    { code: 'MUSICA', title: 'Música', display_order: 5 },
  ];

  // 1. Limpar critérios legados arbitrários que não fazem parte do padrão
  await pool.query(`
    DELETE FROM customer_rating_criteria 
    WHERE tenant_id IS NULL 
      AND code NOT IN ('COMIDA', 'BEBIDA', 'AMBIENTE', 'ATENDIMENTO', 'MUSICA')
  `);

  // 2. Inserir ou atualizar os 5 critérios canônicos da rede
  for (const crit of canonicalCriteria) {
    const existing = await pool.query(
      `SELECT id FROM customer_rating_criteria WHERE tenant_id IS NULL AND code = $1`,
      [crit.code]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO customer_rating_criteria (tenant_id, code, title, display_order, active)
         VALUES (NULL, $1, $2, $3, true)`,
        [crit.code, crit.title, crit.display_order]
      );
      console.log(`[+] Critério inserido: ${crit.title} (${crit.code})`);
    } else {
      await pool.query(
        `UPDATE customer_rating_criteria 
         SET title = $1, display_order = $2, active = true 
         WHERE tenant_id IS NULL AND code = $3`,
        [crit.title, crit.display_order, crit.code]
      );
      console.log(`[✓] Critério atualizado: ${crit.title} (${crit.code})`);
    }
  }

  // 3. Conferir o estado final
  const res = await pool.query(
    `SELECT code, title, display_order, active FROM customer_rating_criteria WHERE tenant_id IS NULL ORDER BY display_order ASC`
  );
  console.log('\nCritérios canônicos ativos no banco:');
  console.table(res.rows);

  await pool.end();
  console.log('Finalizado com sucesso!');
}

main().catch((err) => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
