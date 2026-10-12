/**
 * scripts/migrate_copo_and_bases_rules.js
 * 
 * Migração Oficial para as Novas Regras do Cardápio:
 * 1. Renomeação de "Taça" para "Copo" nos recipientes de 250g, 350g e 500g:
 *    - "Taça 250gr" -> "Copo 250gr" (EN: "250gr Cup", ES: "Vaso 250gr")
 *    - "Taça 250gr (Somente Creme)" -> "Copo 250gr (Somente Creme)"
 *    - "Taça 350gr" -> "Copo 350gr" (EN: "350gr Cup", ES: "Vaso 350gr")
 *    - "Taça 350gr (Somente Creme)" -> "Copo 350gr (Somente Creme)"
 *    - "Taça 500gr" -> "Copo 500gr" (EN: "500gr Cup", ES: "Vaso 500gr")
 *    - "Taça 500gr (Somente Creme)" -> "Copo 500gr (Somente Creme)"
 *    (Preserva 750g Sensação e 1kg Família com "Taça ou Caixa" no catálogo)
 * 
 * 2. Atualização de limite_bases = 2 para TODOS os recipientes de Açaí (250g a 1000g).
 * 
 * 3. Sanitização e Deduplicação dos option_groups em product_containers:
 *    - Elimina a triplicação (33 bases -> 11 bases únicas da respectiva loja/tenant).
 *    - model-bases: minQty: 1, maxQty: 2 (cota inclusa), additionalPrice: 2.00.
 *    - model-frutas: maxQty: 999 para >= 500g (livre); 2 para 250g; 3 para 350g (+0,50€ extra).
 *    - model-toppings: maxQty: 999 para >= 500g (livre); 3 para 250g; 4 para 350g (+0,50€ extra).
 *    - model-caldas: opções individuais com preço por item.
 * 
 * 4. Incremento de versão em store_catalog_versions para as 3 lojas canônicas.
 */

const { Pool } = require('pg');
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
  console.log('🚀 Iniciando migração: Regras de Copos, Bases (2 inclusas, 3º +2€) e Frutas/Toppings livres >= 500g...');

  try {
    await client.query('BEGIN');

    // -------------------------------------------------------------
    // PASSO 1: Renomeação de Taça -> Copo (250g, 350g, 500g)
    // -------------------------------------------------------------
    console.log('\n📦 Passo 1: Renomeando Taça para Copo em 250g, 350g e 500g...');

    // 250g Tradicional
    const res250 = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Copo 250gr',
        name_en = '250gr Cup',
        name_es = 'Vaso 250gr'
      WHERE weight_grams = 250 
        AND category_id != 'cat-somente-creme'
    `);
    console.log(`✓ Copo 250gr Tradicional atualizado: ${res250.rowCount}`);

    // 250g Somente Creme
    const res250Creme = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Copo 250gr (Somente Creme)',
        name_en = '250gr Cup (Cream Only)',
        name_es = 'Vaso 250gr (Solo Crema)'
      WHERE weight_grams = 250 
        AND category_id = 'cat-somente-creme'
    `);
    console.log(`✓ Copo 250gr Somente Creme atualizado: ${res250Creme.rowCount}`);

    // 350g Tradicional
    const res350 = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Copo 350gr',
        name_en = '350gr Cup',
        name_es = 'Vaso 350gr'
      WHERE weight_grams = 350 
        AND category_id != 'cat-somente-creme'
    `);
    console.log(`✓ Copo 350gr Tradicional atualizado: ${res350.rowCount}`);

    // 350g Somente Creme
    const res350Creme = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Copo 350gr (Somente Creme)',
        name_en = '350gr Cup (Cream Only)',
        name_es = 'Vaso 350gr (Solo Crema)'
      WHERE weight_grams = 350 
        AND category_id = 'cat-somente-creme'
    `);
    console.log(`✓ Copo 350gr Somente Creme atualizado: ${res350Creme.rowCount}`);

    // 500g Tradicional
    const res500 = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Copo 500gr',
        name_en = '500gr Cup',
        name_es = 'Vaso 500gr'
      WHERE weight_grams = 500 
        AND category_id != 'cat-somente-creme'
    `);
    console.log(`✓ Copo 500gr Tradicional atualizado: ${res500.rowCount}`);

    // 500g Somente Creme
    const res500Creme = await client.query(`
      UPDATE product_containers
      SET 
        name = 'Copo 500gr (Somente Creme)',
        name_en = '500gr Cup (Cream Only)',
        name_es = 'Vaso 500gr (Solo Crema)'
      WHERE weight_grams = 500 
        AND category_id = 'cat-somente-creme'
    `);
    console.log(`✓ Copo 500gr Somente Creme atualizado: ${res500Creme.rowCount}`);

    // -------------------------------------------------------------
    // PASSO 2: Atualização de limite_bases = 2 em todos os tamanhos de Açaí
    // -------------------------------------------------------------
    console.log('\n🍨 Passo 2: Atualizando limite_bases = 2 em todos os recipientes de Açaí...');
    const resBasesLimit = await client.query(`
      UPDATE product_containers
      SET limite_bases = 2
      WHERE weight_grams IN (250, 350, 500, 750, 1000)
    `);
    console.log(`✓ Containers com limite_bases = 2 atualizados: ${resBasesLimit.rowCount}`);

    // -------------------------------------------------------------
    // PASSO 3: Sanitização e Reconstrução de option_groups por Tenant
    // -------------------------------------------------------------
    console.log('\n🧼 Passo 3: Sanitizando option_groups para eliminar triplicação e ajustar cotas...');

    // Busca todas as bases ativas agrupadas por tenant
    const basesDb = await client.query(`
      SELECT id, tenant_id, name, description, image_url, code, display_order, active
      FROM product_bases
      WHERE active = true AND deleted_at IS NULL
      ORDER BY display_order ASC, name ASC
    `);

    // Busca todos os acompanhamentos/toppings ativos agrupados por tenant
    const toppingsDb = await client.query(`
      SELECT id, tenant_id, name, category, is_premium, preco_extra, image_url, description, code, display_order, active
      FROM product_toppings
      WHERE active = true AND deleted_at IS NULL
      ORDER BY display_order ASC, name ASC
    `);

    // Busca todos os recipientes de Açaí (250g, 350g, 500g, 750g, 1000g)
    const containersDb = await client.query(`
      SELECT id, tenant_id, name, weight_grams, category_id
      FROM product_containers
      WHERE weight_grams IN (250, 350, 500, 750, 1000)
    `);

    for (const container of containersDb.rows) {
      const tenantId = container.tenant_id;
      const weight = Number(container.weight_grams) || 500;
      const isUnlimited = weight >= 500;

      // Filtra estritamente os itens do tenant do container
      const tenantBases = basesDb.rows.filter((b) => b.tenant_id === tenantId);
      const tenantToppings = toppingsDb.rows.filter((t) => t.tenant_id === tenantId);

      const tenantFrutas = tenantToppings.filter(
        (t) => t.category === 'Frutas' || ['banana', 'morango', 'kiwi', 'manga', 'uva', 'abacaxi'].some((f) => t.name.toLowerCase().includes(f))
      );
      const tenantToppingsTrad = tenantToppings.filter(
        (t) => t.category === 'Toppings' && !['banana', 'morango', 'kiwi', 'manga', 'uva', 'abacaxi'].some((f) => t.name.toLowerCase().includes(f))
      );
      const tenantCaldas = tenantToppings.filter(
        (t) => t.category === 'Adicionais' || t.is_premium || (t.preco_extra && Number(t.preco_extra) > 0)
      );

      // Cotas oficiais
      const basesMax = 2; // Até 2 inclusas em TODOS os tamanhos
      const frutasMax = isUnlimited ? 999 : (weight === 250 ? 2 : 3);
      const toppingsMax = isUnlimited ? 999 : (weight === 250 ? 3 : 4);

      const optionGroups = [
        // 1. Grupo de Bases / Cremes
        {
          id: 'model-bases',
          name: 'Escolha seu creme ou base gelada',
          priceType: 'Gratis',
          additionalPrice: 2.00,
          minQty: 1,
          maxQty: basesMax,
          isRequired: true,
          active: true,
          allowItemQuantity: true,
          options: tenantBases.map((b) => ({
            id: b.id,
            name: b.name,
            code: b.code || '',
            price: 0,
            description: b.description || '',
            active: true,
          })),
        },
        // 2. Grupo de Frutas
        {
          id: 'model-frutas',
          name: 'Frutas Frescas Selecionadas',
          priceType: 'Gratis',
          additionalPrice: 0.50,
          minQty: 0,
          maxQty: frutasMax,
          isRequired: false,
          active: true,
          allowItemQuantity: true,
          options: tenantFrutas.map((f) => ({
            id: f.id,
            name: f.name,
            code: f.code || '',
            price: 0,
            description: f.description || '',
            active: true,
          })),
        },
        // 3. Grupo de Toppings Tradicionais
        {
          id: 'model-toppings',
          name: 'Acompanhamentos Tradicionais',
          priceType: 'Gratis',
          additionalPrice: 0.50,
          minQty: 0,
          maxQty: toppingsMax,
          isRequired: false,
          active: true,
          allowItemQuantity: true,
          options: tenantToppingsTrad.map((t) => ({
            id: t.id,
            name: t.name,
            code: t.code || '',
            price: 0,
            description: t.description || '',
            active: true,
          })),
        },
        // 4. Grupo de Caldas Nobres & Especiais
        {
          id: 'model-caldas',
          name: 'Caldas Nobres & Especiais',
          priceType: 'Individual',
          additionalPrice: 1.00,
          minQty: 0,
          maxQty: 999,
          isRequired: false,
          active: true,
          allowItemQuantity: true,
          options: tenantCaldas.map((c) => ({
            id: c.id,
            name: c.name,
            code: c.code || '',
            price: Number(c.preco_extra) || 1.00,
            description: c.description || '',
            active: true,
          })),
        },
      ];

      await client.query(
        `UPDATE product_containers SET option_groups = $1::jsonb WHERE id = $2`,
        [JSON.stringify(optionGroups), container.id]
      );
    }
    console.log(`✓ option_groups sanitizados e atualizados para ${containersDb.rowCount} recipientes!`);

    // -------------------------------------------------------------
    // PASSO 4: Incremento de Versão em store_catalog_versions
    // -------------------------------------------------------------
    console.log('\n🔄 Passo 4: Atualizando versões do catálogo (store_catalog_versions)...');
    for (const tenantId of CANONICAL_TENANTS) {
      await client.query(`
        INSERT INTO store_catalog_versions (tenant_id, version, has_pending_changes, pending_changes_count, pending_changes_summary, published_at, updated_at)
        VALUES ($1, 1, false, 0, '[]'::jsonb, NOW(), NOW())
        ON CONFLICT (tenant_id) DO UPDATE
        SET 
          version = store_catalog_versions.version + 1,
          has_pending_changes = false,
          pending_changes_count = 0,
          pending_changes_summary = '[]'::jsonb,
          published_at = NOW(),
          updated_at = NOW()
      `, [tenantId]);
    }
    console.log('✓ store_catalog_versions incrementado com sucesso para as 3 lojas!');

    await client.query('COMMIT');
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM 100% DE SUCESSO!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
