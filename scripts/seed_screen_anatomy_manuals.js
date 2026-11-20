const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function seedScreenAnatomyManuals() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL
  if (!connectionString) {
    console.error('DATABASE_URL não configurada.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })

  console.log('--- Iniciando Sincronização do Dicionário de Telas e Componentes (Screen Anatomy) ---')

  try {
    // 1. Categorias canónicas separadas por Franqueadora e Franquia
    const categories = [
      // FRANQUEADORA MASTER
      {
        id: '10000000-0000-0000-0000-000000000001',
        title: 'Franqueadora: Gestão da Rede & Expansão',
        slug: 'franqueadora-gestao-da-rede-e-expansao',
        description: 'Governança das unidades franqueadas, contratos de royalties, triagem de candidaturas de expansão e deliberação de solicitações.',
        orderIndex: 1,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        title: 'Franqueadora: Central B2B & Supply Chain',
        slug: 'franqueadora-central-b2b-e-supply-chain',
        description: 'Catálogo corporativo homologado, armazém central, segregação fiscal de IVA e expedição de pedidos para as franquias.',
        orderIndex: 2,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        title: 'Franqueadora: Cardápio Oficial & Padrão de Marca',
        slug: 'franqueadora-cardapio-oficial-e-padrao-de-marca',
        description: 'Padronização visual e de montagem do cardápio: regras de recipientes, precificação padrão, categorias, seções de menu e traduções.',
        orderIndex: 3,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        title: 'Franqueadora: Analytics Consolidado da Rede',
        slug: 'franqueadora-analytics-consolidado-da-rede',
        description: 'Métricas de faturamento global da rede, ranking de vendas de produtos e análise de acompanhamentos em todas as lojas.',
        orderIndex: 4,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
      },

      // FRANQUIAS & UNIDADES
      {
        id: '10000000-0000-0000-0000-000000000005',
        title: 'Franquias: Indicadores & Desempenho Local',
        slug: 'franquias-indicadores-e-desempenho-local',
        description: 'Monitoramento diário de receita, evolução do ticket médio, horários de pico e mix de vendas da sua unidade.',
        orderIndex: 5,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
      },
      {
        id: '10000000-0000-0000-0000-000000000006',
        title: 'Franquias: Gestão de Estoque & Reposição B2B',
        slug: 'franquias-gestao-de-estoque-e-reposicao-b2b',
        description: 'Auditoria física de mercadorias, pedidos de reposição com a Matriz e controle de disponibilidade local de produtos.',
        orderIndex: 6,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
      },
      {
        id: '10000000-0000-0000-0000-000000000007',
        title: 'Franquias: Qualidade & Feedbacks de Clientes',
        slug: 'franquias-qualidade-e-feedbacks-de-clientes',
        description: 'Acompanhamento do índice de satisfação NPS, avaliações dos clientes via QR Code e critérios de qualidade.',
        orderIndex: 7,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
      },
      {
        id: '10000000-0000-0000-0000-000000000008',
        title: 'Franquias: Hardware, Salão & Configurações da Loja',
        slug: 'franquias-hardware-salao-e-configuracoes-da-loja',
        description: 'Impressoras térmicas de copa e balcão, Smart TV de senhas, cartões QR de mesa, equipa e fecho diário de caixa.',
        orderIndex: 8,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
      },

      // OPERAÇÃO & CAIXA
      {
        id: '10000000-0000-0000-0000-000000000009',
        title: 'Operação de Caixa & Salão',
        slug: 'operacao-de-caixa-e-salao',
        description: 'Operação diária do terminal de PDV, montagem de copos e taças, meios de pagamento em Portugal e fila KDS.',
        orderIndex: 9,
        targetRoles: ['CASHIER', 'TENANT_ADMIN', 'SUPER_ADMIN'],
      },
    ]

    console.log(`Sincronizando ${categories.length} categorias...`)
    for (const cat of categories) {
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
      )
    }

    // 2. Os 29 Manuais das Telas com Anatomia Completa de Componentes (Botões, Cards, Filtros, Modais, Regras e Mídia)
    const articles = [
      // -----------------------------------------------------------------------
      // 1. GESTÃO DA REDE & LOJAS
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000001',
        categoryId: '10000000-0000-0000-0000-000000000001',
        title: 'Gestão da Rede & Lojas (Unidades, Contratos & Royalties)',
        slug: 'gestao-da-rede-e-lojas-unidades-contratos-e-royalties',
        summary: 'Painel mestre da Franqueadora para governança de lojas, faturamento consolidado da rede, apuração de royalties, mapa contábil e novas franquias.',
        readTimeMinutes: 5,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 1,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Botões de Topo',
            instruction: 'A barra superior da tela reúne os botões centrais de controle da rede:\n\n• [ Atualizar ]: Recarrega os dados em tempo real diretamente do banco PostgreSQL, atualizando os valores de faturamento e status de conexão das lojas sem precisar de refresh no navegador.\n• [ Gerir Cobranças & Taxas ]: Abre o modal de configuração de cobranças mensais, permitindo ajustar alíquotas de royalties (%), taxa de licença de software e taxas customizadas por unidade.\n• [ Mapa Contábil ]: Gera o relatório contábil unificado contendo NIF, Razão Social, faturamento bruto e deduções de todas as lojas, formatado para exportação e envio ao contabilista certificado (TOC).\n• [ Nova Franquia ]: Abre o formulário completo de admissão de uma nova unidade franqueada na rede.',
            routePath: '/franchise',
            calloutType: 'INFO',
            calloutMessage: 'O botão Atualizar deve ser utilizado após cadastrar novas unidades para atualizar a barra de filtros.',
            media: null,
          },
          {
            stepNumber: 2,
            title: '📊 Cards de Indicadores & Métricas (KPIs)',
            instruction: 'Os 4 cartões no topo da página detalham a performance consolidada da rede:\n\n• Card Faturamento da Rede (Mês): Soma total em Euros (€) de todos os pedidos finalizados em todas as lojas ativas no mês corrente. Abaixo exibe a contagem total de pedidos realizados.\n• Card Royalties & Licença de Sistema: Valor total em Euros (€) a ser recebido pela Franqueadora no mês, calculado automaticamente com base nas alíquotas contratuais vigentes.\n• Card Fundo de Marketing: Total arrecadado conforme o percentual contratual para investimento em anúncios institucionais, redes sociais e campanhas nacionais de fortalecimento da marca.\n• Card Equipa da Rede: Quantidade total de colaboradores e gestores cadastrados nas lojas ativas da rede.',
            routePath: '/franchise',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 3,
            title: '🔍 Barra de Abas & Filtros por Loja',
            instruction: 'Abaixo dos cards de KPIs, a barra de abas permite alternar o escopo de análise:\n\n• Aba [ Todas as Unidades (3) ]: Panorama geral exibindo os cartões de todas as unidades da rede.\n• Aba [ Loja 1 - Figueira da Foz (Matriz) ]: Isola a visão e detalha os indicadores específicos da unidade matriz.\n• Aba [ Loja 2 - Torres Novas (Filial 1) ]: Filtra exclusivamente a operação da filial própria.\n• Aba [ Loja 3 - Aveiro (Franquia) ]: Filtra a unidade franqueada, permitindo auditar o faturamento local e o volume de comandas.\n\nNovas lojas cadastradas na Franqueadora surgem automaticamente nesta barra sem nenhuma configuração manual extra.',
            routePath: '/franchise',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 4,
            title: '📋 Cards de Unidades & Links Operacionais',
            instruction: 'Cada loja cadastrada possui um card exclusivo contendo:\n\n• Cabeçalho da Unidade: Razão Social, Nome Fantasia, slug e crachá de identificação (Matriz HQ, Filial Própria ou Franquia).\n• Faturação Hoje: Valor em Euros faturado pela loja na data corrente.\n• Comandas / MB WAY: Total de comandas atendidas no dia e percentual liquidado por meios digitais.\n• Links Operacionais da Unidade: Atalhos diretos para inspecionar o cardápio local da loja, estoque físico e configurações de hardware.',
            routePath: '/franchise',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 5,
            title: '🗂️ Modais da Tela & Regras de Negócio',
            instruction: 'Modais que disparam a partir desta tela:\n\n• Modal Nova Franquia: Exige Nome Fantasia, Razão Social, NIF português válido (9 dígitos), morada com código postal, percentual contratual de royalties e a vinculação do utilizador administrador (TENANT_ADMIN).\n• Modal Gerir Cobranças: Permite fixar o dia de vencimento mensal e definir se a cobrança é percentual sobre o faturamento bruto ou taxa fixa.\n• Modal Mapa Contábil: Seleção do mês/ano de competência e download dos dados fiscais.',
            routePath: '/franchise',
            calloutType: 'ALERT',
            calloutMessage: 'O NIF da loja em Portugal é mandatório para permitir emissão de talões fiscais e relatórios do TOC.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 2. CANDIDATURAS DE FRANQUIA
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000002',
        categoryId: '10000000-0000-0000-0000-000000000001',
        title: 'Candidaturas de Franquia (Leads do Site & Expansão)',
        slug: 'candidaturas-de-franquia-leads-do-site-e-expansao',
        summary: 'Triagem, análise de qualificação financeira e pipeline de expansão para interessados em abrir uma franquia Açaí da Rose.',
        readTimeMinutes: 4,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 2,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Botões de Topo',
            instruction: 'Ações disponíveis no topo do funil de candidaturas:\n\n• [ Atualizar Fila ]: Consulta instantaneamente novos formulários submetidos no site institucional (página "Seja um Franqueado").\n• [ Exportar Leads CSV ]: Faz o download da listagem de todos os interessados com nome, telemóvel, e-mail e capital para análise no Excel.\n• [ Filtro de Status ]: Permite isolar os leads entre "Pendente", "Em Análise", "Reunião Agendada", "Aprovado" ou "Não Elegível".',
            routePath: '/franchise_candidates',
            calloutType: 'INFO',
            calloutMessage: 'O crachá amarelo no menu lateral sinaliza o número de novas candidaturas pendentes de primeiro contato.',
            media: null,
          },
          {
            stepNumber: 2,
            title: '📊 Cards de Métricas do Funil de Expansão',
            instruction: 'Os cards mostram a conversão do pipeline de candidatos:\n\n• Total de Leads Recebidos: Quantidade acumulada de interessados capturados.\n• Em Análise / Reunião: Candidatos qualificados que estão em fase de entrevista com os diretores de expansão.\n• Candidaturas Aprovadas: Franqueados validados prontos para assinatura de contrato e escolha de ponto comercial.\n• Não Elegíveis: Candidatos sem perfil ou capital mínimo disponível.',
            routePath: '/franchise_candidates',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 3,
            title: '📋 Tabela de Candidatos & Modal de Dossiê',
            instruction: 'Ao clicar em qualquer linha da tabela de candidatos, o Modal do Dossiê exibe:\n\n• Dados Pessoais: Nome completo, contacto telefónico, endereço de e-mail e cidade de Portugal pretendida.\n• Capacidade de Investimento: Faixa de capital disponível declarado pelo candidato.\n• Histórico & Anotações Internas: Campo de texto livre para registrar resumo de reuniões, impressões da diretoria e próximos passos.\n• Botão Salvar Status: Atualiza o estado do candidato e envia e-mail de notificação caso configurado.',
            routePath: '/franchise_candidates',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 3. SOLICITAÇÕES DAS LOJAS
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000003',
        categoryId: '10000000-0000-0000-0000-000000000001',
        title: 'Solicitações das Lojas (Preços, Produtos & Destaques)',
        slug: 'solicitacoes-das-lojas-precos-produtos-e-destaques',
        summary: 'Canal oficial de governança onde a Franqueadora avalia, aprova ou recusa pedidos de exceção comercial solicitados pelas franquias.',
        readTimeMinutes: 4,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 3,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Botões de Topo',
            instruction: 'Controles superiores da fila de deliberação:\n\n• [ Atualizar Fila ]: Recarrega as solicitações enviadas pelas gerências das franquias.\n• [ Filtrar por Loja ]: Isola apenas os pedidos de uma unidade específica (ex: Aveiro ou Torres Novas).\n• [ Filtrar por Categoria ]: Separa solicitações de "Ajuste de Preço Local", "Criação de Produto Específico" ou "Campanha Local".',
            routePath: '/franchise_requests',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 2,
            title: '📋 Tabela de Solicitações & Modal de Deliberação',
            instruction: 'Cada solicitação enviada por uma loja apresenta:\n\n• Dados da Solicitação: Loja solicitante, tipo de pedido, justificativa do franqueado e data de submissão.\n• Modal de Deliberação: Ao clicar em "Avaliar", o diretor da Franqueadora pode:\n  - Inserir Parecer Técnico: Justificativa formal da decisão.\n  - Clicar em [ Aprovar Solicitação ]: O sistema aplica automaticamente a permissão à loja solicitante.\n  - Clicar em [ Recusar Solicitação ]: Envia a negativa fundamentada para a gerência da unidade.',
            routePath: '/franchise_requests',
            calloutType: 'ALERT',
            calloutMessage: 'Preços de produtos centrais homologados não devem ser alterados pelas franquias sem autorização expressa.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 4. CATÁLOGO MESTRE B2B & ARMAZÉM CENTRAL
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000004',
        categoryId: '10000000-0000-0000-0000-000000000002',
        title: 'Catálogo Mestre B2B & Armazém Central',
        slug: 'catalogo-mestre-b2b-e-armazem-central',
        summary: 'Gestão dos insumos homologados, armazém central da Matriz, preços de venda B2B com IVA discriminado e estoque regulador.',
        readTimeMinutes: 5,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 1,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Botões de Topo',
            instruction: 'Comandos disponíveis no armazém central B2B:\n\n• [ Novo Insumo ]: Cadastra um insumo oficial homologado (ex.: Polpa de Açaí 10kg, Granola Crocante 5kg, Embalagens Açaí da Rose).\n• [ Entrada de Mercadoria ]: Dá entrada física de estoque de compras realizadas com fornecedores industriais.\n• [ Ajuste de Saldo ]: Permite regularizar o saldo do galpão central após contagem de inventário físico.\n• [ Tabela de Preços B2B ]: Exporta a tabela com Preço Líquido (s/ IVA) e Preço com IVA para as franquias.',
            routePath: '/franchise_inventory',
            calloutType: 'INFO',
            calloutMessage: 'Todos os insumos homologados aqui ficam automaticamente visíveis para as franquias fazerem pedidos de reposição.',
            media: null,
          },
          {
            stepNumber: 2,
            title: '📊 Cards de Métricas do Armazém Central',
            instruction: 'Indicadores financeiros e operacionais do armazém da Matriz:\n\n• Total de Insumos Ativos: Número de produtos homologados no catálogo B2B.\n• Valor em Estoque Central: Montante financeiro total avaliado a preço de custo.\n• Insumos em Alerta Mínimo: Produtos cujo saldo no galpão atingiu o estoque de segurança.\n• Cargas Despachadas no Mês: Volume total em kg/unidades expedidas para a rede.',
            routePath: '/franchise_inventory',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 3,
            title: '🗂️ Modal de Cadastro de Insumo & Segregação Fiscal (IVA)',
            instruction: 'No Modal de Novo Insumo, preencha rigorosamente:\n\n• Nome e Código SKU: Identificação canónica do produto.\n• Unidade de Medida: Quilogramas (kg), Litros (L), Caixas ou Unidades.\n• Preço Líquido de Fornecedor: Custo de compra sem impostos.\n• Preço de Venda B2B: Valor que a Franqueadora cobra da franquia.\n• Taxa de IVA de Portugal: Selecione a taxa legal aplicável (6% reduzida, 13% intermediária ou 23% normal). O sistema calcula o Preço c/ IVA automaticamente.',
            routePath: '/franchise_inventory',
            calloutType: 'ALERT',
            calloutMessage: 'A segregação do IVA em Portugal é mandatória em todas as operações de venda da Matriz para as Franquias.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 5. EXPEDIÇÃO & PEDIDOS DAS FRANQUIAS
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000005',
        categoryId: '10000000-0000-0000-0000-000000000002',
        title: 'Expedição & Atendimento de Pedidos das Franquias',
        slug: 'expedicao-e-atendimento-de-pedidos-das-franquias',
        summary: 'Fila de pedidos de suprimentos feitos pelas lojas, conferência de romaneio de carga, autorização e baixa no armazém central.',
        readTimeMinutes: 4,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 2,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Botões de Topo',
            instruction: 'Ações de expedição de pedidos:\n\n• [ Atualizar Fila ]: Recarrega as solicitações de reposição enviadas pelas franquias.\n• [ Imprimir Romaneio de Separação ]: Gera a guia física com a lista de itens e caixas para os operadores do galpão separarem a carga.\n• [ Filtro por Estado ]: Alterna entre "Pendente", "Em Separação", "Despachado / Em Trânsito" e "Entregue".',
            routePath: '/franchise_orders',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 2,
            title: '📋 Fila de Pedidos & Avanço de Status',
            instruction: 'Fluxo oficial de atendimento de um pedido de suprimento:\n\n1. O pedido entra com status "Pendente" quando a loja finaliza o carrinho de suprimentos.\n2. Ao iniciar a separação, clique em [ Marcar Em Separação ].\n3. Após conferência dos itens, clique em [ Despachar Carga ]: O sistema dá baixa imediata no saldo do Armazém Central e emite o número de rastreio/guia de transporte.\n4. Quando o franqueado confirma o recebimento na loja, o status avança para "Concluído".',
            routePath: '/franchise_orders',
            calloutType: 'INFO',
            calloutMessage: 'A baixa no estoque do Armazém Central ocorre no exato momento em que o pedido é marcado como Despachado.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 6. PRODUTOS DO CARDÁPIO (REGRAS DE RECIPIENTES)
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000006',
        categoryId: '10000000-0000-0000-0000-000000000003',
        title: 'Produtos do Cardápio (Regras de Recipientes & Montagem)',
        slug: 'produtos-do-cardapio-regras-de-recipientes-e-montagem',
        summary: 'Catálogo de recipientes oficiais de açaí, regras canónicas de bases inclusas, cotas de frutas e adicionais em Euros (€).',
        readTimeMinutes: 5,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 1,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Botões de Topo',
            instruction: 'Ações na gestão de produtos do cardápio:\n\n• [ Novo Produto ]: Cadastra um novo recipiente ou item de pastelaria/bebidas.\n• [ Reordenar Produtos ]: Permite arrastar os cards para definir a ordem em que aparecem no cardápio digital e no PDV.\n• [ Pausar na Rede ]: Pausa a venda de um item globalmente em todas as lojas da marca.\n• [ Filtro por Categoria ]: Isola produtos por recipientes de açaí, lanches ou bebidas.',
            routePath: '/menu',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 2,
            title: '⚠️ Regra de Ouro dos Recipientes (Glossário PT-PT Mandatório)',
            instruction: 'A marca Açaí da Rose adota nomenclatura rigorosa que não pode ser violada:\n\n• Copos (250g, 350g, 500g): Obrigatoriamente denominados Copo (Copo 250gr, Copo 350gr, Copo 500gr). É estritamente proibido usar a palavra "taça" para esses tamanhos.\n• Taça vs Caixinha Plástica (750g e 1kg): Os únicos servidos em Taça são o Sensação (750g) e o Família (1kg) exclusivamente para consumo dentro da loja física. Para takeaway / levar para casa, é servido em Caixinha Plástica.\n• Regra de Bases & Cremes: Em todos os recipientes, o cliente tem até 2 opções inclusas (Açaí + 1 creme, ou 2 cremes sem açaí, ou 1 base). A partir da 3ª opção, soma adicional de +2,00 € por item.\n• Frutas e Acompanhamentos: A partir de 500g (500g, 750g e 1kg), frutas e acompanhamentos tradicionais são livres / ilimitados (maxQty: 999).',
            routePath: '/menu',
            calloutType: 'ALERT',
            calloutMessage: 'Nunca utilize a palavra "Complementos"; use sempre "Acompanhamentos". Nunca use "Carrinho", use sempre "Pedido".',
            media: null,
          },
          {
            stepNumber: 3,
            title: '🗂️ Modal de Cadastro de Produto & Mídias',
            instruction: 'Ao cadastrar ou editar um produto no cardápio:\n\n• Nome do Produto: Em conformidade com o padrão da rede.\n• Preço Base (€): Preço oficial com IVA incluído.\n• Upload de Mídias (Vídeo & Imagem): Suporte para vídeo em MP4 (renderizado em loop automático silencioso no cardápio) e imagem poster de fallback.\n• Seletor de Categoria e Menu: Vincula o produto à seção correspondente.',
            routePath: '/menu',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 7. CATEGORIAS DO CARDÁPIO
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000007',
        categoryId: '10000000-0000-0000-0000-000000000003',
        title: 'Categorias (Estruturação Visual do Cardápio)',
        slug: 'categorias-estruturacao-visual-do-cardapio',
        summary: 'Estruturação das categorias de produtos (Copos de Açaí, Taças Gourmet, Acompanhamentos, Salgados, Bebidas).',
        readTimeMinutes: 4,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 2,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Botões de Topo',
            instruction: 'Ações na gestão de categorias:\n\n• [ Nova Categoria ]: Cria um novo agrupador de produtos no catálogo.\n• [ Salvar Ordenação ]: Salva a sequência das abas após arrastar os itens.\n• [ Visualizar no Cardápio ]: Abre o link público do menu digital para conferir a disposição visual.',
            routePath: '/categories',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 2,
            title: '📋 Modal de Cadastro & Estética Minimalista',
            instruction: 'Configurações da categoria:\n\n• Título da Categoria: Nomes claros e corporativos (ex: "Copos de Açaí", "Taças Especiais", "Pastéis e Salgados").\n• Diretriz Anti "Cara de IA": É estritamente proibido usar emojis decorativos (🍨, 🥪, ✨) nos nomes das categorias. A estética é limpa, sofisticada e corporativa.\n• Menu Pai: Associa a categoria à aba mestra ("Açaí da Rose" ou "Lanches").',
            routePath: '/categories',
            calloutType: 'ALERT',
            calloutMessage: 'Mantenha os títulos sem emojis decorativos para preservar o padrão visual corporativo da marca.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 8. MENUS DO CARDÁPIO
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000008',
        categoryId: '10000000-0000-0000-0000-000000000003',
        title: 'Menus do Cardápio (Organização de Seções)',
        slug: 'menus-do-cardapio-organizacao-de-secoes',
        summary: 'Governança das abas principais do topo do cardápio digital (Açaí da Rose e Lanches).',
        readTimeMinutes: 3,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 3,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Nomenclatura Canónica',
            instruction: 'Controle de menus principais da ementa:\n\n• Abas Canónicas Mandatórias: O sistema possui exatamente duas abas principais de topo: "Açaí da Rose" e "Lanches" (em inglês: "Açaí da Rose" e "Snacks").\n• É vedado adicionar sufixos genéricos como "Pastelaria" ou emojis.\n• [ Novo Menu ]: Cadastra seções sazonais autorizadas pela Franqueadora (ex: "Menu de Verão" ou "Edição Especial").',
            routePath: '/menus',
            calloutType: 'INFO',
            calloutMessage: 'As duas abas oficiais atendem 100% da operação do salão e dos QR Codes de mesa.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 9. DESTAQUES & STORIES
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000009',
        categoryId: '10000000-0000-0000-0000-000000000003',
        title: 'Destaques & Stories (Carrossel & Promoções)',
        slug: 'destaques-e-stories-carrossel-e-promocoes',
        summary: 'Configuração do carrossel visual e stories interativos exibidos no topo do cardápio digital do cliente.',
        readTimeMinutes: 4,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 4,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Botões de Topo',
            instruction: 'Ações na gestão de stories:\n\n• [ Novo Destaque ]: Cadastra uma lâmina com banner, título, descrição e link de ação direta.\n• [ Abrangência ]: Define se o destaque é exibido em todas as lojas da rede ou exclusivo para uma loja específica.\n• [ Sincronizar ]: Publica instantaneamente nos cardápios em tempo real via WebSocket.',
            routePath: '/stories',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 2,
            title: '🗂️ Modal de Criação de Story',
            instruction: 'Campos do formulário:\n\n• Imagem / Banner: Proporção recomendada para visualização mobile nos telemóveis dos clientes.\n• Título Promocional: Chamada curta (ex: "Experimente a Nova Taça Sensação").\n• Ação ao Clicar: Redireciona o cliente diretamente para abrir o produto selecionado na tela de montagem.',
            routePath: '/stories',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 10. GESTÃO DE IDIOMAS
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000010',
        categoryId: '10000000-0000-0000-0000-000000000003',
        title: 'Gestão de Idiomas (Traduções PT, EN & ES)',
        slug: 'gestao-de-idiomas-traducoes-pt-en-e-es',
        summary: 'Dicionário multilíngue oficial para turistas e clientes internacionais em Portugal (Português, Inglês e Espanhol).',
        readTimeMinutes: 4,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 5,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Idiomas Homologados',
            instruction: 'Painel de internacionalização:\n\n• Idiomas Disponíveis: Português (PT-PT), Inglês (EN) e Espanhol (ES).\n• Bandeiras Oficiais: O seletor de idioma utiliza exclusivamente as bandeiras de Portugal (🇵🇹) e dos Estados Unidos (🇺🇸).\n• [ Salvar Traduções ]: Persiste os textos traduzidos no banco PostgreSQL.\n• [ Preenchimento Automático ]: Sugere traduções automáticas para revisão do administrador.',
            routePath: '/languages',
            calloutType: 'INFO',
            calloutMessage: 'As traduções garantem excelência no atendimento a turistas nas praias da Figueira da Foz, Aveiro e Lisboa.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 11. ANALYTICS DA REDE: VISÃO GERAL
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000011',
        categoryId: '10000000-0000-0000-0000-000000000004',
        title: 'Analytics da Rede: Visão Geral (Receita, Ticket Médio & Volume)',
        slug: 'analytics-da-rede-visao-geral-receita-ticket-medio-e-volume',
        summary: 'Painel executivo de Business Intelligence para acompanhamento de receitas consolidadas, ticket médio e volume de transações.',
        readTimeMinutes: 5,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 1,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Filtros de Período',
            instruction: 'Controles superiores de BI:\n\n• Seletor de Período: Alterna rapidamente entre "Hoje", "Últimos 7 Dias", "Mês Atual", "Mês Anterior" ou "Personalizado".\n• [ Exportar Relatório PDF ]: Emite o dossiê executivo com gráficos consolidados.\n• Seletor de Unidade: Permite comparar o faturamento entre todas as unidades conectadas.',
            routePath: '/analytics',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 2,
            title: '📊 Cards de KPIs de Receita da Rede',
            instruction: 'Indicadores no topo do Analytics:\n\n• Faturamento Bruto da Rede: Total transacionado em Euros (€).\n• Ticket Médio Consolidado: Valor médio gasto por cliente por pedido em toda a rede.\n• Volume Total de Pedidos: Quantidade de transações concluídas no período.\n• Participação por Canal: Percentual de vendas realizadas em Balcão (PDV), Mesas (QR Code) e Takeaway.',
            routePath: '/analytics',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 12. ANALYTICS: VENDAS DE PRODUTOS
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000012',
        categoryId: '10000000-0000-0000-0000-000000000004',
        title: 'Analytics: Vendas de Produtos (Mais & Menos Vendidos)',
        slug: 'analytics-vendas-de-produtos-mais-e-menos-vendidos',
        summary: 'Curva ABC de produtos: identificação dos recipientes campeões de venda e itens com baixa saída na rede.',
        readTimeMinutes: 4,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 2,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Análise da Curva ABC',
            instruction: 'Recursos de inteligência de produtos:\n\n• Ranking de Vendas: Lista os tamanhos de recipientes mais pedidos (ex: Copo 350gr e Copo 500gr liderando o volume).\n• Faturamento por Produto: Receita gerada em Euros por cada item.\n• [ Exportar Planilha ]: Exporta o relatório completo para apoio em negociações industriais de matéria-prima.',
            routePath: '/analytics/products',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 13. ANALYTICS: VENDAS DE OPCIONAIS
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000013',
        categoryId: '10000000-0000-0000-0000-000000000004',
        title: 'Analytics: Vendas de Opcionais (Acompanhamentos & Toppings)',
        slug: 'analytics-vendas-de-opcionais-acompanhamentos-e-toppings',
        summary: 'Métricas de preferência de frutas, cremes, acompanhamentos e caldas mais solicitados pelos clientes.',
        readTimeMinutes: 4,
        targetRoles: ['FRANCHISOR_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 3,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Indicadores de Preferência do Cliente',
            instruction: 'Métricas do painel de opcionais:\n\n• Top Cremes & Bases: Mostra a frequência de escolha de Creme de Ninho, Morango, Pitaya, Cupuaçu, etc.\n• Top Frutas: Ranking das frutas frescas mais montadas (Banana, Morango, Kiwi, Manga).\n• Top Acompanhamentos: Itens mais populares (Leite Condensado, Granola, Paçoca, Gotas de Chocolate).\n• Taxa de Adicionais Extras: Percentual de clientes que adicionam uma 3ª base (+2,00 €) ou acompanhamentos adicionais.',
            routePath: '/analytics/options',
            calloutType: 'INFO',
            calloutMessage: 'Permite planejar as compras semanais de frutas frescas sem desperdício de perecíveis.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 14. VISÃO GERAL DA LOJA (FRANQUIAS)
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000014',
        categoryId: '10000000-0000-0000-0000-000000000005',
        title: 'Visão Geral da Loja (Receita, Ticket Médio & Volume Local)',
        slug: 'visao-geral-da-loja-receita-ticket-medio-e-volume-local',
        summary: 'Dashboard exclusivo do franqueado para monitoramento da saúde operacional e financeira diária da sua loja.',
        readTimeMinutes: 4,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 1,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Indicadores do Franqueado',
            instruction: 'Painel local da unidade:\n\n• Faturamento do Dia (€): Total de vendas concluídas na loja hoje.\n• Ticket Médio da Loja: Gasto médio por comanda na unidade.\n• Gráfico de Horários de Pico: Demonstra os intervalos de maior movimento no salão para escalonamento ideal de colaboradores no balcão e copa.\n• [ Fechar Caixa do Dia ]: Atalho direto para a conferência final de turno.',
            routePath: '/store_analytics',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 15. GESTÃO DE ESTOQUE LOCAL
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000015',
        categoryId: '10000000-0000-0000-0000-000000000006',
        title: 'Gestão de Estoque Local (Controle Físico & Auditoria)',
        slug: 'gestao-de-estoque-local-controle-fisico-e-auditoria',
        summary: 'Auditoria de mercadorias da loja, conferência física de embalagens e política de estoque híbrido sem travamento de vendas.',
        readTimeMinutes: 5,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 1,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Botões de Topo',
            instruction: 'Comandos do estoque da loja:\n\n• [ Ajuste de Saldo Físico ]: Permite atualizar a contagem real após conferência nas prateleiras ou câmara fria.\n• [ Inventário Rápido ]: Formulário otimizado para conferência rápida de fechamento de turno.\n• [ Histórico de Movimentações ]: Extrato completo de entradas, saídas por vendas e quebras.',
            routePath: '/stock',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 2,
            title: '⚠️ Princípio de Ouro: Zero Travas Automáticas (Decisão Humana)',
            instruction: 'A arquitetura do Açaí da Rose adota a política de "Zero Travas Automáticas":\n\n• O sistema projeta o consumo estimado e gera alertas visuais no PDV quando um item está próximo do fim.\n• O sistema NUNCA bloqueia as vendas automaticamente para evitar falsa ruptura no caixa (por exemplo, quando o estoque do sistema indica zero mas ainda há insumos na câmara fria).\n• Decisão em 1 Clique: O gerente avalia o alerta e decide:\n  - [ Pausar no Cardápio ]: Se a mercadoria realmente acabou fisicamente.\n  - [ Manter Ativo ]: Se houver produto disponível para atendimento aos clientes.',
            routePath: '/stock',
            calloutType: 'ALERT',
            calloutMessage: 'Nunca impeça um cliente de comprar caso o produto esteja fisicamente disponível na loja.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 16. REPOSIÇÃO COM A MATRIZ
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000016',
        categoryId: '10000000-0000-0000-0000-000000000006',
        title: 'Reposição com a Matriz (Pedidos B2B & Entrada de Carga)',
        slug: 'reposicao-com-a-matriz-pedidos-b2b-e-entrada-de-carga',
        summary: 'Como a franquia solicita insumos homologados à Matriz, acompanha o status de expedição e confirma o recebimento da carga.',
        readTimeMinutes: 4,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 2,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Carrinho de Suprimentos B2B',
            instruction: 'Passo a passo para solicitar reposição:\n\n• [ Novo Pedido de Suprimentos ]: Abre o catálogo de insumos homologados com preços negociados pela Matriz.\n• Adição de Itens: Selecione caixas de polpa de açaí, cremes, granolas, embalagens e descartáveis.\n• Visualização de Preços: Exibição clara do Preço Líquido + IVA discriminado = Total com IVA.\n• [ Enviar Pedido à Matriz ]: Dispara o pedido diretamente para a fila de expedição do galpão central da Franqueadora.',
            routePath: '/supply_orders',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
          {
            stepNumber: 2,
            title: '📋 Recebimento e Entrada Automática no Estoque',
            instruction: 'Quando a transportadora entrega as mercadorias na franquia:\n\n1. O gerente abre a tela de Reposição e localiza o pedido com status "Despachado / Em Trânsito".\n2. Confere fisicamente a quantidade de caixas e validades.\n3. Clica no botão [ Confirmar Recebimento de Carga ]: O sistema credita automaticamente o saldo de todos os itens no estoque local da loja, sem necessidade de digitação manual.',
            routePath: '/supply_orders',
            calloutType: 'INFO',
            calloutMessage: 'Ao confirmar o recebimento, o saldo físico da sua loja é atualizado instantaneamente.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 17. DISPONIBILIDADE NO CARDÁPIO LOCAL
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000017',
        categoryId: '10000000-0000-0000-0000-000000000006',
        title: 'Disponibilidade de Itens no Cardápio Local da Loja',
        slug: 'disponibilidade-de-itens-no-cardapio-local-da-loja',
        summary: 'Pausar e reativar produtos, frutas ou acompanhamentos exclusivamente no cardápio da sua unidade sem afetar outras franquias.',
        readTimeMinutes: 3,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 3,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações de Pausa Local & Isolamento Multi-Tenant',
            instruction: 'Gestão de disponibilidade local:\n\n• [ Botão Pausar / Esgotado ]: Se a manga ou o kiwi acabarem no salão da sua loja, clique no botão de pausa.\n• Efeito Imediato: O item é ocultado instantaneamente no PDV da loja e nos QR Codes de mesa das mesas da sua unidade.\n• Isolamento Absoluto: As outras lojas (Figueira da Foz, Torres Novas, Aveiro) continuam vendendo normalmente sem nenhum impacto.',
            routePath: '/store_menu',
            calloutType: 'INFO',
            calloutMessage: 'Reative o item com 1 clique assim que a reposição chegar à loja.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 18. FEEDBACKS & SATISFAÇÃO
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000018',
        categoryId: '10000000-0000-0000-0000-000000000007',
        title: 'Feedbacks & Satisfação (Pesquisa NPS & Critérios)',
        slug: 'feedbacks-e-satisfacao-pesquisa-nps-e-criterios',
        summary: 'Auditoria de avaliações enviadas pelos clientes nos QR Codes de mesa, índice de satisfação NPS e critérios de qualidade.',
        readTimeMinutes: 4,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 1,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Indicadores de Satisfação do Cliente',
            instruction: 'Painel de qualidade e avaliação:\n\n• Índice NPS Geral: Pontuação apurada de satisfação (Promotores vs Detratores).\n• Média por Critério: Notas de 1 a 5 estrelas para: Atendimento no Balcão, Sabor do Açaí, Frescor das Frutas, Limpeza do Salão e Velocidade de Entrega.\n• Feed de Comentários: Elogios e sugestões deixadas diretamente pelos clientes nos telemóveis.',
            routePath: '/feedbacks',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 19. DADOS DA LOJA & CONFIGURAÇÕES
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000019',
        categoryId: '10000000-0000-0000-0000-000000000008',
        title: 'Dados da Loja (NIF, Morada & Horários)',
        slug: 'dados-da-loja-nif-morada-e-horarios',
        summary: 'Configuração dos dados cadastrais e fiscais da unidade, morada física, contactos e horários de funcionamento do cardápio digital.',
        readTimeMinutes: 4,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 1,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Campos & Configurações da Loja',
            instruction: 'Configurações centrais da unidade:\n\n• Identificação Fiscal: Nome Fiscal, Nome Comercial e NIF de Portugal (impresso no cabeçalho dos talões térmicos).\n• Morada da Loja: Rua, número, código postal (ex: 3080-000) e cidade em Portugal.\n• Horários de Funcionamento: Definição da abertura e fecho por dia da semana. Fora do horário, o cardápio digital informa automaticamente que a loja se encontra encerrada.\n• [ Salvar Alterações ]: Atualiza as configurações em tempo real.',
            routePath: '/store_settings',
            calloutType: 'INFO',
            calloutMessage: 'Mantenha os horários atualizados para evitar pedidos fora do expediente da equipe.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 20. CONFIGURAÇÃO PAINEL DE SENHA (TV)
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000020',
        categoryId: '10000000-0000-0000-0000-000000000008',
        title: 'Configuração Painel de Senha (Vídeos & Mensagens TV)',
        slug: 'configuracao-painel-de-senha-videos-e-mensagens-tv',
        summary: 'Gestão da Smart TV de chamada de senhas no salão, rota pública /chamada, carrossel de vídeos promocionais e voz TTS.',
        readTimeMinutes: 4,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 2,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Conexão com a Smart TV',
            instruction: 'Configuração do sistema de chamada de salão:\n\n• Rota Pública da TV: Na Smart TV da loja, abra o navegador e acesse a rota limpa: https://app.acaidarose.pt/chamada?loja=[slug-da-loja].\n• Modo Tela Cheia: Pressione F11 no teclado ou ative tela cheia no controle da TV.\n• Upload de Vídeos Promocionais: Adicione arquivos MP4 para rotação de vídeos no salão enquanto nenhuma senha é chamada.\n• Teste de Voz TTS: Dispara um chamado simulado de áudio para calibrar o volume da televisão.',
            routePath: '/tv_settings',
            calloutType: 'INFO',
            calloutMessage: 'A voz TTS pronuncia de forma objetiva apenas o número da senha e o nome do cliente.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 21. CONFIGURAÇÕES QR CODE
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000021',
        categoryId: '10000000-0000-0000-0000-000000000008',
        title: 'Configurações QR Code (Mesas & Identidade Visual)',
        slug: 'configuracoes-qr-code-mesas-e-identidade-visual',
        summary: 'Geração, customização e impressão de cartões com QR Code dinâmico para mesas do salão e balcão de takeaway.',
        readTimeMinutes: 3,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 3,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações de Geração e Impressão de QR Code',
            instruction: 'Impressão de displays de mesa:\n\n• [ Gerar QR Codes das Mesas ]: Gera o arquivo gráfico de alta resolução pronto para impressão gráfica para as mesas (Mesa 01 a Mesa 30).\n• Token Seguro Dinâmico: Cada mesa possui link autenticado próprio que abre o cardápio digital com a comanda associada automaticamente.\n• QR Code Geral de Balcão: Código avulso para pedidos rápidos de takeaway.',
            routePath: '/qr_settings',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 22. IMPRESSORAS TÉRMICAS
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000022',
        categoryId: '10000000-0000-0000-0000-000000000008',
        title: 'Impressoras Térmicas (Copa, Balcão & Guilhotina)',
        slug: 'impressoras-termicas-copa-balcao-e-guilhotina',
        summary: 'Instalação de impressoras ESC/POS via Rede Ethernet ou USB, corte automático de papel e roteamento de pedidos.',
        readTimeMinutes: 5,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 4,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Tipos de Impressora',
            instruction: 'Configuração de hardware térmico:\n\n• [ Nova Impressora ]: Cadastra um periférico indicando o Papel Operacional (Copa/Preparação ou Balcão/Cliente).\n• Interface de Conexão: Suporte a IP de Rede (Ethernet/Wi-Fi) ou Conexão Direta USB via Agente Local.\n• [ Imprimir Talão de Teste ]: Dispara um comprovante de calibração para testar densidade de impressão e corte automático da guilhotina.',
            routePath: '/printers',
            calloutType: 'INFO',
            calloutMessage: 'A impressora de Copa imprime imediatamente após o pagamento para agilizar a montagem do açaí.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 23. UTILIZADORES & PERMISSÕES
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000023',
        categoryId: '10000000-0000-0000-0000-000000000008',
        title: 'Utilizadores & Permissões (Gerentes, Caixas & Acessos)',
        slug: 'utilizadores-e-permissoes-gerentes-caixas-e-acessos',
        summary: 'Gestão da equipe da unidade, criação de logins individuais para operadores de caixa e regras de segurança de acesso.',
        readTimeMinutes: 4,
        targetRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 5,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Perfis & Ações de Segurança',
            instruction: 'Governança de contas de utilizadores:\n\n• Perfil CASHIER (Operador de Caixa): Acesso estrito ao PDV Balcão, Fila KDS e Fecho de Caixa diário. Sem permissão para alterar preços ou dados cadastrais.\n• Perfil TENANT_ADMIN (Gerente de Franquia): Acesso administrativo integral à loja, estoque e relatórios.\n• [ Novo Utilizador ]: Cadastra nome, e-mail e senha de acesso.\n• [ Resetar Senha ]: Envia link seguro de redefinição para o colaborador.',
            routePath: '/users',
            calloutType: 'ALERT',
            calloutMessage: 'Cada colaborador deve possuir login individual para garantir a rastreabilidade nas auditorias de caixa.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 24. RELATÓRIOS & FECHO DE CAIXA
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000024',
        categoryId: '10000000-0000-0000-0000-000000000008',
        title: 'Relatórios & Fecho de Caixa (Auditoria Diária de Vendas)',
        slug: 'relatorios-e-fecho-de-caixa-auditoria-diaria-de-vendas',
        summary: 'Conferência de gaveta, conciliação de lote do terminal TPA Multibanco, MB WAY e emissão do Z-Report de fecho de turno.',
        readTimeMinutes: 5,
        targetRoles: ['CASHIER', 'TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 6,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações & Passos de Fechamento de Caixa',
            instruction: 'Rotina de prestação de contas no final do dia:\n\n1. Faturamento por Meio de Pagamento: O painel exibe o total recebido em Numerário (dinheiro físico), Terminal TPA Multibanco e MB WAY.\n2. Tirar Lote do TPA Físico: Emita o relatório no terminal de cartão e confirme se o valor bate com o registrado no sistema.\n3. Contagem de Numerário: Conte as notas e moedas da gaveta e desconte o fundo de troco inicial.\n4. [ Registrar Fecho do Turno ]: Grava o relatório formal com data, operador e valores finais.',
            routePath: '/closing',
            calloutType: 'ALERT',
            calloutMessage: 'Divergências de cartão devem ser auditadas imediatamente conferindo as vias dos comprovantes físicos.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 25. PDV BALCÃO & MESAS (MONTAGEM DE COPOS)
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000025',
        categoryId: '10000000-0000-0000-0000-000000000009',
        title: 'PDV Balcão & Mesas (Montagem de Copos & Taças)',
        slug: 'pdv-balcao-e-mesas-montagem-de-copos-e-tacas',
        summary: 'Operação da frente de caixa touch: seleção de Copos (250g, 350g, 500g) e Taças (750g, 1kg), bases inclusas e adicionais.',
        readTimeMinutes: 5,
        targetRoles: ['CASHIER', 'TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 1,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Fluxo de Montagem do Pedido no PDV',
            instruction: 'Como montar o pedido no terminal touch:\n\n1. Escolha do Recipiente: Selecione o tamanho solicitado pelo cliente (Copo 250gr, Copo 350gr, Copo 500gr, Taça 750gr ou Família 1kg).\n2. Seleção de Bases: Até 2 opções inclusas no preço base. Se o cliente solicitar uma 3ª base, o sistema adiciona automaticamente +2,00 €.\n3. Frutas & Acompanhamentos: A partir de 500g, selecione livremente as frutas e acompanhamentos.\n4. [ Adicionar à Comanda ]: O item entra no resumo da venda com o valor calculado com precisão.',
            routePath: '/pos',
            calloutType: 'INFO',
            calloutMessage: 'Para consumo no salão em 750g/1kg use Taça; para viagem utilize Caixinha Plástica.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 26. PDV BALCÃO: PAGAMENTOS & TALÃO
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000026',
        categoryId: '10000000-0000-0000-0000-000000000009',
        title: 'PDV Balcão: Pagamentos & Emissão de Talão',
        slug: 'pdv-balcao-pagamentos-e-emissao-de-talao',
        summary: 'Finalização de venda: cálculo automático de troco em Numerário, confirmação de TPA Multibanco, MB WAY e impressão de comprovante.',
        readTimeMinutes: 4,
        targetRoles: ['CASHIER', 'TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 2,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Meios de Pagamento em Portugal & Finalização',
            instruction: 'Opções de recebimento no balcão:\n\n• Numerário (Dinheiro): Digite o valor entregue pelo cliente; a tela calcula o troco exato em Euros.\n• Multibanco (TPA Cartão): Insira o cartão no terminal físico e confirme após a aprovação da transação.\n• MB WAY: Solicite o número de telemóvel do cliente para disparo de notificação no aplicativo bancário.\n• [ Finalizar Venda ]: Dispara a impressão do talão para o cliente, imprime a comanda na copa e gera a senha na Smart TV.',
            routePath: '/pos',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 27. PEDIDOS & KDS COZINHA
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000027',
        categoryId: '10000000-0000-0000-0000-000000000009',
        title: 'Pedidos & KDS Cozinha (Fila em Tempo Real)',
        slug: 'pedidos-e-kds-cozinha-fila-em-tempo-real',
        summary: 'Tela de preparação na copa: fila em tempo real, acompanhamento de tempos de espera, chamada de voz na Smart TV e conclusão.',
        readTimeMinutes: 4,
        targetRoles: ['CASHIER', 'TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 3,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Operação do KDS de Preparação',
            instruction: 'Rotina dos operadores de copa:\n\n• Fila em Tempo Real: Cada comanda exibe o número da senha, tamanho do recipiente, bases escolhidas e acompanhamentos solicitados.\n• [ Chamar na TV ]: Quando o pedido estiver montado, clique neste botão para acionar o sinal sonoro e a chamada por voz na Smart TV do salão.\n• [ Concluir Entrega ]: Quando o cliente retirar o pedido no balcão, clique para arquivar a comanda.',
            routePath: '/kds',
            calloutType: 'INFO',
            calloutMessage: 'Os pedidos mudam de cor conforme o tempo de espera para evitar atrasos no salão.',
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 28. HISTÓRICO DE PEDIDOS
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000028',
        categoryId: '10000000-0000-0000-0000-000000000009',
        title: 'Histórico de Pedidos (Auditoria & Filtro por Data)',
        slug: 'historico-de-pedidos-auditoria-e-filtro-por-data',
        summary: 'Consulta de pedidos concluídos, reimpressão de talões para clientes, auditoria de transações e cancelamento justificado.',
        readTimeMinutes: 3,
        targetRoles: ['CASHIER', 'TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 4,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Ações de Auditoria e Reimpressão',
            instruction: 'Pesquisa e reimpressão:\n\n• Filtro por Data ou Senha: Digite o número da senha ou selecione o dia para localizar a transação.\n• [ Re-imprimir Talão ]: Reemite o comprovante fiscal na impressora térmica caso o cliente solicite uma 2ª via.\n• [ Cancelar Pedido ]: Ação restrita a gerentes que exige motivo fundamentado de cancelamento.',
            routePath: '/orders_history',
            calloutType: null,
            calloutMessage: null,
            media: null,
          },
        ],
      },

      // -----------------------------------------------------------------------
      // 29. GESTÃO DE MESAS (SALÃO & COMANDAS)
      // -----------------------------------------------------------------------
      {
        id: '20000000-0000-0000-0000-000000000029',
        categoryId: '10000000-0000-0000-0000-000000000009',
        title: 'Gestão de Mesas (Salão & Comandas)',
        slug: 'gestao-de-mesas-salao-e-comandas',
        summary: 'Monitoramento do salão de atendimento: abertura de mesas, transferência de itens entre mesas físicas e fecho de conta do cliente.',
        readTimeMinutes: 4,
        targetRoles: ['CASHIER', 'TENANT_ADMIN', 'SUPER_ADMIN'],
        orderIndex: 5,
        published: true,
        steps: [
          {
            stepNumber: 1,
            title: '🎯 Mapa de Mesas do Salão',
            instruction: 'Visualização do salão físico em tempo real:\n\n• Mesas Livres (Verde): Disponíveis para receber novos clientes.\n• Mesas Ocupadas (Vermelho): Comandas abertas com pedidos em consumo.\n• [ Transferir Mesa ]: Permite mudar o cliente de mesa com 1 clique, mantendo intactos todos os itens já pedidos.\n• [ Fechar Conta da Mesa ]: Abre a tela de pagamento com o subtotal da mesa para emissão do talão.',
            routePath: '/tables',
            calloutType: 'INFO',
            calloutMessage: 'Clientes que pedem pelo QR Code de mesa têm os itens adicionados diretamente à respectiva mesa.',
            media: null,
          },
        ],
      },
    ]

    console.log(`Sincronizando ${articles.length} manuais oficiais com anatomia completa de componentes...`)
    for (const art of articles) {
      await pool.query(
        `INSERT INTO manual_articles (
          id, category_id, title, slug, summary, read_time_minutes, target_roles,
          order_index, published, steps, helpful_votes, unhelpful_votes, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 0, NOW())
        ON CONFLICT (id) DO UPDATE
        SET category_id = EXCLUDED.category_id,
            title = EXCLUDED.title,
            slug = EXCLUDED.slug,
            summary = EXCLUDED.summary,
            read_time_minutes = EXCLUDED.read_time_minutes,
            target_roles = EXCLUDED.target_roles,
            order_index = EXCLUDED.order_index,
            published = EXCLUDED.published,
            steps = EXCLUDED.steps,
            updated_at = NOW()`,
        [
          art.id,
          art.categoryId,
          art.title,
          art.slug,
          art.summary,
          art.readTimeMinutes,
          art.targetRoles,
          art.orderIndex,
          art.published,
          JSON.stringify(art.steps),
        ]
      )
    }

    console.log('✓ Todos os 29 manuais com Screen Anatomy (botões, cards, filtros e modais) sincronizados com sucesso no PostgreSQL!')
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('Erro na sincronização:', err)
    await pool.end()
    process.exit(1)
  }
}

seedScreenAnatomyManuals()
