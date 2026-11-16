const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  require('dotenv').config({ path: '.env.production.local' });
}

const client = new Client({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('🔄 Atualizando nomenclatura do modelo de Cremes Gelados & Bases...');

  const modelRes = await client.query(`
    UPDATE product_option_models
    SET name = 'Cremes Gelados & Bases',
        name_en = 'Ice Creams & Bases',
        name_es = 'Cremas Heladas y Bases',
        subtitle = 'Açaí incluso + 1 creme grátis',
        subtitle_en = 'Açaí included + 1 free cream',
        subtitle_es = 'Açaí incluido + 1 crema gratis',
        updated_at = timezone('utc'::text, now())
    WHERE id = 'ddcec6eb-6a9d-4266-93b2-954dfba2e75a'
    RETURNING id, name, subtitle
  `);
  console.log('✓ Modelo atualizado:', modelRes.rows[0]);

  // Atualiza em product_containers
  const containersRes = await client.query(`
    SELECT id, name, option_groups FROM product_containers 
    WHERE option_groups IS NOT NULL AND jsonb_array_length(option_groups) > 0
  `);

  let updatedContainers = 0;
  for (const c of containersRes.rows) {
    const groups = Array.isArray(c.option_groups) ? c.option_groups : [];
    let changed = false;
    const newGroups = groups.map((g) => {
      if (
        g.id === 'ddcec6eb-6a9d-4266-93b2-954dfba2e75a' ||
        g.id === 'model-bases' ||
        (g.name && (g.name.toLowerCase().includes('creme') || g.name.toLowerCase().includes('base')))
      ) {
        changed = true;
        return {
          ...g,
          name: 'Cremes Gelados & Bases',
          nameEn: 'Ice Creams & Bases',
          nameEs: 'Cremas Heladas y Bases',
          subtitle: 'Açaí incluso + 1 creme grátis',
          subtitleEn: 'Açaí included + 1 free cream',
          subtitleEs: 'Açaí incluido + 1 crema gratis',
        };
      }
      return g;
    });

    if (changed) {
      await client.query(
        `UPDATE product_containers SET option_groups = $1::jsonb, updated_at = timezone('utc'::text, now()) WHERE id = $2`,
        [JSON.stringify(newGroups), c.id]
      );
      updatedContainers++;
    }
  }

  console.log(`✓ ${updatedContainers} recipientes/produtos sincronizados.`);

  await client.query(`
    UPDATE store_catalog_versions
    SET version = version + 1, updated_at = timezone('utc'::text, now())
  `);
  console.log('✓ store_catalog_versions incrementado.');

  await client.end();
}

run().catch((err) => {
  console.error('❌ Erro na migração:', err);
  process.exit(1);
});
