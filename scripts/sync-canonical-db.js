/**
 * SCRIPT DE SINCRONIZAÇÃO DEFINITIVA NO BANCO DE DADOS POSTGRESQL
 * Açaí da Rose - Matriz Aveiro & Filial Torres Novas
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

const AVEIRO_HQ_ID = '11111111-1111-1111-1111-111111111111';
const TORRES_NOVAS_ID = '22222222-2222-2222-2222-222222222222';

const CONTAINERS = [
  { name: 'Açaí 250g', preco_base: 6.90, weight_grams: 250, limite_bases: 1, limite_complementos_gratis: 3, display_order: 1, image_url: '/images/official/acai_copo_250g.jpg', video_url: '/videos/hero_revealing_cup.mp4' },
  { name: 'Açaí 350g', preco_base: 8.90, weight_grams: 350, limite_bases: 1, limite_complementos_gratis: 3, display_order: 2, image_url: '/images/official/acai_copo_350g.jpg', video_url: '/videos/hero_orbiting_cup.mp4' },
  { name: 'Açaí 500g', preco_base: 12.90, weight_grams: 500, limite_bases: 1, limite_complementos_gratis: 99, display_order: 3, image_url: '/images/official/acai_copo_500g.jpg', video_url: '/videos/hero_cup_rotation.mp4' },
  { name: 'Açaí 750g', preco_base: 17.90, weight_grams: 750, limite_bases: 1, limite_complementos_gratis: 99, display_order: 4, image_url: '/images/official/acai_tigela_750g.jpg', video_url: '/videos/hero_gliding_texture.mp4' },
  { name: 'Açaí 1kg', preco_base: 22.90, weight_grams: 1000, limite_bases: 1, limite_complementos_gratis: 99, display_order: 5, image_url: '/images/official/acai_balde_1kg.jpg', video_url: '/videos/hero_cup_rotation.mp4' },
];

const BASES = [
  { name: 'Açaí Tradicional', description: 'Açaí puro e cremoso batido na hora', display_order: 1 },
  { name: 'Creme de Coco', description: 'Cremoso e artesanal', display_order: 2 },
  { name: 'Creme de Morango', description: 'Feito com morangos frescos', display_order: 3 },
  { name: 'Creme de Cupuaçu', description: 'Sabor autêntico da Amazônia', display_order: 4 },
  { name: 'Creme de Manga', description: 'Doce e refrescante', display_order: 5 },
  { name: 'Creme de Goiaba', description: 'Artesanal e aveludado', display_order: 6 },
  { name: 'Creme de Leite em pó', description: 'Sabor suave e irresistível', display_order: 7 },
  { name: 'Creme de Graviola', description: 'Fruta tropical brasileira', display_order: 8 },
  { name: 'Creme de Pitaya', description: 'Cor vibrante e rico em nutrientes', display_order: 9 },
  { name: 'Creme de Maracujá', description: 'Toque cítrico e refrescante', display_order: 10 },
];

const TOPPINGS = [
  // Frutas Frescas (5)
  { name: 'Banana', category: 'Frutas', is_premium: false, preco_extra: 0, display_order: 1 },
  { name: 'Kiwi', category: 'Frutas', is_premium: false, preco_extra: 0, display_order: 2 },
  { name: 'Manga', category: 'Frutas', is_premium: false, preco_extra: 0, display_order: 3 },
  { name: 'Morango', category: 'Frutas', is_premium: false, preco_extra: 0, display_order: 4 },
  { name: 'Uva', category: 'Frutas', is_premium: false, preco_extra: 0, display_order: 5 },

  // Toppings Tradicionais (17)
  { name: 'Biscoff creme', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 10 },
  { name: 'Mel', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 11 },
  { name: 'Biscoff picado', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 12 },
  { name: 'Oreo inteiro', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 13 },
  { name: 'Canudo crocante', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 14 },
  { name: 'Oreo picado', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 15 },
  { name: 'Chocobol', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 16 },
  { name: 'Ovomaltine', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 17 },
  { name: 'Granola', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 18 },
  { name: 'Paçoca', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 19 },
  { name: 'Iogurte natural', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 20 },
  { name: 'Pepitas de chocolate', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 21 },
  { name: 'Leite condensado', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 22 },
  { name: 'Pintarolas', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 23 },
  { name: 'Leite em pó', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 24 },
  { name: 'Manteiga de amendoim', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 25 },
  { name: 'Marshmallow', category: 'Toppings', is_premium: false, preco_extra: 0, display_order: 26 },

  // Adicionais Especiais (3)
  { name: 'Creme de Leite em pó', category: 'Adicionais', is_premium: true, preco_extra: 1.0, display_order: 30 },
  { name: 'Creme de Pistache', category: 'Adicionais', is_premium: true, preco_extra: 2.0, display_order: 31 },
  { name: 'Nutella', category: 'Adicionais', is_premium: true, preco_extra: 1.0, display_order: 32 },
];

async function syncDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tenants = [AVEIRO_HQ_ID, TORRES_NOVAS_ID];

    for (const tenantId of tenants) {
      console.log(`Limpando e reinserindo catálogo canônico para a loja ${tenantId}...`);

      // Deletar registros antigos desse tenant
      await client.query('DELETE FROM product_containers WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM product_bases WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM product_toppings WHERE tenant_id = $1', [tenantId]);

      // 1. Inserir Containers
      for (const c of CONTAINERS) {
        const id = crypto.randomUUID();
        await client.query(`
          INSERT INTO product_containers (id, tenant_id, name, weight_grams, preco_base, limite_bases, limite_complementos_gratis, display_order, image_url, video_url, active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        `, [id, tenantId, c.name, c.weight_grams, c.preco_base, c.limite_bases, c.limite_complementos_gratis, c.display_order, c.image_url, c.video_url]);
      }

      // 2. Inserir Bases
      for (const b of BASES) {
        const id = crypto.randomUUID();
        await client.query(`
          INSERT INTO product_bases (id, tenant_id, name, description, display_order, active)
          VALUES ($1, $2, $3, $4, $5, true)
        `, [id, tenantId, b.name, b.description, b.display_order]);
      }

      // 3. Inserir Toppings
      for (const t of TOPPINGS) {
        const id = crypto.randomUUID();
        await client.query(`
          INSERT INTO product_toppings (id, tenant_id, name, category, is_premium, preco_extra, display_order, active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        `, [id, tenantId, t.name, t.category, t.is_premium, t.preco_extra, t.display_order]);
      }
    }

    await client.query('COMMIT');
    console.log('Catálogo canônico 100% sincronizado com sucesso no PostgreSQL de produção!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro na sincronização:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

syncDatabase();
