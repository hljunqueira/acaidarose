/**
 * scripts/migrate_rename_sensacao_familia.js
 * 
 * 1. Renomeia os recipientes de 750g e 1kg em product_containers no PostgreSQL:
 *    - 750g tradicional: "Taça ou Caixa Açaí Sensação 750gr"
 *    - 750g somente creme: "Taça ou Caixa Sensação 750gr (Somente Creme)"
 *    - 1kg tradicional: "Taça ou Caixa Açaí Família 1kg"
 *    - 1kg somente creme: "Taça ou Caixa Família 1kg (Somente Creme)"
 *    (com suporte a name_en e name_es)
 * 
 * 2. Atualiza a tabela store_stories (Destaques do Cardápio):
 *    - Atualiza o item de 750g para "Açaí Sensação 750g" (badge: SENSAÇÃO)
 *    - Garante/insere o item de 1kg "Açaí Família 1kg" (badge: FAMÍLIA)
 *    - Replica para as 3 lojas canônicas (Figueira da Foz, Torres Novas e Aveiro).
 * 
 * 3. Incrementa a versão em store_catalog_versions para as 3 lojas.
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  require('dotenv').config({ path: '.env' });
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

const CANONICAL_TENANTS = [
  '11111111-1111-1111-1111-111111111111', // Loja 1 - Figueira da Foz (Matriz)
  '22222222-2222-2222-2222-222222222222', // Loja 2 - Torres Novas (Filial 1)
  '33333333-3333-3333-3333-333333333333', // Loja 3 - Aveiro (Franquia)
];

async function migrate() {
  const client = await pool.connect();
  console.log('🚀 Iniciando migração: Açaí Sensação (750g) e Açaí Família (1kg)...');

  try {
    await client.query('BEGIN');

    // -------------------------------------------------------------
    // PASSO 1: Atualização em product_containers
    // -------------------------------------------------------------
    console.log('\n📦 Passo 1: Atualizando recipientes em product_containers...');

    // 1.1 750g Tradicional -> Taça ou Caixa Açaí Sensação 750gr
    const res750 = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Taça ou Caixa Açaí Sensação 750gr',
        name_en = '750gr Sensation Açaí (Bowl or Box)',
        name_es = 'Açaí Sensación 750gr (Bol o Caja)'
      WHERE weight_grams = 750 
        AND category_id != 'cat-somente-creme'
    `);
    console.log(`✓ 750g Tradicional atualizados: ${res750.rowCount}`);

    // 1.2 750g Somente Creme -> Taça ou Caixa Sensação 750gr (Somente Creme)
    const res750Creme = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Taça ou Caixa Sensação 750gr (Somente Creme)',
        name_en = '750gr Sensation (Cream Only - Bowl or Box)',
        name_es = 'Sensación 750gr (Solo Crema - Bol o Caja)'
      WHERE weight_grams = 750 
        AND category_id = 'cat-somente-creme'
    `);
    console.log(`✓ 750g Somente Creme atualizados: ${res750Creme.rowCount}`);

    // 1.3 1kg Tradicional -> Taça ou Caixa Açaí Família 1kg
    const res1kg = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Taça ou Caixa Açaí Família 1kg',
        name_en = '1kg Family Açaí (Bowl or Box)',
        name_es = 'Açaí Familia 1kg (Bol o Caja)'
      WHERE weight_grams = 1000 
        AND category_id != 'cat-somente-creme'
    `);
    console.log(`✓ 1kg Tradicional atualizados: ${res1kg.rowCount}`);

    // 1.4 1kg Somente Creme -> Taça ou Caixa Família 1kg (Somente Creme)
    const res1kgCreme = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Taça ou Caixa Família 1kg (Somente Creme)',
        name_en = '1kg Family (Cream Only - Bowl or Box)',
        name_es = 'Familia 1kg (Solo Crema - Bol o Caja)'
      WHERE weight_grams = 1000 
        AND category_id = 'cat-somente-creme'
    `);
    console.log(`✓ 1kg Somente Creme atualizados: ${res1kgCreme.rowCount}`);

    // -------------------------------------------------------------
    // PASSO 2: Atualização e Sincronização em store_stories (Destaques)
    // -------------------------------------------------------------
    console.log('\n🌟 Passo 2: Atualizando e padronizando Destaques do Cardápio (store_stories)...');

    // 2.1 Atualizar qualquer destaque existente de 750g
    const update750Highlights = await client.query(`
      UPDATE store_stories
      SET 
        title = 'Açaí Sensação 750g',
        title_en = '750g Sensation Açaí',
        title_es = 'Açaí Sensación 750g',
        subtitle = 'Camadas generosas de Frutas & Acompanhamentos',
        subtitle_en = 'Generous layers of Fresh Fruit & Toppings',
        subtitle_es = 'Capas generosas de Frutas y Acompañamientos',
        badge_text = 'SENSAÇÃO',
        badge_text_en = 'SENSATION',
        badge_text_es = 'SENSACIÓN',
        badge_color = 'bg-pink-600',
        price = 18.90,
        thumbnail_url = '/images/official/acai_tigela_750g.jpg',
        video_url = '/videos/hero_gliding_texture.mp4',
        updated_at = NOW()
      WHERE title ILIKE '%750%' OR subtitle ILIKE '%750%'
    `);
    console.log(`✓ Destaques de 750g atualizados para Açaí Sensação: ${update750Highlights.rowCount}`);

    // 2.2 Sincronizar destaques canônicos para cada uma das 3 lojas
    for (const tenantId of CANONICAL_TENANTS) {
      // Verifica se o destaque de 1kg já existe nesta loja
      const check1kg = await client.query(`
        SELECT id FROM store_stories 
        WHERE tenant_id = $1 AND (title ILIKE '%1kg%' OR title ILIKE '%1 kg%' OR title ILIKE '%família%')
          AND deleted_at IS NULL
      `, [tenantId]);

      if (check1kg.rows.length === 0) {
        // Insere o destaque de 1kg Família
        await client.query(`
          INSERT INTO store_stories (
            id, tenant_id, title, title_en, title_es, subtitle, subtitle_en, subtitle_es,
            badge_text, badge_text_en, badge_text_es, badge_color, price,
            thumbnail_url, video_url, display_order, active, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
          )
        `, [
          uuidv4(),
          tenantId,
          'Açaí Família 1kg',
          '1kg Family Açaí',
          'Açaí Familia 1kg',
          'O tamanho perfeito para partilhar com toda a família',
          'The perfect size to share with the whole family',
          'El tamaño perfecto para compartir con toda la familia',
          'FAMÍLIA',
          'FAMILY',
          'FAMILIA',
          'bg-purple-600',
          25.90,
          '/images/official/acai_tigela_750g.jpg',
          '/videos/hero_gliding_texture.mp4',
          5,
          true
        ]);
        console.log(`✓ Destaque Açaí Família 1kg inserido na loja ${tenantId.substring(0, 8)}`);
      } else {
        // Atualiza o destaque de 1kg existente
        await client.query(`
          UPDATE store_stories
          SET 
            title = 'Açaí Família 1kg',
            title_en = '1kg Family Açaí',
            title_es = 'Açaí Familia 1kg',
            subtitle = 'O tamanho perfeito para partilhar com toda a família',
            subtitle_en = 'The perfect size to share with the whole family',
            subtitle_es = 'El tamaño perfecto para compartir con toda la familia',
            badge_text = 'FAMÍLIA',
            badge_text_en = 'FAMILY',
            badge_text_es = 'FAMILIA',
            badge_color = 'bg-purple-600',
            price = 25.90,
            updated_at = NOW()
          WHERE id = $1
        `, [check1kg.rows[0].id]);
        console.log(`✓ Destaque Açaí Família 1kg atualizado na loja ${tenantId.substring(0, 8)}`);
      }

      // Se Aveiro não tinha os destaques das outras taças, vamos replicá-los
      const countTenantHighlights = await client.query(`
        SELECT COUNT(*) FROM store_stories WHERE tenant_id = $1 AND deleted_at IS NULL
      `, [tenantId]);

      if (parseInt(countTenantHighlights.rows[0].count, 10) < 3) {
        console.log(`ℹ Replicando catálogo base de destaques para a loja ${tenantId.substring(0, 8)}...`);
        // Copia os 3 primeiros destaques da Matriz (500g, 350g, Pitaya)
        const baseHighlights = await client.query(`
          SELECT title, title_en, title_es, subtitle, subtitle_en, subtitle_es,
                 badge_text, badge_text_en, badge_text_es, badge_color, price,
                 thumbnail_url, video_url, display_order, active
          FROM store_stories
          WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
            AND title NOT ILIKE '%1kg%'
            AND deleted_at IS NULL
          ORDER BY display_order ASC
        `);

        for (const h of baseHighlights.rows) {
          const exists = await client.query(`
            SELECT id FROM store_stories 
            WHERE tenant_id = $1 AND title = $2 AND deleted_at IS NULL
          `, [tenantId, h.title]);

          if (exists.rows.length === 0) {
            await client.query(`
              INSERT INTO store_stories (
                id, tenant_id, title, title_en, title_es, subtitle, subtitle_en, subtitle_es,
                badge_text, badge_text_en, badge_text_es, badge_color, price,
                thumbnail_url, video_url, display_order, active, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
            `, [
              uuidv4(), tenantId, h.title, h.title_en, h.title_es, h.subtitle, h.subtitle_en, h.subtitle_es,
              h.badge_text, h.badge_text_en, h.badge_text_es, h.badge_color, h.price,
              h.thumbnail_url, h.video_url, h.display_order, h.active
            ]);
          }
        }
      }
    }

    // -------------------------------------------------------------
    // PASSO 3: Atualizar versão em store_catalog_versions
    // -------------------------------------------------------------
    console.log('\n🔄 Passo 3: Atualizando store_catalog_versions para as 3 lojas...');
    for (const tenantId of CANONICAL_TENANTS) {
      await client.query(`
        INSERT INTO store_catalog_versions (tenant_id, version, has_pending_changes, pending_changes_count, published_at, updated_at)
        VALUES ($1, 1, false, 0, NOW(), NOW())
        ON CONFLICT (tenant_id)
        DO UPDATE SET 
          version = store_catalog_versions.version + 1,
          has_pending_changes = false,
          pending_changes_count = 0,
          published_at = NOW(),
          updated_at = NOW()
      `, [tenantId]);
    }
    console.log('✓ store_catalog_versions atualizado em todas as lojas.');

    await client.query('COMMIT');
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO TOTAL!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante a migração, efetuado ROLLBACK:', err);
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
