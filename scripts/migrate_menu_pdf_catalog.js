/**
 * scripts/migrate_menu_pdf_catalog.js
 * 
 * Script de Migração Idempotente do Catálogo Açaí da Rose:
 * - Adiciona colunas multilíngues (ES / EN) em todas as tabelas mestres.
 * - Cria tabelas customer_rating_criteria, store_interface_translations, store_languages_config.
 * - Atualiza customer_ratings com colunas por critérios, idioma e mesa.
 * - Atualiza os 35 produtos existentes (Taças 250g, 350g, 500g e Potes 750g, 1kg com tampa) preservando histórico e UUIDs.
 * - Cadastra os 5 Menus Canônicos e suas respectivas Categorias.
 * - Insere todos os itens extraídos dos PDFs com preços, vídeos/posters e option_groups para as 3 lojas.
 * - Incrementa a versão em store_catalog_versions.
 */

const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

function strToUuid(str) {
  const hash = crypto.createHash('sha1').update(str).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join('-');
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

const CANONICAL_TENANTS = [
  '11111111-1111-1111-1111-111111111111', // Figueira da Foz (Matriz)
  '22222222-2222-2222-2222-222222222222', // Torres Novas (Filial 1)
  '33333333-3333-3333-3333-333333333333', // Aveiro (Franquia)
];

const MENUS = [
  {
    id: '1c8ff060-3048-47c3-a5ec-efb60a56d0c1',
    code: 'MENU_ACAI_ROSE',
    name: 'Açaí da Rose',
    name_en: 'Açaí da Rose',
    name_es: 'Açaí da Rose',
    description: 'Taças de açaí montadas na hora com frutas frescas e acompanhamentos nobres',
    description_en: 'Freshly assembled açaí bowls with fresh fruits and premium toppings',
    description_es: 'Boles de açaí recién preparados con frutas frescas y toppings premium',
    display_order: 1,
  },
  {
    id: '3c8ff060-3048-47c3-a5ec-efb60a56d0c3',
    code: 'MENU_MILKSHAKES',
    name: 'Milk Shakes',
    name_en: 'Milk Shakes',
    name_es: 'Batidos',
    description: 'Milk Shakes cremosos de 600ml com frutas frescas e caldas',
    description_en: 'Creamy 600ml Milk Shakes with fresh fruit and rich toppings',
    description_es: 'Batidos cremosos de 600ml con frutas frescas y siropes',
    display_order: 2,
  },
  {
    id: '2c8ff060-3048-47c3-a5ec-efb60a56d0c2',
    code: 'MENU_LANCHES',
    name: 'Lanches',
    name_en: 'Snacks',
    name_es: 'Bocadillos',
    description: 'Tapiocas, pão de queijo, croissants quentinhos e pastelaria salgada',
    description_en: 'Tapiocas, Brazilian cheese bread, warm croissants and savory bites',
    description_es: 'Tapiocas, pan de queso brasileño, croissants calientes y bocados salados',
    display_order: 3,
  },
  {
    id: '4c8ff060-3048-47c3-a5ec-efb60a56d0c4',
    code: 'MENU_BEBIDAS',
    name: 'Bebidas',
    name_en: 'Beverages',
    name_es: 'Bebidas',
    description: 'Sumos de polpa natural, refrigerantes e águas',
    description_en: 'Natural fruit pulp juices, soft drinks and water',
    description_es: 'Zumos de pulpa natural, refrescos y aguas',
    display_order: 4,
  },
  {
    id: '6c8ff060-3048-47c3-a5ec-efb60a56d0c6',
    code: 'MENU_CAFES',
    name: 'Cafés',
    name_en: 'Coffees',
    name_es: 'Cafés',
    description: 'Cafés especiais, expressos, galão e quentes',
    description_en: 'Specialty coffees, espresso, galão and hot drinks',
    description_es: 'Cafés especiales, espressos y bebidas calientes',
    display_order: 5,
  },
  {
    id: '5c8ff060-3048-47c3-a5ec-efb60a56d0c5',
    code: 'MENU_CHOCOLATES',
    name: 'Chocolates',
    name_en: 'Chocolates',
    name_es: 'Chocolates',
    description: 'Bombons nobres, chocolates importados, gomas e pastilhas',
    description_en: 'Fine bonbons, premium chocolates, gummies and candies',
    description_es: 'Bombones selectos, chocolates importados, gominolas y chicles',
    display_order: 6,
  },
];

const NEW_CATEGORIES = [
  {
    id: 'cat-milkshakes',
    menu_id: '3c8ff060-3048-47c3-a5ec-efb60a56d0c3',
    slug: 'milk-shakes',
    name: 'Milk Shakes 600ml',
    name_en: 'Milk Shakes 600ml',
    name_es: 'Batidos 600ml',
    description: 'Milk Shakes preparados na hora no copo de 600ml',
    description_en: 'Freshly prepared 600ml milkshakes',
    description_es: 'Batidos recién preparados en vaso de 600ml',
    display_order: 1,
    default_price: 6.00,
  },
  {
    id: 'cat-cafes',
    menu_id: '6c8ff060-3048-47c3-a5ec-efb60a56d0c6',
    slug: 'cafes-quentes',
    name: 'Cafés & Quentes',
    name_en: 'Coffees & Hot Drinks',
    name_es: 'Cafés y Calientes',
    description: 'Cafés expressos, capuccinos e bebidas quentes reconfortantes',
    description_en: 'Espressos, cappuccinos and comforting hot drinks',
    description_es: 'Cafés expresos, capuchinos y reconfortantes bebidas calientes',
    display_order: 1,
    default_price: 1.50,
  },
  {
    id: 'cat-sumos-polpa',
    menu_id: '4c8ff060-3048-47c3-a5ec-efb60a56d0c4',
    slug: 'sumos-polpa',
    name: 'Sumos de Polpa',
    name_en: 'Pulp Fruit Juices',
    name_es: 'Zumos de Pulpa',
    description: 'Sumos naturais de polpa pura de fruta tropical',
    description_en: 'Natural pure tropical fruit juices',
    description_es: 'Zumos naturales de pura pulpa de fruta tropical',
    display_order: 1,
    default_price: 3.50,
  },
  {
    id: 'cat-bebidas',
    menu_id: '4c8ff060-3048-47c3-a5ec-efb60a56d0c4',
    slug: 'aguas-refrigerantes',
    name: 'Águas & Refrigerantes',
    name_en: 'Water & Soft Drinks',
    name_es: 'Aguas y Refrescos',
    description: 'Águas minerais, águas com gás e refrigerantes frescos',
    description_en: 'Mineral waters, sparkling waters and refreshing soft drinks',
    description_es: 'Aguas minerales, aguas con gas y refrescos frescos',
    display_order: 3,
    default_price: 1.80,
  },
  {
    id: 'cat-chocolates',
    menu_id: '5c8ff060-3048-47c3-a5ec-efb60a56d0c5',
    slug: 'chocolates-bombons',
    name: 'Chocolates & Bombons',
    name_en: 'Chocolates & Candies',
    name_es: 'Chocolates y Bombones',
    description: 'Seleção especial de chocolates, barras e bombons',
    description_en: 'Special selection of chocolate bars and bonbons',
    description_es: 'Selección especial de chocolatinas, tabletas y bombones',
    display_order: 1,
    default_price: 2.00,
  },
  {
    id: 'cat-gomas',
    menu_id: '5c8ff060-3048-47c3-a5ec-efb60a56d0c5',
    slug: 'gomas-pastilhas',
    name: 'Gomas & Pastilhas',
    name_en: 'Gummies & Candies',
    name_es: 'Gominolas y Chicles',
    description: 'Gomas coloridas, saquinhos sortidos e pastilhas elásticas',
    description_en: 'Assorted gummies, sweet bags and chewing gums',
    description_es: 'Gominolas surtidas, bolsitas dulces y chicles',
    display_order: 2,
    default_price: 1.20,
  },
];

// Opcionais dos Milk Shakes 600ml
const MILKSHAKE_OPTION_GROUPS = [
  {
    id: 'opt-milk-type',
    name: 'Tipo de Leite',
    nameEn: 'Milk Type',
    nameEs: 'Tipo de Leche',
    minQty: 1,
    maxQty: 1,
    isRequired: true,
    priceType: 'Gratis',
    options: [
      { id: 'opt-milk-whole', name: 'Leite Meio-Gordo', nameEn: 'Semi-Skimmed Milk', nameEs: 'Leche Semidesnatada', price: 0 },
      { id: 'opt-milk-lactose-free', name: 'Sem Lactose', nameEn: 'Lactose Free', nameEs: 'Sin Lactosa', price: 0.50 },
      { id: 'opt-milk-oat', name: 'Bebida de Aveia', nameEn: 'Oat Milk', nameEs: 'Bebida de Avena', price: 0.60 },
    ],
  },
  {
    id: 'opt-milkshake-texture',
    name: 'Ponto da Textura',
    nameEn: 'Texture Preference',
    nameEs: 'Punto de Textura',
    minQty: 1,
    maxQty: 1,
    isRequired: true,
    priceType: 'Gratis',
    options: [
      { id: 'opt-tex-creamy', name: 'Cremoso Tradicional', nameEn: 'Traditional Creamy', nameEs: 'Cremoso Tradicional', price: 0 },
      { id: 'opt-tex-thick', name: 'Super Espesso', nameEn: 'Extra Thick', nameEs: 'Súper Espeso', price: 0 },
    ],
  },
  {
    id: 'opt-milkshake-extras',
    name: 'Turbinar Milk Shake',
    nameEn: 'Boost your Milk Shake',
    nameEs: 'Personaliza tu Batido',
    minQty: 0,
    maxQty: 5,
    isRequired: false,
    priceType: 'Individual',
    options: [
      { id: 'opt-extra-nutella', name: 'Nutella Original', nameEn: 'Original Nutella', nameEs: 'Nutella Original', price: 1.50 },
      { id: 'opt-extra-whey', name: 'Dose Whey Protein Isolado', nameEn: 'Isolated Whey Protein Scoop', nameEs: 'Dosis de Proteína Whey Aislada', price: 2.00 },
      { id: 'opt-extra-chantilly', name: 'Chantilly Nobre', nameEn: 'Whipped Cream', nameEs: 'Nata Montada', price: 0.80 },
      { id: 'opt-extra-biscoff', name: 'Creme Lotus Biscoff', nameEn: 'Lotus Biscoff Spread', nameEs: 'Crema Lotus Biscoff', price: 1.50 },
      { id: 'opt-extra-ovomaltine', name: 'Ovomaltine Crocante', nameEn: 'Crunchy Ovomaltine', nameEs: 'Ovomaltine Crujiente', price: 1.00 },
      { id: 'opt-extra-pacoca', name: 'Paçoca de Amendoim', nameEn: 'Peanut Candy (Paçoca)', nameEs: 'Paçoca de Cacahuete', price: 0.80 },
    ],
  },
];

// Opcionais dos Sumos de Polpa
const SUMO_OPTION_GROUPS = [
  {
    id: 'opt-sumo-prep',
    name: 'Preparação do Sumo',
    nameEn: 'Juice Base Preparation',
    nameEs: 'Preparación del Zumo',
    minQty: 1,
    maxQty: 1,
    isRequired: true,
    priceType: 'Individual',
    options: [
      { id: 'opt-prep-agua', name: 'Com Água Fresca', nameEn: 'With Fresh Water', nameEs: 'Con Agua Fresca', price: 0 },
      { id: 'opt-prep-leite', name: 'Com Leite (+0,50€)', nameEn: 'With Milk (+0.50€)', nameEs: 'Con Leche (+0,50€)', price: 0.50 },
    ],
  },
  {
    id: 'opt-sumo-sugar',
    name: 'Adoçamento',
    nameEn: 'Sweetener Preference',
    nameEs: 'Preferencia de Endulzante',
    minQty: 1,
    maxQty: 1,
    isRequired: true,
    priceType: 'Gratis',
    options: [
      { id: 'opt-sugar-sem', name: 'Sem Açúcar (Sabor Natural)', nameEn: 'No Sugar (Natural Taste)', nameEs: 'Sin Azúcar (Sabor Natural)', price: 0 },
      { id: 'opt-sugar-com', name: 'Com Açúcar Tradicional', nameEn: 'With Sugar', nameEs: 'Con Azúcar', price: 0 },
      { id: 'opt-sugar-adocante', name: 'Com Adoçante', nameEn: 'With Sweetener', nameEs: 'Con Edulcorante', price: 0 },
    ],
  },
  {
    id: 'opt-sumo-ice',
    name: 'Gelo',
    nameEn: 'Ice',
    nameEs: 'Hielo',
    minQty: 1,
    maxQty: 1,
    isRequired: true,
    priceType: 'Gratis',
    options: [
      { id: 'opt-ice-normal', name: 'Com Bastante Gelo', nameEn: 'With Ice', nameEs: 'Con Hielo', price: 0 },
      { id: 'opt-ice-sem', name: 'Sem Gelo', nameEn: 'No Ice', nameEs: 'Sin Hielo', price: 0 },
    ],
  },
];

// Opcionais dos Cafés
const CAFE_OPTION_GROUPS = [
  {
    id: 'opt-cafe-leite',
    name: 'Opção de Leite',
    nameEn: 'Milk Preference',
    nameEs: 'Opción de Leche',
    minQty: 0,
    maxQty: 1,
    isRequired: false,
    priceType: 'Individual',
    options: [
      { id: 'opt-cafe-leite-normal', name: 'Leite Meio-Gordo', nameEn: 'Regular Milk', nameEs: 'Leche Normal', price: 0 },
      { id: 'opt-cafe-leite-sem-lactose', name: 'Sem Lactose (+0,30€)', nameEn: 'Lactose Free (+0.30€)', nameEs: 'Sin Lactosa (+0,30€)', price: 0.30 },
      { id: 'opt-cafe-leite-aveia', name: 'Bebida de Aveia (+0,40€)', nameEn: 'Oat Milk (+0.40€)', nameEs: 'Bebida de Avena (+0,40€)', price: 0.40 },
    ],
  },
  {
    id: 'opt-cafe-sugar',
    name: 'Adoçamento',
    nameEn: 'Sugar / Sweetener',
    nameEs: 'Azúcar / Edulcorante',
    minQty: 0,
    maxQty: 1,
    isRequired: false,
    priceType: 'Gratis',
    options: [
      { id: 'opt-sugar-pacote-branco', name: 'Açúcar Branco', nameEn: 'White Sugar', nameEs: 'Azúcar Blanco', price: 0 },
      { id: 'opt-sugar-pacote-amarelo', name: 'Açúcar Mascavado', nameEn: 'Brown Sugar', nameEs: 'Azúcar Moreno', price: 0 },
      { id: 'opt-sugar-pacote-adocante', name: 'Adoçante', nameEn: 'Sweetener', nameEs: 'Edulcorante', price: 0 },
    ],
  },
];

// Lista Completa de Novos Itens a Cadastrar em product_containers
const NEW_PRODUCTS = [
  // --- MILK SHAKES 600ML ---
  {
    id: 'ms-banana-morango-600',
    category_id: 'cat-milkshakes',
    name: 'Milk Shake 600ml - Banana e Morango',
    name_en: '600ml Milk Shake - Banana and Strawberry',
    name_es: 'Batido 600ml - Plátano y Fresa',
    description: 'Milk Shake cremoso de 600ml preparado com polpa nobre, banana fresca e morango',
    description_en: 'Creamy 600ml Milk Shake prepared with fine pulp, fresh banana and strawberry',
    description_es: 'Batido cremoso de 600ml preparado con pulpa fina, plátano fresco y fresa',
    preco_base: 6.00,
    weight_grams: 600,
    option_groups: MILKSHAKE_OPTION_GROUPS,
    product_type: 'ITEM',
    video_poster: '/images/official/milkshake_hero.webp',
  },
  {
    id: 'ms-nutella-600',
    category_id: 'cat-milkshakes',
    name: 'Milk Shake 600ml - com Nutella',
    name_en: '600ml Milk Shake - with Nutella',
    name_es: 'Batido 600ml - con Nutella',
    description: 'Milk Shake cremoso com generosa calda artesanal de Nutella pura',
    description_en: 'Creamy Milk Shake drizzled with authentic rich Nutella spread',
    description_es: 'Batido cremoso con generosa salsa artesanal de Nutella pura',
    preco_base: 6.50,
    weight_grams: 600,
    option_groups: MILKSHAKE_OPTION_GROUPS,
    product_type: 'ITEM',
    video_poster: '/images/official/milkshake_hero.webp',
  },
  {
    id: 'ms-whey-600',
    category_id: 'cat-milkshakes',
    name: 'Milk Shake 600ml - com Whey Protein',
    name_en: '600ml Milk Shake - with Whey Protein',
    name_es: 'Batido 600ml - con Proteína Whey',
    description: 'Milk Shake nutritivo e encorpado com dose pura de Whey Protein isolado',
    description_en: 'Nutritious full-bodied Milk Shake enriched with a scoop of isolated Whey Protein',
    description_es: 'Batido nutritivo y consistente con dosis pura de Proteína Whey aislada',
    preco_base: 7.00,
    weight_grams: 600,
    option_groups: MILKSHAKE_OPTION_GROUPS,
    product_type: 'ITEM',
    video_poster: '/images/official/milkshake_hero.webp',
  },

  // --- SUMOS NATURAIS DE POLPA ---
  ...[
    { id: 'sumo-cupuacu', pt: 'Sumo de Polpa - Cupuaçu', en: 'Pulp Fruit Juice - Cupuaçu', es: 'Zumo de Pulpa - Cupuaçu' },
    { id: 'sumo-goiaba', pt: 'Sumo de Polpa - Goiaba', en: 'Pulp Fruit Juice - Guava', es: 'Zumo de Pulpa - Guayaba' },
    { id: 'sumo-graviola', pt: 'Sumo de Polpa - Graviola', en: 'Pulp Fruit Juice - Soursop', es: 'Zumo de Pulpa - Guanábana' },
    { id: 'sumo-manga', pt: 'Sumo de Polpa - Manga', en: 'Pulp Fruit Juice - Mango', es: 'Zumo de Pulpa - Mango' },
    { id: 'sumo-maracuja', pt: 'Sumo de Polpa - Maracujá', en: 'Pulp Fruit Juice - Passion Fruit', es: 'Zumo de Pulpa - Maracuyá' },
    { id: 'sumo-morango', pt: 'Sumo de Polpa - Morango', en: 'Pulp Fruit Juice - Strawberry', es: 'Zumo de Pulpa - Fresa' },
    { id: 'sumo-coco', pt: 'Sumo de Polpa - Coco', en: 'Pulp Fruit Juice - Coconut', es: 'Zumo de Pulpa - Coco' },
    { id: 'sumo-caju', pt: 'Sumo de Polpa - Caju', en: 'Pulp Fruit Juice - Cashew Fruit', es: 'Zumo de Pulpa - Fruta de Anacardo' },
    { id: 'sumo-acerola', pt: 'Sumo de Polpa - Acerola', en: 'Pulp Fruit Juice - Acerola Cherry', es: 'Zumo de Pulpa - Acerola' },
  ].map((s) => ({
    id: s.id,
    category_id: 'cat-sumos-polpa',
    name: s.pt,
    name_en: s.en,
    name_es: s.es,
    description: 'Sumo natural batido na hora com polpa pura (3,50€ com água, 4,00€ com leite)',
    description_en: 'Fresh tropical fruit pulp juice (3.50€ with water, 4.00€ with milk)',
    description_es: 'Zumo natural batido al instante con pulpa pura (3,50€ con agua, 4,00€ con leche)',
    preco_base: 3.50,
    weight_grams: null,
    option_groups: SUMO_OPTION_GROUPS,
    product_type: 'ITEM',
  })),

  // --- CAFÉS & QUENTES ---
  {
    id: 'cafe-cafezinho',
    category_id: 'cat-cafes',
    name: 'Cafézinho Expresso',
    name_en: 'Espresso Coffee',
    name_es: 'Café Expreso',
    description: 'Café expresso tirado na hora com crema perfeita',
    description_en: 'Freshly brewed aromatic espresso coffee',
    description_es: 'Café expreso recién hecho con crema perfecta',
    preco_base: 0.90,
    weight_grams: null,
    option_groups: CAFE_OPTION_GROUPS,
    product_type: 'ITEM',
  },
  {
    id: 'cafe-com-leite',
    category_id: 'cat-cafes',
    name: 'Café com Leite (Meia de Leite)',
    name_en: 'Coffee with Milk (Latte)',
    name_es: 'Café con Leche',
    description: 'Expresso harmonizado com leite vaporizado quente',
    description_en: 'Fresh espresso perfectly paired with warm steamed milk',
    description_es: 'Expreso armonizado con leche caliente vaporizada',
    preco_base: 1.50,
    weight_grams: null,
    option_groups: CAFE_OPTION_GROUPS,
    product_type: 'ITEM',
  },
  {
    id: 'cafe-capuccino-150',
    category_id: 'cat-cafes',
    name: 'Capuccino 150ml',
    name_en: '150ml Cappuccino',
    name_es: 'Capuchino 150ml',
    description: 'Capuccino clássico com espuma densa de leite e cacau em pó',
    description_en: 'Classic cappuccino with rich milk foam and cocoa dust',
    description_es: 'Capuchino clásico con densa espuma de leche y cacao en polvo',
    preco_base: 1.50,
    weight_grams: null,
    option_groups: CAFE_OPTION_GROUPS,
    product_type: 'ITEM',
  },
  {
    id: 'cafe-capuccino-300',
    category_id: 'cat-cafes',
    name: 'Capuccino 300ml (Taça Grande)',
    name_en: '300ml Large Cappuccino',
    name_es: 'Capuchino 300ml (Taza Grande)',
    description: 'Dose dupla de capuccino generoso com canela e cacau',
    description_en: 'Double portion cappuccino served with cinnamon and cocoa',
    description_es: 'Dosis doble de generoso capuchino con canela y cacao',
    preco_base: 3.00,
    weight_grams: null,
    option_groups: CAFE_OPTION_GROUPS,
    product_type: 'ITEM',
  },
  {
    id: 'cafe-choc-quente-150',
    category_id: 'cat-cafes',
    name: 'Chocolate Quente 150ml',
    name_en: '150ml Hot Chocolate',
    name_es: 'Chocolate Caliente 150ml',
    description: 'Chocolate quente denso e aveludado',
    description_en: 'Velvety rich melted hot chocolate',
    description_es: 'Chocolate caliente denso y aterciopelado',
    preco_base: 1.50,
    weight_grams: null,
    option_groups: CAFE_OPTION_GROUPS,
    product_type: 'ITEM',
  },
  {
    id: 'cafe-choc-quente-300',
    category_id: 'cat-cafes',
    name: 'Chocolate Quente 300ml (Taça Grande)',
    name_en: '300ml Large Hot Chocolate',
    name_es: 'Chocolate Caliente 300ml (Taza Grande)',
    description: 'Grande dose de chocolate quente espesso e cremoso',
    description_en: 'Generous cup of thick comforting hot chocolate',
    description_es: 'Gran taza de chocolate caliente espeso y cremoso',
    preco_base: 3.00,
    weight_grams: null,
    option_groups: CAFE_OPTION_GROUPS,
    product_type: 'ITEM',
  },
  {
    id: 'cafe-cha',
    category_id: 'cat-cafes',
    name: 'Chá / Infusão Quente',
    name_en: 'Hot Tea / Infusion',
    name_es: 'Té / Infusión Caliente',
    description: 'Chá aromático quente servido com saqueta à escolha',
    description_en: 'Aromatic hot tea or herbal infusion of choice',
    description_es: 'Té aromático caliente o infusión de hierbas a elegir',
    preco_base: 1.50,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },

  // --- ÁGUAS & REFRIGERANTES ---
  {
    id: 'beb-agua-500',
    category_id: 'cat-bebidas',
    name: 'Água Mineral 500ml',
    name_en: 'Still Water 500ml',
    name_es: 'Agua Mineral 500ml',
    description: 'Água mineral fresca sem gás',
    description_en: 'Refreshing still mineral water',
    description_es: 'Agua mineral fresca sin gas',
    preco_base: 1.00,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'beb-agua-1500',
    category_id: 'cat-bebidas',
    name: 'Água Mineral 1,5L',
    name_en: 'Still Water 1.5L',
    name_es: 'Agua Mineral 1,5L',
    description: 'Garrafa familiar de água mineral sem gás',
    description_en: 'Large family bottle of still water',
    description_es: 'Botella familiar de agua mineral sin gas',
    preco_base: 1.60,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'beb-agua-gas',
    category_id: 'cat-bebidas',
    name: 'Água com Gás',
    name_en: 'Sparkling Water',
    name_es: 'Agua con Gas',
    description: 'Água com gás mineral natural com bolhas refrescantes',
    description_en: 'Naturally carbonated refreshing sparkling water',
    description_es: 'Agua mineral con gas natural con burbujas refrescantes',
    preco_base: 1.50,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'beb-agua-pedras',
    category_id: 'cat-bebidas',
    name: 'Água das Pedras',
    name_en: 'Água das Pedras (Portuguese Sparkling Water)',
    name_es: 'Água das Pedras (Agua con Gas Portuguesa)',
    description: 'Água mineral natural gasocarbónica tradicional de Portugal',
    description_en: 'Traditional Portuguese natural sparkling mineral water',
    description_es: 'Tradicional agua mineral gasocarbónica portuguesa',
    preco_base: 1.60,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'beb-agua-saborizada',
    category_id: 'cat-bebidas',
    name: 'Água Saborizada',
    name_en: 'Flavored Water',
    name_es: 'Agua Saborizada',
    description: 'Água com gás levemente saborizada com toques de fruta',
    description_en: 'Sparkling water with natural fruit essence',
    description_es: 'Agua con gas ligeramente aromatizada con frutas',
    preco_base: 1.60,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'beb-frize',
    category_id: 'cat-bebidas',
    name: 'Frize Sabores',
    name_en: 'Frize Flavored Sparkling Water',
    name_es: 'Frize con Sabores',
    description: 'Água gasosa portuguesa com sumo natural de fruta',
    description_en: 'Portuguese sparkling fruit flavored water',
    description_es: 'Agua con gas portuguesa con zumo natural de frutas',
    preco_base: 1.80,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'beb-fanta',
    category_id: 'cat-bebidas',
    name: 'Fanta Laranja / Uva',
    name_en: 'Fanta Orange / Grape',
    name_es: 'Fanta Naranja / Uva',
    description: 'Refrigerante em lata bem gelado',
    description_en: 'Chilled canned soft drink',
    description_es: 'Refresco en lata bien frío',
    preco_base: 1.80,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'beb-gatorade',
    category_id: 'cat-bebidas',
    name: 'Gatorade Isotónico',
    name_en: 'Gatorade Sports Drink',
    name_es: 'Gatorade Bebida Isotónica',
    description: 'Bebida isotónica hidratante para repor energia',
    description_en: 'Hydrating electrolyte sports beverage',
    description_es: 'Bebida isotónica hidratante para reponer energía',
    preco_base: 2.50,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'beb-guarana',
    category_id: 'cat-bebidas',
    name: 'Guaraná Antarctica',
    name_en: 'Guaraná Antarctica (Brazilian Soda)',
    name_es: 'Guaraná Antarctica (Refresco Brasileño)',
    description: 'O sabor inconfundível do guaraná brasileiro em lata gelada',
    description_en: 'Iconic authentic Brazilian guaraná soda',
    description_es: 'El sabor inconfundible del guaraná brasileño en lata fría',
    preco_base: 1.80,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'beb-pepsi',
    category_id: 'cat-bebidas',
    name: 'Pepsi / Pepsi Max',
    name_en: 'Pepsi / Pepsi Max',
    name_es: 'Pepsi / Pepsi Max',
    description: 'Lata de refrigerante gelada com ou sem açúcar',
    description_en: 'Chilled canned cola with or without sugar',
    description_es: 'Lata de refresco de cola fría con o sin azúcar',
    preco_base: 1.80,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'beb-coca-200',
    category_id: 'cat-bebidas',
    name: 'Coca-Cola 200ml (Garrafinha)',
    name_en: 'Coca-Cola 200ml (Glass Bottle)',
    name_es: 'Coca-Cola 200ml (Botellín)',
    description: 'Garrafinha clássica de vidro bem gelada',
    description_en: 'Classic cold glass bottle',
    description_es: 'Botellín clásico de vidrio bien frío',
    preco_base: 1.80,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'beb-coca-330',
    category_id: 'cat-bebidas',
    name: 'Coca-Cola / Coca-Cola Zero 330ml (Lata)',
    name_en: 'Coca-Cola / Zero 330ml (Can)',
    name_es: 'Coca-Cola / Zero 330ml (Lata)',
    description: 'Lata tradicional de 330ml servida fresca',
    description_en: 'Traditional 330ml can served cold',
    description_es: 'Lata tradicional de 330ml servida fresca',
    preco_base: 2.00,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'beb-sprite',
    category_id: 'cat-bebidas',
    name: 'Sprite Limão',
    name_en: 'Sprite Lemon-Lime',
    name_es: 'Sprite Limón',
    description: 'Refrigerante cítrico refrescante em lata',
    description_en: 'Crisp refreshing lemon-lime soda',
    description_es: 'Refresco cítrico refrescante en lata',
    preco_base: 1.80,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },

  // --- CHOCOLATES & BOMBONS ---
  ...[
    { id: 'choc-bis', pt: 'Bis Tradicional', en: 'Bis Chocolate Wafer', es: 'Bis Barquillo de Chocolate', price: 1.00 },
    { id: 'choc-sonho-valsa', pt: 'Bombom Sonho de Valsa', en: 'Sonho de Valsa Bonbon', es: 'Bombón Sonho de Valsa', price: 1.00 },
    { id: 'choc-ouro-branco', pt: 'Bombom Ouro Branco', en: 'Ouro Branco Bonbon', es: 'Bombón Ouro Branco', price: 1.00 },
    { id: 'choc-batom', pt: 'Chocolate Batom', en: 'Batom Milk Chocolate', es: 'Chocolate con Leche Batom', price: 1.00 },
    { id: 'choc-crunch', pt: 'Crunch Chocolate Crocante', en: 'Crunch Crispy Chocolate', es: 'Crunch Chocolate Crujiente', price: 2.00 },
    { id: 'choc-ferrero', pt: 'Ferrero Rocher (Unidade)', en: 'Ferrero Rocher (Piece)', es: 'Ferrero Rocher (Unidad)', price: 1.50 },
    { id: 'choc-kinder-bueno', pt: 'Kinder Bueno', en: 'Kinder Bueno', es: 'Kinder Bueno', price: 2.00 },
    { id: 'choc-kinder-joy', pt: 'Kinder Joy', en: 'Kinder Joy', es: 'Kinder Joy', price: 2.20 },
    { id: 'choc-milka', pt: 'Barra Milka Sortida', en: 'Milka Chocolate Bar', es: 'Tableta Milka Variada', price: 2.50 },
    { id: 'choc-kitkat', pt: 'Kit Kat Chocolate', en: 'Kit Kat Chocolate Bar', es: 'Kit Kat Barquillo de Chocolate', price: 1.80 },
    { id: 'choc-oreo', pt: 'Bolachas Oreo', en: 'Oreo Cookies Pack', es: 'Galletas Oreo', price: 1.50 },
  ].map((c) => ({
    id: c.id,
    category_id: 'cat-chocolates',
    name: c.pt,
    name_en: c.en,
    name_es: c.es,
    description: 'Chocolate ou bombom nobre original',
    description_en: 'Authentic branded fine chocolate confectionery',
    description_es: 'Chocolate o bombón original de marca selecta',
    preco_base: c.price,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  })),

  // --- GOMAS & PASTILHAS ---
  {
    id: 'goma-unidade',
    category_id: 'cat-gomas',
    name: 'Goma Doce (Unidade)',
    name_en: 'Single Gummy Candy',
    name_es: 'Gominola Dulce (Unidad)',
    description: 'Goma sortida individual à escolha no balcão',
    description_en: 'Single assorted gummy sweet of choice',
    description_es: 'Gominola surtida individual a elegir en mostrador',
    preco_base: 0.10,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'goma-saquinho',
    category_id: 'cat-gomas',
    name: 'Saquinho de Gomas Sortidas',
    name_en: 'Bag of Assorted Gummies',
    name_es: 'Bolsita de Gominolas Surtidas',
    description: 'Saquinho repleto de gomas multicoloridas saborosas',
    description_en: 'Pack of colorful delicious assorted gummies',
    description_es: 'Bolsita repleta de sabrosas gominolas multicolor',
    preco_base: 1.20,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
  {
    id: 'goma-trident',
    category_id: 'cat-gomas',
    name: 'Trident Pastilhas Elásticas',
    name_en: 'Trident Chewing Gum Pack',
    name_es: 'Chicles Trident',
    description: 'Embalagem de pastilhas elásticas sem açúcar sabor intenso',
    description_en: 'Pack of intense long-lasting sugar-free chewing gum',
    description_es: 'Paquete de chicles sin azúcar con sabor intenso',
    preco_base: 1.30,
    weight_grams: null,
    option_groups: [],
    product_type: 'ITEM',
  },
];

async function migrate() {
  const client = await pool.connect();
  console.log('🚀 Iniciando Migração do Catálogo Completo Açaí da Rose...');

  try {
    await client.query('BEGIN');

    // 1. DDL: Colunas em menus, categories, product_containers, product_bases, product_toppings, store_stories
    console.log('📦 Passo 1: Aplicando DDL multilíngue...');
    await client.query(`
      ALTER TABLE menus ADD COLUMN IF NOT EXISTS name_es VARCHAR(255), ADD COLUMN IF NOT EXISTS description_es TEXT;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_es VARCHAR(255), ADD COLUMN IF NOT EXISTS description_es TEXT;
      ALTER TABLE product_containers ADD COLUMN IF NOT EXISTS name_es VARCHAR(255), ADD COLUMN IF NOT EXISTS description_es TEXT;
      ALTER TABLE product_bases ADD COLUMN IF NOT EXISTS name_es VARCHAR(255), ADD COLUMN IF NOT EXISTS description_es TEXT;
      ALTER TABLE product_toppings ADD COLUMN IF NOT EXISTS name_es VARCHAR(255), ADD COLUMN IF NOT EXISTS description_es TEXT;
      ALTER TABLE store_stories 
        ADD COLUMN IF NOT EXISTS title_en VARCHAR(255), 
        ADD COLUMN IF NOT EXISTS title_es VARCHAR(255), 
        ADD COLUMN IF NOT EXISTS subtitle_en TEXT, 
        ADD COLUMN IF NOT EXISTS subtitle_es TEXT, 
        ADD COLUMN IF NOT EXISTS badge_text_en VARCHAR(100), 
        ADD COLUMN IF NOT EXISTS badge_text_es VARCHAR(100);
    `);

    // 2. DDL: customer_ratings & customer_rating_criteria
    console.log('⭐ Passo 2: Estruturando tabelas de avaliações e critérios...');
    await client.query(`
      ALTER TABLE customer_ratings 
        ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS table_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS criteria_scores JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'pt';

      CREATE TABLE IF NOT EXISTS customer_rating_criteria (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        code VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        title_en VARCHAR(150),
        title_es VARCHAR(150),
        display_order INT DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_criteria_tenant ON customer_rating_criteria(tenant_id, active);

      CREATE TABLE IF NOT EXISTS store_interface_translations (
        tenant_id UUID NOT NULL,
        language VARCHAR(10) NOT NULL,
        section VARCHAR(50) NOT NULL,
        key VARCHAR(100) NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        PRIMARY KEY (tenant_id, language, section, key)
      );

      CREATE TABLE IF NOT EXISTS store_languages_config (
        tenant_id UUID NOT NULL,
        language_code VARCHAR(10) NOT NULL,
        name VARCHAR(50) NOT NULL,
        flag_emoji VARCHAR(10) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        is_default BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (tenant_id, language_code)
      );
    `);

    // Inserir critérios padrão globais da Franqueadora (tenant_id IS NULL)
    const defaultCriteria = [
      { code: 'QUALITY', pt: 'Qualidade do Açaí & Produtos', en: 'Food & Açaí Quality', es: 'Calidad del Açaí y Productos', order: 1 },
      { code: 'SERVICE', pt: 'Atendimento da Equipa', en: 'Staff & Service', es: 'Atención del Personal', order: 2 },
      { code: 'SPEED', pt: 'Rapidez na Entrega', en: 'Speed of Service', es: 'Rapidez en la Entrega', order: 3 },
      { code: 'CLEANLINESS', pt: 'Ambiente & Limpeza', en: 'Ambiance & Cleanliness', es: 'Ambiente y Limpieza', order: 4 },
    ];

    for (const c of defaultCriteria) {
      const existing = await client.query(
        `SELECT id FROM customer_rating_criteria WHERE tenant_id IS NULL AND code = $1`,
        [c.code]
      );
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO customer_rating_criteria (tenant_id, code, title, title_en, title_es, display_order, active)
           VALUES (NULL, $1, $2, $3, $4, $5, TRUE)`,
          [c.code, c.pt, c.en, c.es, c.order]
        );
      } else {
        await client.query(
          `UPDATE customer_rating_criteria 
           SET title = $2, title_en = $3, title_es = $4, display_order = $5, active = TRUE
           WHERE id = $1`,
          [existing.rows[0].id, c.pt, c.en, c.es, c.order]
        );
      }
    }

    // 3. Atualizar Produtos Legados (Taças e Potes com Tampa) nas 3 Lojas
    console.log('🥣 Passo 3: Atualizando nomenclaturas canônicas de Taças e Potes...');
    const legacyUpdates = [
      { weight: 250, isItem: false, pt: 'Taça 250gr', en: '250gr Bowl', es: 'Bol 250gr' },
      { weight: 350, isItem: false, pt: 'Taça 350gr', en: '350gr Bowl', es: 'Bol 350gr' },
      { weight: 500, isItem: false, pt: 'Taça 500gr', en: '500gr Bowl', es: 'Bol 500gr' },
      { weight: 750, isItem: false, pt: 'Pote de 750gr (com tampa)', en: '750gr Sharing Tub (with lid)', es: 'Bote de 750gr (con tapa)' },
      { weight: 1000, isItem: false, pt: 'Pote de 1kg (com tampa)', en: '1kg Sharing Tub (with lid)', es: 'Bote de 1kg (con tapa)' },
    ];

    for (const u of legacyUpdates) {
      await client.query(
        `UPDATE product_containers 
         SET name = $1, name_en = $2, name_es = $3 
         WHERE weight_grams = $4 AND product_type = 'CONTAINER'`,
        [u.pt, u.en, u.es, u.weight]
      );
    }

    // Atualizar Somente Creme
    await client.query(`
      UPDATE product_containers 
      SET name = 'Taça 250gr (Somente Creme)', name_en = '250gr Bowl (Cream Only)', name_es = 'Bol 250gr (Solo Crema)'
      WHERE category_id = 'cat-somente-creme' AND weight_grams = 250;

      UPDATE product_containers 
      SET name = 'Taça 350gr (Somente Creme)', name_en = '350gr Bowl (Cream Only)', name_es = 'Bol 350gr (Solo Crema)'
      WHERE category_id = 'cat-somente-creme' AND weight_grams = 350;

      UPDATE product_containers 
      SET name = 'Taça 500gr (Somente Creme)', name_en = '500gr Bowl (Cream Only)', name_es = 'Bol 500gr (Solo Crema)'
      WHERE category_id = 'cat-somente-creme' AND weight_grams = 500;

      UPDATE product_containers 
      SET name = 'Pote de 750gr com tampa (Somente Creme)', name_en = '750gr Tub with lid (Cream Only)', name_es = 'Bote de 750gr con tapa (Solo Crema)'
      WHERE category_id = 'cat-somente-creme' AND weight_grams = 750;

      UPDATE product_containers 
      SET name = 'Pote de 1kg com tampa (Somente Creme)', name_en = '1kg Tub with lid (Cream Only)', name_es = 'Bote de 1kg con tapa (Solo Crema)'
      WHERE category_id = 'cat-somente-creme' AND weight_grams = 1000;
    `);

    // Atualizar Bases com Espanhol
    const basesSpanish = [
      { name: 'Açaí Tradicional', es: 'Açaí Tradicional' },
      { name: 'Açaí Zero Açúcar', es: 'Açaí Sin Azúcar' },
      { name: 'Açaí com Banana', es: 'Açaí con Plátano' },
      { name: 'Açaí com Morango', es: 'Açaí con Fresa' },
      { name: 'Cupuaçu', es: 'Cupuaçu' },
      { name: 'Iogurte Grego', es: 'Yogur Griego' },
      { name: 'Pitaya', es: 'Pitaya' },
      { name: 'Manga', es: 'Mango' },
      { name: 'Maracujá', es: 'Maracuyá' },
      { name: 'Graviola', es: 'Guanábana' },
      { name: 'Tapioca com Coco', es: 'Tapioca con Coco' },
    ];
    for (const b of basesSpanish) {
      await client.query(
        `UPDATE product_bases SET name_es = $1 WHERE name ILIKE $2`,
        [b.es, `%${b.name}%`]
      );
    }

    // 4. Cadastrar os 5 Menus Canônicos
    console.log('📋 Passo 4: Cadastrando os 5 Menus Canônicos...');
    for (const m of MENUS) {
      const existingMenu = await client.query(`SELECT id FROM menus WHERE id = $1`, [m.id]);
      if (existingMenu.rows.length === 0) {
        await client.query(
          `INSERT INTO menus (id, code, name, name_en, name_es, description, description_en, description_es, display_order, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)`,
          [m.id, m.code, m.name, m.name_en, m.name_es, m.description, m.description_en, m.description_es, m.display_order]
        );
      } else {
        await client.query(
          `UPDATE menus 
           SET code = $2, name = $3, name_en = $4, name_es = $5, description = $6, description_en = $7, description_es = $8, display_order = $9, active = TRUE
           WHERE id = $1`,
          [m.id, m.code, m.name, m.name_en, m.name_es, m.description, m.description_en, m.description_es, m.display_order]
        );
      }
    }

    // 5. Cadastrar Categorias
    console.log('📂 Passo 5: Cadastrando Categorias dos novos Menus...');
    for (const cat of NEW_CATEGORIES) {
      const existingCat = await client.query(`SELECT id FROM categories WHERE id = $1`, [cat.id]);
      if (existingCat.rows.length === 0) {
        await client.query(
          `INSERT INTO categories (id, menu_id, slug, name, name_en, name_es, description, description_en, description_es, display_order, default_price, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)`,
          [cat.id, cat.menu_id, cat.slug, cat.name, cat.name_en, cat.name_es, cat.description, cat.description_en, cat.description_es, cat.display_order, cat.default_price]
        );
      } else {
        await client.query(
          `UPDATE categories 
           SET menu_id = $2, slug = $3, name = $4, name_en = $5, name_es = $6, description = $7, description_en = $8, description_es = $9, display_order = $10, default_price = $11, active = TRUE
           WHERE id = $1`,
          [cat.id, cat.menu_id, cat.slug, cat.name, cat.name_en, cat.name_es, cat.description, cat.description_en, cat.description_es, cat.display_order, cat.default_price]
        );
      }
    }

    // 6. Cadastrar os Novos Produtos para as 3 Lojas Canônicas
    console.log('🛍️ Passo 6: Cadastrando novos produtos para Figueira da Foz, Torres Novas e Aveiro...');
    let insertedCount = 0;
    let updatedCount = 0;

    for (const tenantId of CANONICAL_TENANTS) {
      for (const prod of NEW_PRODUCTS) {
        const prodUuid = strToUuid(`${prod.id}-${tenantId}`);
        const existingProd = await client.query(
          `SELECT id FROM product_containers WHERE id = $1 OR (tenant_id = $2 AND code = $3)`,
          [prodUuid, tenantId, prod.id]
        );

        const optionGroupsJson = JSON.stringify(prod.option_groups || []);

        if (existingProd.rows.length === 0) {
          await client.query(
            `INSERT INTO product_containers (
              id, tenant_id, code, category_id, name, name_en, name_es,
              description, description_en, description_es, preco_base,
              weight_grams, option_groups, product_type, video_poster, active, display_order
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, $10, $11,
              $12, $13::jsonb, $14, $15, TRUE, 10
            )`,
            [
              prodUuid,
              tenantId,
              prod.id,
              prod.category_id,
              prod.name,
              prod.name_en,
              prod.name_es,
              prod.description,
              prod.description_en,
              prod.description_es,
              prod.preco_base,
              prod.weight_grams,
              optionGroupsJson,
              prod.product_type,
              prod.video_poster || null,
            ]
          );
          insertedCount++;
        } else {
          await client.query(
            `UPDATE product_containers 
             SET name = $3, name_en = $4, name_es = $5,
                 description = $6, description_en = $7, description_es = $8,
                 preco_base = $9, weight_grams = $10, option_groups = $11::jsonb,
                 category_id = $12, product_type = $13, active = TRUE,
                 video_poster = COALESCE($14, video_poster)
             WHERE id = $1 AND tenant_id = $2`,
            [
              existingProd.rows[0].id,
              tenantId,
              prod.name,
              prod.name_en,
              prod.name_es,
              prod.description,
              prod.description_en,
              prod.description_es,
              prod.preco_base,
              prod.weight_grams,
              optionGroupsJson,
              prod.category_id,
              prod.product_type,
              prod.video_poster || null,
            ]
          );
          updatedCount++;
        }
      }
    }

    console.log(`✨ Produtos processados: ${insertedCount} novos inseridos, ${updatedCount} atualizados.`);

    // 7. Configuração de Idiomas da Rede
    console.log('🌐 Passo 7: Configurando idiomas da rede...');
    const languages = [
      { code: 'pt', name: 'Português', flag: '🇵🇹', is_default: true },
      { code: 'en', name: 'English', flag: '🇺🇸', is_default: false },
      { code: 'es', name: 'Español', flag: '🇪🇸', is_default: false },
    ];

    for (const tenantId of CANONICAL_TENANTS) {
      for (const lang of languages) {
        await client.query(
          `INSERT INTO store_languages_config (tenant_id, language_code, name, flag_emoji, is_active, is_default)
           VALUES ($1, $2, $3, $4, TRUE, $5)
           ON CONFLICT (tenant_id, language_code) 
           DO UPDATE SET name = $3, flag_emoji = $4, is_active = TRUE, is_default = $5`,
          [tenantId, lang.code, lang.name, lang.flag, lang.is_default]
        );
      }
    }

    // 8. Invalidação de Cache com Bump de Versão
    console.log('🔄 Passo 8: Bumping store_catalog_versions...');
    await client.query(`
      UPDATE store_catalog_versions 
      SET version = version + 1, published_at = NOW(), updated_at = NOW();
    `);

    await client.query('COMMIT');
    console.log('✅ Migração do Catálogo e Banco de Dados concluída com SUCESSO TOTAL!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ ERRO na migração:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
