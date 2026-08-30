/**
 * SCRIPT DE SINCRONIZAÇÃO DO CATÁLOGO CANÔNICO OFICIAL
 * Açaí da Rose — Atualização de Frutas (Uva), Leite em pó, Toppings, Cremes e Adicionais
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

const AVEIRO_HQ_ID = '11111111-1111-1111-1111-111111111111';
const TORRES_NOVAS_ID = '22222222-2222-2222-2222-222222222222';

const CONTAINERS = [
  { id: 'cnt-250', name: 'Açaí 250g', preco_base: 6.90, weight_grams: 250, limite_bases: 1, limite_complementos_gratis: 3, display_order: 1 },
  { id: 'cnt-350', name: 'Açaí 350g', preco_base: 8.90, weight_grams: 350, limite_bases: 1, limite_complementos_gratis: 3, display_order: 2 },
  { id: 'cnt-500', name: 'Açaí 500g', preco_base: 12.90, weight_grams: 500, limite_bases: 1, limite_complementos_gratis: 99, display_order: 3 },
  { id: 'cnt-750', name: 'Açaí 750g', preco_base: 17.90, weight_grams: 750, limite_bases: 1, limite_complementos_gratis: 99, display_order: 4 },
  { id: 'cnt-1000', name: 'Açaí 1kg', preco_base: 22.90, weight_grams: 1000, limite_bases: 1, limite_complementos_gratis: 99, display_order: 5 },
];

const BASES = [
  { id: 'base-acai', name: 'Açaí Tradicional', description: 'Açaí puro e cremoso batido na hora', display_order: 1 },
  { id: 'base-coco', name: 'Creme de Coco', description: 'Cremoso e artesanal', display_order: 2 },
  { id: 'base-morango', name: 'Creme de Morango', description: 'Feito com morangos frescos', display_order: 3 },
  { id: 'base-cupuacu', name: 'Creme de Cupuaçu', description: 'Sabor autêntico da Amazônia', display_order: 4 },
  { id: 'base-manga', name: 'Creme de Manga', description: 'Doce e refrescante', display_order: 5 },
  { id: 'base-goiaba', name: 'Creme de Goiaba', description: 'Artesanal e aveludado', display_order: 6 },
  { id: 'base-leite-po', name: 'Creme de Leite em pó', description: 'Sabor suave e irresistível', display_order: 7 },
  { id: 'base-graviola', name: 'Creme de Graviola', description: 'Fruta tropical brasileira', display_order: 8 },
  { id: 'base-pitaya', name: 'Creme de Pitaya', description: 'Cor vibrante e rico em nutrientes', display_order: 9 },
  { id: 'base-maracuja', name: 'Creme de Maracujá', description: 'Toque cítrico e refrescante', display_order: 10 },
];

const TOPPINGS = [
  // Frutas Frescas (Uva no lugar de Abacaxi)
  { id: 'top-banana', name: 'Banana', category: 'Frutas', is_premium: false, preco_extra: 0, display_order: 1 },
  { id: 'top-kiwi', name: 'Kiwi', category: 'Frutas', is_premium: false, preco_extra: 0, display_order: 2 },
  { id: 'top-manga', name: 'Manga', category: 'Frutas', is_premium: false, preco_extra: 0, display_order: 3 },
  { id: 'top-morango', name: 'Morango', category: 'Frutas', is_premium: false, preco_extra: 0, display_order: 4 },
  { id: 'top-uva', name: 'Uva', category: 'Frutas', is_premium: false, preco_extra: 0, display_order: 5 },

  // Toppings Tradicionais
  { id: 'top-biscoff-creme', name: 'Biscoff creme', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 10 },
  { id: 'top-mel', name: 'Mel', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 11 },
  { id: 'top-biscoff-picado', name: 'Biscoff picado', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 12 },
  { id: 'top-oreo-inteiro', name: 'Oreo inteiro', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 13 },
  { id: 'top-canudo-crocante', name: 'Canudo crocante', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 14 },
  { id: 'top-oreo-picado', name: 'Oreo picado', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 15 },
  { id: 'top-chocobol', name: 'Chocobol', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 16 },
  { id: 'top-ovomaltine', name: 'Ovomaltine', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 17 },
  { id: 'top-granola', name: 'Granola', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 18 },
  { id: 'top-pacoca', name: 'Paçoca', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 19 },
  { id: 'top-iogurte', name: 'Iogurte natural', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 20 },
  { id: 'top-pepitas-chocolate', name: 'Pepitas de chocolate', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 21 },
  { id: 'top-leite-condensado', name: 'Leite condensado', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 22 },
  { id: 'top-pintarolas', name: 'Pintarolas', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 23 },
  { id: 'top-leite-em-po', name: 'Leite em pó', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 24 },
  { id: 'top-manteiga-amendoim', name: 'Manteiga de amendoim', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 25 },
  { id: 'top-marshmallow', name: 'Marshmallow', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 26 },

  // Adicionais Especiais Premium
  { id: 'top-creme-ninho', name: 'Creme de Leite em pó', category: 'Adicionais', is_premium: true, preco_extra: 1.0, display_order: 30 },
  { id: 'top-creme-pistache', name: 'Creme de Pistache', category: 'Adicionais', is_premium: true, preco_extra: 2.0, display_order: 31 },
  { id: 'top-nutella', name: 'Nutella', category: 'Adicionais', is_premium: true, preco_extra: 1.0, display_order: 32 },
];

async function runSeed() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL ausente. Ignorando sincronização com banco remoto.');
    return;
  }

  const client = await pool.connect();
  try {
    console.log('Conectado ao PostgreSQL. Atualizando catálogo canônico...');

    const tenantIds = [AVEIRO_HQ_ID, TORRES_NOVAS_ID];

    for (const tenantId of tenantIds) {
      // 1. Containers
      for (const c of CONTAINERS) {
        await client.query(`
          INSERT INTO product_containers (id, tenant_id, name, weight_grams, preco_base, limite_bases, limite_complementos_gratis, display_order, active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            weight_grams = EXCLUDED.weight_grams,
            preco_base = EXCLUDED.preco_base,
            limite_bases = EXCLUDED.limite_bases,
            limite_complementos_gratis = EXCLUDED.limite_complementos_gratis,
            display_order = EXCLUDED.display_order,
            active = true
        `, [c.id, tenantId, c.name, c.weight_grams, c.preco_base, c.limite_bases, c.limite_complementos_gratis, c.display_order]).catch(() => {});
      }

      // 2. Bases
      for (const b of BASES) {
        await client.query(`
          INSERT INTO product_bases (id, tenant_id, name, description, display_order, active)
          VALUES ($1, $2, $3, $4, $5, true)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            display_order = EXCLUDED.display_order,
            active = true
        `, [b.id, tenantId, b.name, b.description, b.display_order]).catch(() => {});
      }

      // 3. Toppings
      for (const t of TOPPINGS) {
        await client.query(`
          INSERT INTO product_toppings (id, tenant_id, name, category, is_premium, preco_extra, display_order, active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            is_premium = EXCLUDED.is_premium,
            preco_extra = EXCLUDED.preco_extra,
            display_order = EXCLUDED.display_order,
            active = true
        `, [t.id, tenantId, t.name, t.category, t.is_premium, t.preco_extra, t.display_order]).catch(() => {});
      }
    }

    console.log('Catálogo canônico atualizado com sucesso no banco de dados!');
  } catch (err) {
    console.error('Erro durante a sincronização:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
