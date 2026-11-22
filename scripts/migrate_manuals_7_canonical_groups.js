const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrateManualsTo7CanonicalGroups() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    console.error('DATABASE_URL não configurada.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  console.log('--- Migração da Central de Ajuda: 7 Grupos Canónicos do Menu Lateral ---');

  try {
    // 1. Definição das 7 Categorias Canónicas (Espelhando 100% os 7 Grupos do Sidebar)
    const canonicalCategories = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        title: 'Franqueadora Master',
        slug: 'franqueadora-master',
        description: 'Painel mestre da Franqueadora para governança de lojas, apuração de royalties, candidaturas de expansão e deliberação de solicitações da rede.',
        orderIndex: 1,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        title: 'Analytics',
        slug: 'analytics',
        description: 'Métricas de desempenho em tempo real: faturamento, ticket médio, evolução de volume, ranking de produtos e vendas de opcionais.',
        orderIndex: 2,
        targetRoles: ['TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        title: 'Operação & Atendimento',
        slug: 'operacao-e-atendimento',
        description: 'Rotina operacional diária: montagem de copos e taças no PDV balcão, comandas de mesas, pagamentos, fila KDS de cozinha e histórico de pedidos.',
        orderIndex: 3,
        targetRoles: ['CASHIER', 'TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        title: 'Cardápio, Mídias & Preços',
        slug: 'cardapio-midias-e-precos',
        description: 'Padronização visual e de montagem do cardápio: gestão de produtos, categorias, menus, destaques/stories, gestão de idiomas e modelos de opções.',
        orderIndex: 4,
        targetRoles: ['TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        title: 'Gestão de Estoque & Supply Chain',
        slug: 'gestao-de-estoque-e-supply-chain',
        description: 'Auditoria de mercadorias, contagem física local, reposição com a Matriz B2B, catálogo mestre homologado e expedição de pedidos da rede.',
        orderIndex: 5,
        targetRoles: ['CASHIER', 'TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        id: '10000000-0000-0000-0000-000000000006',
        title: 'Feedbacks & Avaliações',
        slug: 'feedbacks-e-avaliacoes',
        description: 'Monitoramento do índice de satisfação NPS, avaliações dos clientes recebidas via QR Code das mesas e critérios de qualidade.',
        orderIndex: 6,
        targetRoles: ['TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        id: '10000000-0000-0000-0000-000000000007',
        title: 'Configurações da Unidade',
        slug: 'configuracoes-da-unidade',
        description: 'Configurações locais da loja: dados cadastrais/NIF, painel de chamadas Smart TV, cartões QR Code de mesas, impressoras térmicas e equipa.',
        orderIndex: 7,
        targetRoles: ['TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      },
    ];

    console.log('1. Inserindo / Atualizando as 7 Categorias Canónicas...');
    for (const cat of canonicalCategories) {
      await pool.query(
        `INSERT INTO manual_categories (id, title, slug, description, order_index, target_roles, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE
         SET title = EXCLUDED.title,
             slug = EXCLUDED.slug,
             description = EXCLUDED.description,
             order_index = EXCLUDED.order_index,
             target_roles = EXCLUDED.target_roles,
             updated_at = NOW()`,
        [cat.id, cat.title, cat.slug, cat.description, cat.orderIndex, cat.targetRoles]
      );
    }

    // 2. Mapeamento de Artigos para as 7 Categorias
    // Grupo 1: Franqueadora Master (Cat 1)
    await pool.query(`
      UPDATE manual_articles 
      SET category_id = '10000000-0000-0000-0000-000000000001',
          target_roles = ARRAY['FRANCHISOR_ADMIN', 'SUPER_ADMIN']
      WHERE id IN (
        '20000000-0000-0000-0000-000000000001', -- Gestão da Rede & Lojas
        '20000000-0000-0000-0000-000000000002', -- Candidaturas de Franquia
        '20000000-0000-0000-0000-000000000003'  -- Solicitações das Lojas
      )
    `);

    // Grupo 2: Analytics (Cat 2)
    await pool.query(`
      UPDATE manual_articles 
      SET category_id = '10000000-0000-0000-0000-000000000002',
          target_roles = ARRAY['TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN']
      WHERE id IN (
        '20000000-0000-0000-0000-000000000011', -- Visão Geral (Receita, Ticket Médio & Volume)
        '20000000-0000-0000-0000-000000000012', -- Vendas de Produtos
        '20000000-0000-0000-0000-000000000013', -- Vendas de Opcionais
        '20000000-0000-0000-0000-000000000014'  -- Visão Geral da Loja
      )
    `);

    // Grupo 3: Operação & Atendimento (Cat 3)
    await pool.query(`
      UPDATE manual_articles 
      SET category_id = '10000000-0000-0000-0000-000000000003',
          target_roles = ARRAY['CASHIER', 'TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN']
      WHERE id IN (
        '20000000-0000-0000-0000-000000000025', -- PDV Balcão & Mesas (Montagem de Copos & Taças)
        '20000000-0000-0000-0000-000000000026', -- PDV Balcão: Pagamentos & Emissão de Talão
        '20000000-0000-0000-0000-000000000027', -- Pedidos & KDS Cozinha (Fila em Tempo Real)
        '20000000-0000-0000-0000-000000000028', -- Histórico de Pedidos (Auditoria & Filtro por Data)
        '20000000-0000-0000-0000-000000000029', -- Gestão de Mesas (Salão & Comandas)
        '20000000-0000-0000-0000-000000000033'  -- Relatórios de Vendas & Fecho de Caixa Diário
      )
    `);

    // Grupo 4: Cardápio, Mídias & Preços (Cat 4)
    await pool.query(`
      UPDATE manual_articles 
      SET category_id = '10000000-0000-0000-0000-000000000004',
          target_roles = ARRAY['TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN']
      WHERE id IN (
        '20000000-0000-0000-0000-000000000006', -- Como Adicionar e Gerir Produtos no Cardápio
        '20000000-0000-0000-0000-000000000007', -- Categorias do Cardápio (Organização de Itens)
        '20000000-0000-0000-0000-000000000008', -- Menus Principais do Cardápio
        '20000000-0000-0000-0000-000000000009', -- Destaques & Stories do Cardápio
        '20000000-0000-0000-0000-000000000010', -- Gestão de Idiomas (Português, Inglês e Espanhol)
        '20000000-0000-0000-0000-000000000030', -- Opcionais & Modelos de Montagem
        '20000000-0000-0000-0000-000000000031'  -- Horários de Disponibilidade do Cardápio
      )
    `);

    // Grupo 5: Gestão de Estoque & Supply Chain (Cat 5)
    await pool.query(`
      UPDATE manual_articles 
      SET category_id = '10000000-0000-0000-0000-000000000005',
          target_roles = ARRAY['CASHIER', 'TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN']
      WHERE id IN (
        '20000000-0000-0000-0000-000000000015', -- Gestão de Estoque Local (Controle Físico & Auditoria)
        '20000000-0000-0000-0000-000000000016', -- Reposição com a Matriz (Pedidos B2B & Entrada de Carga)
        '20000000-0000-0000-0000-000000000017', -- Disponibilidade de Itens no Cardápio Local da Loja
        '20000000-0000-0000-0000-000000000004', -- Catálogo Mestre B2B & Armazém Central
        '20000000-0000-0000-0000-000000000005'  -- Expedição & Atendimento de Pedidos das Franquias
      )
    `);

    // Grupo 6: Feedbacks & Avaliações (Cat 6)
    await pool.query(`
      UPDATE manual_articles 
      SET category_id = '10000000-0000-0000-0000-000000000006',
          target_roles = ARRAY['TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN']
      WHERE id IN (
        '20000000-0000-0000-0000-000000000018'  -- Feedbacks & Satisfação (Pesquisa NPS & Critérios)
      )
    `);

    // Grupo 7: Configurações da Unidade (Cat 7)
    await pool.query(`
      UPDATE manual_articles 
      SET category_id = '10000000-0000-0000-0000-000000000007',
          target_roles = ARRAY['TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN']
      WHERE id IN (
        '20000000-0000-0000-0000-000000000019', -- Dados da Loja (NIF, Morada & Horários)
        '20000000-0000-0000-0000-000000000020', -- Configuração Painel de Senha (Vídeos & Mensagens TV)
        '20000000-0000-0000-0000-000000000021', -- Configurações QR Code (Mesas & Identidade Visual)
        '20000000-0000-0000-0000-000000000022', -- Impressoras Térmicas (Copa, Balcão & Guilhotina)
        '20000000-0000-0000-0000-000000000023', -- Utilizadores & Permissões (Gerentes, Caixas & Acessos)
        '20000000-0000-0000-0000-000000000024', -- Relatórios & Fecho de Caixa (Auditoria Diária de Vendas)
        '20000000-0000-0000-0000-000000000032'  -- Horários de Funcionamento da Loja & Feriados
      )
    `);

    // 3. Remoção do grupo de TI e artigos de TI
    console.log('2. Removendo artigos e categoria de TI (Super Admin)...');
    await pool.query(`DELETE FROM manual_articles WHERE category_id = '10000000-0000-0000-0000-000000000010' OR id = '20000000-0000-0000-0000-000000000034'`);
    await pool.query(`DELETE FROM manual_categories WHERE id = '10000000-0000-0000-0000-000000000010' OR slug = 'central-master-ti-e-infraestrutura'`);

    // Remover categorias antigas órfãs se existirem (ex: 8 e 9 que foram consolidadas)
    await pool.query(`
      DELETE FROM manual_categories 
      WHERE id NOT IN (
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000005',
        '10000000-0000-0000-0000-000000000006',
        '10000000-0000-0000-0000-000000000007'
      )
    `);

    // 4. Limpeza de emojis dos títulos das etapas dos artigos
    console.log('3. Limpando emojis dos títulos de passos nos artigos...');
    const allArts = await pool.query('SELECT id, steps FROM manual_articles');
    for (const art of allArts.rows) {
      if (Array.isArray(art.steps)) {
        let changed = false;
        const cleanedSteps = art.steps.map(s => {
          if (s.title) {
            const cleanTitle = s.title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
            if (cleanTitle !== s.title) {
              changed = true;
              return { ...s, title: cleanTitle };
            }
          }
          return s;
        });
        if (changed) {
          await pool.query('UPDATE manual_articles SET steps = $1 WHERE id = $2', [JSON.stringify(cleanedSteps), art.id]);
        }
      }
    }

    // 5. Ajuste de order_index para garantir ordenação limpa por categoria
    console.log('4. Reindexando order_index dos artigos por categoria...');
    const catList = canonicalCategories.map(c => c.id);
    for (const catId of catList) {
      const catArts = await pool.query('SELECT id FROM manual_articles WHERE category_id = $1 ORDER BY order_index, title', [catId]);
      for (let i = 0; i < catArts.rows.length; i++) {
        await pool.query('UPDATE manual_articles SET order_index = $1 WHERE id = $2', [i + 1, catArts.rows[i].id]);
      }
    }

    console.log('✅ Migração das categorias e artigos concluída com sucesso!');
    const finalCats = await pool.query('SELECT id, title, order_index, (SELECT count(*) FROM manual_articles WHERE category_id = c.id) as art_count FROM manual_categories c ORDER BY order_index');
    console.table(finalCats.rows);

  } catch (err) {
    console.error('Erro na migração:', err);
  } finally {
    await pool.end();
  }
}

migrateManualsTo7CanonicalGroups();
