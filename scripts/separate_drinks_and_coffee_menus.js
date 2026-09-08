/**
 * scripts/separate_drinks_and_coffee_menus.js
 * 
 * Separa o menu "Bebidas & Cafés" em dois menus distintos:
 * 1. "Bebidas" (Sumos de Polpa, Águas & Refrigerantes)
 * 2. "Cafés" (Cafés & Quentes)
 * 
 * Atualiza menus, categorias e incrementa store_catalog_versions.
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

const CANONICAL_TENANTS = [
  '11111111-1111-1111-1111-111111111111', // Figueira da Foz (Matriz)
  '22222222-2222-2222-2222-222222222222', // Torres Novas (Filial 1)
  '33333333-3333-3333-3333-333333333333', // Aveiro (Franquia)
];

const BEBIDAS_MENU_ID = '4c8ff060-3048-47c3-a5ec-efb60a56d0c4';
const CAFES_MENU_ID = '6c8ff060-3048-47c3-a5ec-efb60a56d0c6';
const CHOCOLATES_MENU_ID = '5c8ff060-3048-47c3-a5ec-efb60a56d0c5';

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Atualizando Menu Bebidas (ID: %s)...', BEBIDAS_MENU_ID);
    await client.query(`
      UPDATE menus
      SET 
        name = 'Bebidas',
        name_en = 'Beverages',
        name_es = 'Bebidas',
        code = 'MENU_BEBIDAS',
        description = 'Sumos de polpa natural, refrigerantes e águas',
        description_en = 'Natural fruit pulp juices, soft drinks and water',
        description_es = 'Zumos de pulpa natural, refrescos y aguas',
        display_order = 4,
        active = true
      WHERE id = $1
    `, [BEBIDAS_MENU_ID]);

    console.log('2. Cadastrando / Garantindo Menu Cafés (ID: %s)...', CAFES_MENU_ID);
    await client.query(`
      INSERT INTO menus (id, code, name, name_en, name_es, description, description_en, description_es, display_order, active)
      VALUES (
        $1,
        'MENU_CAFES',
        'Cafés',
        'Coffees',
        'Cafés',
        'Cafés especiais, expressos, galão e quentes',
        'Specialty coffees, espresso, galão and hot drinks',
        'Cafés especiales, espressos y bebidas calientes',
        5,
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        name_en = EXCLUDED.name_en,
        name_es = EXCLUDED.name_es,
        code = EXCLUDED.code,
        description = EXCLUDED.description,
        description_en = EXCLUDED.description_en,
        description_es = EXCLUDED.description_es,
        display_order = EXCLUDED.display_order,
        active = EXCLUDED.active
    `, [CAFES_MENU_ID]);

    console.log('3. Atualizando Ordem do Menu Chocolates (ID: %s) para 6...', CHOCOLATES_MENU_ID);
    await client.query(`
      UPDATE menus
      SET display_order = 6
      WHERE id = $1
    `, [CHOCOLATES_MENU_ID]);

    console.log('4. Atualizando Categoria Cafés & Quentes para o novo Menu Cafés...');
    await client.query(`
      UPDATE categories
      SET menu_id = $1, display_order = 1
      WHERE id = 'cat-cafes'
    `, [CAFES_MENU_ID]);

    console.log('5. Ajustando Categorias do Menu Bebidas (Sumos de Polpa e Águas & Refrigerantes)...');
    await client.query(`
      UPDATE categories
      SET menu_id = $1, display_order = 1
      WHERE id = 'cat-sumos-polpa'
    `, [BEBIDAS_MENU_ID]);

    await client.query(`
      UPDATE categories
      SET menu_id = $1, display_order = 2
      WHERE id = 'cat-bebidas'
    `, [BEBIDAS_MENU_ID]);

    console.log('6. Atualizando versões de catálogo para todas as lojas canônicas...');
    for (const tenantId of CANONICAL_TENANTS) {
      await client.query(`
        INSERT INTO store_catalog_versions (tenant_id, version, updated_at)
        VALUES ($1, 1, NOW())
        ON CONFLICT (tenant_id)
        DO UPDATE SET version = store_catalog_versions.version + 1, updated_at = NOW()
      `, [tenantId]);
    }

    await client.query('COMMIT');
    console.log('✅ Migração de separação de menus concluída com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
