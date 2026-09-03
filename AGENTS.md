# acaidarose

## [Visão Geral & Arquitetura]
- **Propósito**: Aplicação / Serviço acaidarose
- **Stack**: Next.js 15, React 18, TypeScript, Tailwind CSS, Zustand, Supabase / MongoDB
- **Estrutura Mapeada**:
  - `/app`: Rotas e páginas (Next.js App Router)
  - `/components`: Componentes de UI, PDV, Admin, Auth
  - `/hooks`: Custom hooks React
  - `/lib`: Stores Zustand, repositórios, regras de negócio e clientes de banco
  - `/public`: Assets estáticos e imagens
  - `/types`: Definições TypeScript
  - `/docs`: Documentação e materiais auxiliares

## [Comandos Essenciais]
- **Desenvolvimento**: `npm run dev`
- **Build**: `npm run build`
- **Linter**: `N/A`
- **Testes**: `Nenhum configurado`

## [Skills & Protocolos de Execução Obrigatórios]

### 1. Skill: Grill Me & Quebrar Plano
- Se o pedido do usuário for ambíguo ou amplo, faça **1 a 3 perguntas diretas** antes de codificar.
- Decomponha qualquer tarefa grande em passos atômicos (um arquivo/função por vez).

### 2. Skill: Mapa de Contexto & Arquivos Protegidos
- Identifique e liste os arquivos que serão alterados antes de iniciar a edição.
- **Proibido alterar sem autorização**: arquivos \.env*\, configs de build (\
ext.config.js\, \	sconfig.json\) e credenciais.

### 3. Skill: Systematic Debugging (Zero Tentativa e Erro)
- Em caso de bug ou falha:
  1. Reproduza o erro e colete o log/mensagem exata.
  2. Isole a causa raiz e formule uma hipótese.
  3. Aplique a correção mínima necessária e valide.

### 4. Skill: Verification Before Completion (Sem "Pronto" Falso)
- NUNCA declare uma tarefa concluída sem rodar a validação fresca (linter/testes/build).
- Apresente a evidência do teste/comando executado na resposta.

### 5. Skill: Minto Pyramid & Comunicação
- Responda primeiro com a alteração/código final.
- Evite explicações teóricas desnecessárias; foque apenas nas justificativas técnicas indispensáveis.
- Mantenha o arquivo \SCRATCHPAD.md\ sincronizado com o status do trabalho.

## [Regras do Negócio & Aprendizados de UX]

### 1. Glossário PT-PT Mandatório
- Sempre substituir **Tigela** por **Taça**.
- Sempre usar **Acompanhamentos** no lugar de **Complementos**.
- Sempre usar **Pedido** em vez de **Carrinho**.

### 2. Mídias (Vídeos & Imagens)
- Não usar ícones supérfluos ou orientações de resolução nas áreas de upload de mídias do produto.
- Em visualizações de miniatura (como na listagem do admin `ProductRowItem`) ou de detalhe, se houver um vídeo cadastrado (`videoUrl`), renderize o player de `<video>` em loop automático e silencioso.
- Se a coluna `image_url` estiver nula no banco de dados, utilize `video_poster` como imagem de fallback padrão no repositório do catálogo.

### 3. Painel de TV de Senhas vs. Painel de Controle (Staff)
- **Painel de Controle (Staff)**: Roteado no dashboard administrativo interno (`TVOrdersControlView`), contendo a listagem de pedidos, ações rápidas de re-chamada de voz na TV, conclusão de entrega de pedidos (`COMPLETED`) e o link para projetar em tela cheia na TV.
- **Painel da TV (Público)**: Rota pública limpa `/chamada` (`TVOrdersPanelView`), exclusiva para Smart TVs no salão, exibindo o carrossel de vídeos em rotação e ativando a fala simplificada TTS (apenas ticket e nome do cliente, sem textos longos extras).

### 4. Os 4 Pilares do Cardápio & Sincronização PostgreSQL
- **Hierarquia**: Menus (`menus`) $\rightarrow$ Categorias (`categories`) $\rightarrow$ Produtos (`product_containers`) $\rightarrow$ Opcionais (`product_bases`, `product_toppings`).
- **Isolamento por Loja**: Ocultar/pausar qualquer item (produto, categoria, menu ou opcional) reflete na tabela `store_product_overrides` por `tenant_id`. Oculta nos QR Codes de mesa daquela loja e no `/menu?loja=...`, mantendo as demais unidades inalteradas.
- **Sem Seeds/Fallbacks**: O sistema opera 100% com registros reais do PostgreSQL. Não utilizar arrays estáticos mockados como fallback se o banco retornar vazio.

### 5. Estoque Híbrido (Human-in-the-Loop)
- **Zero Travas Automáticas**: O sistema projeta e alerta consumo estimado; **nunca bloqueia vendas automaticamente** para evitar falsa ruptura.
- **Decisão Humana em 1 Clique**: O operador recebe alerta no PDV/Estoque e decide entre `[ Pausar no Cardápio ]` (se realmente acabou fisicamente) ou `[ Manter Ativo ]` (se ainda houver produto na câmara fria).

### 7. Estrutura Canônica de Lojas e Multi-Tenant 100% Dinâmico
- **Matriz Canônica**: `Loja 1 - Figueira da Foz (Matriz)` (ID: `11111111-1111-1111-1111-111111111111`, slug `figueira-da-foz`).
- **Filial 1**: `Loja 2 - Torres Novas (Filial 1)` (ID: `22222222-2222-2222-2222-222222222222`, slug `torres-novas`).
- **Franquia**: `Loja 3 - Aveiro (Franquia)` (ID: `33333333-3333-3333-3333-333333333333`, slug `aveiro`).
- **Zero Mapeamentos Estáticos**: Proibido usar dicionários estáticos (`STORE_SLUGS`, `STORE_LABELS`) ou ternários fixos no frontend/backend. Toda resolução de nome, slug, NIF e endereços deve ser consultada dinamicamente via `useFranchiseStore` ou `/api/tenants`. Novas franquias cadastradas na Franqueadora (ex.: Coimbra, Porto, Lisboa) funcionam automaticamente em QR codes de mesas, comandas, chamadas de TV e pedidos de abastecimento.

### 8. Padrão Fiscal de Portugal (IVA) no B2B da Franqueadora
- Todos os insumos mestres, compras com fornecedores e pedidos de abastecimento segregam explicitamente o Preço Líquido (sem IVA) + Alíquota/Montante do IVA (6% reduzido, 13% intermediário ou 23% normal) = Preço c/ IVA.
- Fórmulas, pesos (kg), cotações por kg e detalhamento fiscal transparente em todas as tabelas e relatórios comerciais da Matriz e Franquias.



