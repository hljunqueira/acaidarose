/**
 * scripts/migrate_rename_and_enable_quantities.js
 * 
 * 1. Renomeia os recipientes de 750g e 1kg no PostgreSQL:
 *    - "Pote de 750gr (com tampa)" -> "Taça ou Caixa 750gr"
 *    - "Pote de 1kg (com tampa)" -> "Taça ou Caixa 1kg"
 *    - "Pote de 750gr com tampa (Somente Creme)" -> "Taça ou Caixa 750gr (Somente Creme)"
 *    - "Pote de 1kg com tampa (Somente Creme)" -> "Taça ou Caixa 1kg (Somente Creme)"
 *    (Atualiza também name_en e name_es correspondentes)
 * 
 * 2. Atualiza os option_groups EXCLUSIVAMENTE nos recipientes de Açaí:
 *    - Ativa allowItemQuantity: true em model-frutas, model-toppings e model-caldas.
 * 
 * 3. Incrementa a versão em store_catalog_versions para as lojas canônicas.
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  console.log('🚀 Iniciando migração de renomeação de 750g/1kg e ativação de allowItemQuantity no Açaí...');

  try {
    await client.query('BEGIN');

    // 1. Renomeação dos produtos de 750g e 1kg
    console.log('📦 Passo 1: Renomeando produtos de 750g e 1kg no catálogo...');
    
    // 750g tradicional
    const res750 = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Taça ou Caixa 750gr',
        name_en = '750gr Bowl or Box',
        name_es = 'Bol o Caja 750gr'
      WHERE weight_grams = 750 
        AND (name ILIKE '%Pote de 750%' OR name ILIKE '%750%')
        AND category_id != 'cat-somente-creme'
    `);
    console.log(`✓ 750g Tradicional atualizados: ${res750.rowCount}`);

    // 750g somente creme
    const res750Creme = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Taça ou Caixa 750gr (Somente Creme)',
        name_en = '750gr Bowl or Box (Cream Only)',
        name_es = 'Bol o Caja 750gr (Solo Crema)'
      WHERE weight_grams = 750 
        AND category_id = 'cat-somente-creme'
    `);
    console.log(`✓ 750g Somente Creme atualizados: ${res750Creme.rowCount}`);

    // 1kg tradicional
    const res1kg = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Taça ou Caixa 1kg',
        name_en = '1kg Bowl or Box',
        name_es = 'Bol o Caja 1kg'
      WHERE weight_grams = 1000 
        AND (name ILIKE '%Pote de 1kg%' OR name ILIKE '%1kg%')
        AND category_id != 'cat-somente-creme'
    `);
    console.log(`✓ 1kg Tradicional atualizados: ${res1kg.rowCount}`);

    // 1kg somente creme
    const res1kgCreme = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Taça ou Caixa 1kg (Somente Creme)',
        name_en = '1kg Bowl or Box (Cream Only)',
        name_es = 'Bol o Caja 1kg (Solo Crema)'
      WHERE weight_grams = 1000 
        AND category_id = 'cat-somente-creme'
    `);
    console.log(`✓ 1kg Somente Creme atualizados: ${res1kgCreme.rowCount}`);

    // 2. Atualizar option_groups nos recipientes de Açaí
    console.log('🍓 Passo 2: Habilitando allowItemQuantity nos grupos de Açaí...');
    const acaiContainers = await client.query(`
      SELECT id, name, weight_grams, option_groups 
      FROM product_containers 
      WHERE weight_grams IS NOT NULL AND option_groups IS NOT NULL
    `);

    let updatedGroupsCount = 0;
    for (const row of acaiContainers.rows) {
      if (!Array.isArray(row.option_groups)) continue;

      let modified = false;
      const newGroups = row.option_groups.map((group) => {
        const idLower = (group.id || '').toLowerCase();
        const nameLower = (group.name || '').toLowerCase();

        // Habilitar allowItemQuantity para frutas, acompanhamentos e caldas
        const isToppingOrFruit =
          idLower.includes('fruta') ||
          idLower.includes('topping') ||
          idLower.includes('calda') ||
          idLower.includes('adicional') ||
          nameLower.includes('fruta') ||
          nameLower.includes('acompanhamento') ||
          nameLower.includes('calda');

        if (isToppingOrFruit && group.allowItemQuantity !== true) {
          modified = true;
          return {
            ...group,
            allowItemQuantity: true,
          };
        }
        return group;
      });

      if (modified) {
        await client.query(
          `UPDATE product_containers SET option_groups = $1::jsonb WHERE id = $2`,
          [JSON.stringify(newGroups), row.id]
        );
        updatedGroupsCount++;
      }
    }
    console.log(`✓ Recipientes de Açaí atualizados com allowItemQuantity: ${updatedGroupsCount}`);

    // 3. Atualizar versões do catálogo para broadcast imediato
    console.log('🔄 Passo 3: Incrementando versão do catálogo em store_catalog_versions...');
    await client.query(`
      INSERT INTO store_catalog_versions (tenant_id, version, published_at, pending_changes_count)
      SELECT id, 1, NOW(), 0 FROM tenants
      ON CONFLICT (tenant_id) DO UPDATE 
      SET version = store_catalog_versions.version + 1,
          published_at = NOW(),
          has_pending_changes = FALSE,
          pending_changes_count = 0,
          pending_changes_summary = '[]'::jsonb;
    `);

    await client.query('COMMIT');
    console.log('🎉 Migração concluída com sucesso absoluto!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
