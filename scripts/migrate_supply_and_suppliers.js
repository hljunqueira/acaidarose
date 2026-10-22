const path = require('path');
const { Pool } = require(path.join(process.cwd(), 'node_modules', 'pg'));
const pool = new Pool({ connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL });

async function migrate() {
  console.log('--- Iniciando Migração de Estoque, Categorias e Fornecedores ---');

  // 1. Alterar tabela supply_orders para incluir shipping_fee
  console.log('1. Verificando coluna shipping_fee em supply_orders...');
  await pool.query(`
    ALTER TABLE supply_orders 
    ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10,2) DEFAULT 0;
  `);
  console.log('✓ Coluna shipping_fee verificada/adicionada em supply_orders.');

  // 2. Atualizar categorias: excluir cat-fruta e inserir cat-graficos
  console.log('2. Atualizando categorias de estoque...');
  await pool.query(`DELETE FROM inventory_categories WHERE id = 'cat-fruta' OR code = 'FRUTA'`);
  
  await pool.query(`
    INSERT INTO inventory_categories (id, name, code, display_order)
    VALUES ('cat-graficos', 'Produtos Gráficos & Merchandising', 'GRAFICOS', 7)
    ON CONFLICT (id) DO UPDATE 
    SET name = 'Produtos Gráficos & Merchandising', code = 'GRAFICOS', display_order = 7;
  `);
  console.log('✓ Categoria "Frutas Frescas" removida e "Produtos Gráficos & Merchandising" cadastrada.');

  // 3. Cadastrar os 10 fornecedores oficiais da Franqueadora
  console.log('3. Cadastrando os 10 fornecedores oficiais...');
  const suppliersList = [
    {
      name: 'Açaí Amazon Berry S.L.',
      category: 'BASE',
      email: 'comercial@amazonberry.es',
      phone: '+34 910 000 111',
      leadTimeDays: 4,
    },
    {
      name: 'Friends Açaí',
      category: 'BASE',
      email: 'pedidos@friendsacai.com',
      phone: '+351 912 345 678',
      leadTimeDays: 3,
    },
    {
      name: 'Pedaços do Brasil (paçoca)',
      category: 'TOPPING',
      email: 'vendas@pedacosdobrasil.pt',
      phone: '+351 210 123 456',
      leadTimeDays: 2,
    },
    {
      name: 'CJS Embalagens (colher)',
      category: 'DESCARTAVEL',
      email: 'contato@cjsembalagens.pt',
      phone: '+351 220 234 567',
      leadTimeDays: 3,
    },
    {
      name: 'Ecopak Embalagens (copos)',
      category: 'EMBALAGEM',
      email: 'suporte@ecopak.pt',
      phone: '+351 234 345 678',
      leadTimeDays: 3,
    },
    {
      name: 'Monouso Embalagens (cx 750/1000)',
      category: 'EMBALAGEM',
      email: 'encomendas@monouso.pt',
      phone: '+351 211 456 789',
      leadTimeDays: 3,
    },
    {
      name: 'Aviludo (Leite em pó e mini Smartis)',
      category: 'BASE',
      email: 'apoio.cliente@aviludo.pt',
      phone: '+351 289 890 000',
      leadTimeDays: 2,
    },
    {
      name: 'Gelcentro (manteiga de amendoim)',
      category: 'CALDA',
      email: 'geral@gelcentro.pt',
      phone: '+351 232 456 789',
      leadTimeDays: 2,
    },
    {
      name: 'Makro (leite em pó, mini Smartis)',
      category: 'TOPPING',
      email: 'cliente@makro.pt',
      phone: '+351 210 000 222',
      leadTimeDays: 1,
    },
    {
      name: 'Recheio Cash & Carry SA (Nutella)',
      category: 'CALDA',
      email: 'atendimento@recheio.pt',
      phone: '+351 217 500 000',
      leadTimeDays: 1,
    },
  ];

  for (const s of suppliersList) {
    // Verificar se já existe fornecedor com mesmo nome aproximado
    const check = await pool.query('SELECT id FROM suppliers WHERE LOWER(name) = LOWER($1)', [s.name]);
    if (check.rows.length === 0) {
      await pool.query(
        `INSERT INTO suppliers (name, category, email, phone, lead_time_days, is_active)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [s.name, s.category, s.email, s.phone, s.leadTimeDays]
      );
      console.log(`+ Inserido fornecedor: ${s.name}`);
    } else {
      console.log(`= Fornecedor já existente: ${s.name}`);
    }
  }

  const allSuppliers = await pool.query('SELECT name, category FROM suppliers ORDER BY name');
  console.log(`Total de fornecedores ativos agora: ${allSuppliers.rows.length}`);

  const allCategories = await pool.query('SELECT name, code FROM inventory_categories ORDER BY display_order');
  console.log('Categorias ativas:', allCategories.rows);

  await pool.end();
  console.log('--- Migração concluída com sucesso! ---');
}

migrate().catch((err) => {
  console.error('Falha na migração:', err);
  pool.end();
  process.exit(1);
});
