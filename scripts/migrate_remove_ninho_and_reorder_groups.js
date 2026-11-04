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
    await client.query('BEGIN');
    console.log('--- 1. DESATIVANDO "Creme de Ninho" EM product_toppings E product_bases ---');

    const topRes = await client.query(`
      UPDATE product_toppings
      SET active = false, deleted_at = NOW()
      WHERE name ILIKE '%creme%ninho%'
      RETURNING id, name, tenant_id;
    `);
    console.log(`Toppings desativados: ${topRes.rowCount}`);
    console.table(topRes.rows);

    const baseRes = await client.query(`
      UPDATE product_bases
      SET active = false, deleted_at = NOW()
      WHERE name ILIKE '%creme%ninho%'
      RETURNING id, name, tenant_id;
    `);
    console.log(`Bases desativadas: ${baseRes.rowCount}`);
    console.table(baseRes.rows);

    console.log('\n--- 2. LIMPANDO "Creme de Ninho" DE option_groups E REORDENANDO GRUPOS ---');
    const containersRes = await client.query(`
      SELECT id, name, option_groups, weight_grams
      FROM product_containers
      WHERE deleted_at IS NULL AND option_groups IS NOT NULL AND jsonb_array_length(option_groups) > 0;
    `);

    let updatedCount = 0;
    for (const row of containersRes.rows) {
      const groups = row.option_groups;
      if (!Array.isArray(groups)) continue;

      // 1. Filtrar "Creme de Ninho" de cada grupo
      const cleanedGroups = groups.map((group) => {
        const cleanedOptions = (group.options || []).filter((opt) => {
          const optName = (opt.name || '').toLowerCase();
          return !optName.includes('creme de ninho') && !optName.includes('creme ninho');
        });
        return {
          ...group,
          options: cleanedOptions,
        };
      });

      // 2. Reordenar os grupos de opções na ordem canônica de preparo:
      // 1: Bases/Cremes, 2: Frutas, 3: Toppings/Acompanhamentos, 4: Caldas
      const getGroupPriority = (g) => {
        const id = (g.id || '').toLowerCase();
        const name = (g.name || '').toLowerCase();
        if (id === 'model-bases' || name.includes('base') || name.includes('creme gelado') || name.includes('creme')) return 1;
        if (id === 'model-frutas' || name.includes('fruta')) return 2;
        if (id === 'model-toppings' || name.includes('topping') || name.includes('crocante') || name.includes('acompanhamento')) return 3;
        if (id === 'model-caldas' || name.includes('calda') || name.includes('nobre') || name.includes('premium')) return 4;
        return 5;
      };

      cleanedGroups.sort((a, b) => getGroupPriority(a) - getGroupPriority(b));

      await client.query(`
        UPDATE product_containers
        SET option_groups = $2::jsonb, updated_at = NOW()
        WHERE id = $1;
      `, [row.id, JSON.stringify(cleanedGroups)]);
      updatedCount++;
    }

    console.log(`Recipientes com option_groups higienizados e ordenados: ${updatedCount}`);

    console.log('\n--- 3. RESTAURANDO REGRAS CANÔNICAS DO COPO 250GR ---');
    await client.query(`
      UPDATE product_containers
      SET 
        preco_base = 6.50,
        weight_grams = 250,
        limite_bases = 2,
        limite_complementos_gratis = 3,
        updated_at = NOW()
      WHERE name = 'Copo 250gr';
    `);
    console.log('Copo 250gr restaurado com sucesso!');

    await client.query('COMMIT');
    console.log('✅ Migração e higienização concluídas com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
