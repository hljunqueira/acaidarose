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

### 1. Glossário PT-PT Mandatório & Nomenclatura de Recipientes
- **Copo**: Usar obrigatoriamente **Copo** para 250g, 350g e 500g (Copo 250gr, Copo 350gr, Copo 500gr). Não se serve açaí em taça nesses tamanhos, serve-se em copo.
- **Taça vs Caixinha Plástica**: O único servido em **Taça** é o **Sensação (750g)** e o **Família (1kg)** para consumo na loja física. Para takeaway / levar para casa, é servido em **Caixinha Plástica** (ou Caixa).
- **Regra de Bases/Cremes**: Em todos os tamanhos, o cliente tem até **2 opções inclusas** (Açaí + 1 creme, ou 2 cremes sem açaí, ou apenas 1 base). A partir da 3ª opção de base/creme, soma adicional de **+2,00 €** por item extra.
- **Regra de Frutas & Toppings**: A partir de 500g (500g, 750g e 1kg), frutas e acompanhamentos tradicionais são **livres / ilimitados** (maxQty: 999). Abaixo de 500g (250g e 350g), possuem cotas inclusas e adicionais (+0,50 €).
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

### 9. Design Clean & Sem Ícones Supérfluos (Anti "Cara de IA")
- **Zero Ícones e Emojis Decorativos**: Proibido usar emojis (como 🍧, 🥪, 🥐, 🥟, ✨) ou ícones desnecessários em botões, abas de menus, abas de categorias ou cards. O visual deve ser corporativo, sofisticado, limpo e sem qualquer aspecto gerado por IA ("sem cara de IA").
- **Estética Minimalista**: Layout focado em tipografia sóbria, contrastes harmônicos, espaçamento equilibrado e ausência de efeitos visuais cafonas ou genéricos.
- **Abas Canônicas de Menus na Ementa**: Exatamente denominadas `Açaí da Rose` e `Lanches` (em inglês: `Açaí da Rose` e `Snacks`). Sem adendos desnecessários como "Pastelaria" ou emojis anexados.
- **Bandeiras Oficiais**: Uso exclusivo das bandeiras de Portugal (🇵🇹) e Estados Unidos (🇺🇸) no seletor de idioma, sem adornos extras.

## [Diretrizes de Código Claude Inspiradas em Karpathy]

### 1. Pensar Antes de Codificar (Think Before Coding)
*Não presuma. Não esconda a confusão. Exponha as compensações (tradeoffs).*
- **Objetivo**: Forçar o raciocínio explícito antes da implementação.
- **Práticas**:
  - Declare suas suposições explicitamente e pergunte se estiver incerto.
  - Apresente múltiplas interpretações quando houver ambiguidade.
  - Empurre de volta (push back) se houver uma abordagem mais simples.
  - Pare se estiver confuso, nomeie o que não está claro e peça esclarecimentos.

### 2. Simplicidade em Primeiro Lugar (Simplicity First)
*Código mínimo que resolve o problema. Nada especulativo.*
- **Objetivo**: Combater a tendência de superengenharia e complexidade desnecessária.
- **Práticas**:
  - Nenhuma funcionalidade além do que foi pedido.
  - Nenhuma abstração para código de uso único.
  - Nenhuma "flexibilidade" ou "configurabilidade" não solicitada.
  - Nenhum tratamento de erro para cenários impossíveis.
  - Se 200 linhas poderiam ser 50, reescreva.
  - **Teste**: Um engenheiro sênior diria que isso é supercomplicado? Se sim, simplifique.

### 3. Mudanças Cirúrgicas (Surgical Changes)
*Toque apenas no que for estritamente necessário. Limpe apenas sua própria bagunça.*
- **Objetivo**: Evitar edições colaterais e refatorações não solicitadas.
- **Práticas**:
  - Não "melhore" código, comentários ou formatação adjacentes.
  - Não refatore coisas que não estão quebradas.
  - Combine o estilo existente, mesmo que você fizesse diferente.
  - Se notar código morto não relacionado, mencione-o, não o exclua.
  - Quando suas alterações criarem órfãos:
    - Remova importações/variáveis/funções que suas alterações tornaram não utilizadas.
    - Não remova código morto pré-existente, a menos que solicitado.
  - **Teste**: Cada linha alterada deve rastrear diretamente a solicitação do usuário.

### 4. Execução Orientada a Objetivos (Goal-Driven Execution)
*Defina critérios de sucesso. Repita até verificar.*
- **Objetivo**: Transformar tarefas em metas verificáveis e iterar até a validação.
- **Práticas**:
  - Transforme "Adicione validação" em "Escreva testes para entradas inválidas, depois faça-os passar".
  - Transforme "Corrija o bug" em "Escreva um teste que o reproduza, depois faça-o passar".
  - Para tarefas com múltiplos passos, declare um breve plano:
    1. [Passo] → verificar: [verificação]
    2. [Passo] → verificar: [verificação]
    3. [Passo] → verificar: [verificação]
  - Critérios de sucesso fortes permitem execução independente. Critérios fracos ("faça funcionar") exigem esclarecimentos constantes.

## [Metodologia de Engenharia Avançada — Superpowers]

### 1. A Lei de Ferro do TDD (The Iron Law of TDD)
*Nenhum código de produção sem um teste falhando primeiro.*
- Se escreveu código antes do teste: descarte-o e implemente do zero a partir do teste.
- **Ciclo Red-Green-Refactor**:
  1. **RED**: Escreva um teste unitário/integração mínimo mostrando o comportamento esperado e execute-o para vê-lo falhar pelo motivo correto (funcionalidade ausente, não erro de sintaxe).
  2. **GREEN**: Escreva apenas o código mínimo indispensável para fazer o teste passar.
  3. **REFACTOR**: Limpe o código, elimine duplicações e mantenha a suíte 100% verde.

### 2. Rulings, Not Stalls (Decisões sem Travar o Fluxo)
- **Paradas Mandatórias**: Interrompa a execução e pergunte ao usuário APENAS em:
  - Operações irreversíveis ou destrutivas (deleção massiva, resets, remoção de banco).
  - Ações sensíveis a segurança, credenciais ou impacto em produção (deploy, merge em `main`).
  - Planos ou especificações totalmente quebrados onde continuar seria puro palpite.
- **Julgamento Autônomo**: Em pequenas ambiguidades ou decisões técnicas não destrutivas, escolha a alternativa mais simples, registre no histórico (`Ruling: <decisão> — <motivo> — <impacto se errado>`) e continue executando sem interromper o fluxo com perguntas desnecessárias.

### 3. Resiliência à Compactação de Contexto (Ledger / Memória Persistente)
- Não confie na memória transitória da conversa em tarefas multi-passos longas.
- Mantenha o progresso e tarefas concluídas registrados em arquivo persistente (`SCRATCHPAD.md` ou `progress.md`).
- Se a sessão for compactada ou reiniciada, o agente deve ler o ledger e retomar imediatamente do ponto exato onde parou.

### 4. Protocolo de Finalização de Branch (Finishing a Development Branch)
- Ao concluir a implementação de uma feature ou bugfix:
  1. Execute a validação fresca de testes, linter e build.
  2. Apresente ao desenvolvedor o menu padronizado de 3 opções:
     - `1. Merge local na branch base`
     - `2. Push e abertura de Pull Request`
     - `3. Manter a branch isolada (revisão manual posterior)`
  3. Realize a limpeza de worktrees e arquivos temporários conforme a opção escolhida.

### 5. Revisão em Dois Eixos (Spec Compliance vs. Code Quality)
- Toda entrega deve ser inspecionada sob duas óticas independentes:
  - **Eixo 1 — Conformidade com a Especificação**: Cumpre exatamente o que foi solicitado, sem faltar requisitos e sem adicionar complexidade não pedida?
  - **Eixo 2 — Qualidade do Código**: Adere ao estilo do repositório, trata erros reais, possui testes e não deixa código órfão ou dependências desnecessárias?

## [Ferramentas de Pesquisa & Leitura Web — Defuddle]
- **Ingestão Limpa de Páginas Web**: Ao pesquisar ou inspecionar URLs, artigos e documentações técnicas externas, evite consumir tokens com HTML bruto ou páginas poluídas.
- **Comando Recomendado**: Utilize o Defuddle para extrair apenas o conteúdo essencial diretamente em Markdown:
  `defuddle parse <URL> --markdown` (ou com metadados YAML: `defuddle parse <URL> --markdown --frontmatter`)

## [Comunicação Concisa & Eficiência de Tokens — Modo Caveman]
- **Filosofia Central**: Máxima densidade técnica com corte radical de preâmbulos, floreios e rodeios (*"why use many token when few do trick"*).
- **Diretrizes de Comunicação**:
  - Elimine saudações, preâmbulos, confirmações óbvias e enrolações ("Certamente", "Com certeza", "Vou explicar").
  - Vá direto à resposta, comando ou alteração de código.
  - Termos técnicos, comandos de terminal, blocos de código e caminhos de arquivo permanecem 100% exatos e inalterados.
  - Alertas de segurança ou operações de risco continuam sendo explicados com total clareza.
- **Execução Direta de Ferramentas**: Dispare ferramentas diretamente sem narrar micro-passos óbvios antes de executá-los.

### [Padrões de Engenharia Addy Osmani — Agent Skills]
- **Ciclo em 6 Fases (Lifecycle)**:
  1. **Define (`/spec`)**: Especificar antes de codificar. Se a tarefa estiver vaga, fazer perguntas cirúrgicas uma a uma (`interview-me`).
  2. **Plan (`/plan`)**: Decompor em tarefas atômicas e ordenadas por dependência com critérios de aceite claros.
  3. **Build (`/build`)**: Fatias verticais finas (thin vertical slices). Implementar -> testar -> verificar -> commitar.
  4. **Verify (`/test`)**: Testes são a prova (tests are proof). Red-Green-Refactor, pirâmide 80/15/5, nunca silenciar testes.
  5. **Review (`/review`)**: Revisão em 5 eixos (Corretude, Segurança, Performance, Manutenibilidade, Testabilidade) sob o padrão Staff Engineer.
  6. **Ship (`/ship`)**: Commits atômicos, rollback-friendly, checklists pré-lançamento.
- **Frontend & UI Engineering (Google Standard)**:
  - Componentes com estado previsível e responsividade sólida.
  - Acessibilidade obrigatória WCAG 2.1 AA (semântica HTML, navegação por teclado, labels e ARIA adequados).
  - Web Vitals: Medir antes de otimizar; vigilância sobre LCP, INP e CLS. Evitar bundles e dependências desnecessárias.
- **Higiene de Código & Chesterton's Fence**:
  - Nunca remover ou alterar código existente sem entender explicitamente por que ele foi construído.
  - Regra das 500 linhas: módulos focados; clareza sempre supera complexidade desnecessária (*Clarity over Cleverness*).
- **Segurança Defensiva**:
  - Prevenção ativa OWASP Top 10, sanitização de inputs em todas as fronteiras (APIs/banco/UI) e gestão segura de segredos.
- **Git como Ponto de Restauração**:
  - Commits atômicos (~100 linhas), frequentes e com mensagens no padrão Conventional Commits.

### [Diretrizes de Conversão, Copywriting & SEO — MarketingSkills]
- **Copywriting Orientado a Conversão**:
  - Proposta de valor clara em menos de 5 segundos: o usuário deve entender imediatamente o que o produto faz e para quem é.
  - Foco em benefícios concretos para o cliente, nunca em jargões técnicos vazios.
  - Chamadas para Ação (CTAs) ativas e específicas: evitar textos genéricos como "Enviar" ou "Clique aqui"; usar verbos de ação com benefício ("Ver cardápio", "Agendar horário", "Emitir primeira nota", "Começar teste grátis").
- **CRO (Conversion Rate Optimization) & Redução de Fricção**:
  - Formulários mínimos: solicitar apenas os campos estritamente essenciais para cadastro e checkout.
  - Prova social visível: incluir depoimentos, números de clientes, selos de segurança e garantias próximos aos botões de conversão.
  - Destaque visual: o botão de ação principal da tela deve ter o maior contraste e hierarquia visual.
- **SEO & AI-SEO (Google + Motores de IA)**:
  - Meta tags completas em todas as páginas públicas (Title, Meta Description, Open Graph para pré-visualização impecável no WhatsApp e redes sociais).
  - Estrutura semântica correta: apenas um <h1> por página, seguido de <h2> e <h3> hierárquicos com termos reais de busca do cliente.
  - Dados estruturados (Schema.org / JSON-LD) para negócios locais, produtos e serviços.
- **Retenção & Mensagens de Ciclo de Vida**:
  - Mensagens transacionais claras (confirmação de pedidos, onboarding amigável, emails/notificações pós-ação sem ruído).

### [Escrita Natural & Anti-Clichês de IA — Humanizer]
- **Objetivo**: Garantir que toda comunicação, copy de marketing, textos de interface (UI/UX), documentações, emails e commits soem autênticos, humanos e diretos, eliminando vícios sintéticos típicos de LLMs.
- **Eliminação dos Vícios Estruturais de IA**:
  1. **Evitar Fórmulas de Contraste Falsas ("Not X but Y")**: Em vez de *"Não é apenas um sistema, é uma experiência"*, afirme o fato diretamente: *"O sistema acelera o atendimento em 40%"*.
  2. **Eliminar Fechamentos Dramáticos de Uma Linha**: Cortar frases soltas repetitivas como *"Esse é o verdadeiro ganho."*, *"Pense nisso."*, *"A resposta pode te surpreender."*.
  3. **Evitar Aforismos Pomposos e Falsas Profundidades**: Substituir construções como *"No cerne de tudo...", "A confiança é a moeda do..."* por afirmações concretas e específicas.
  4. **Sem Enrolação Pré-Resposta (Staged Run-ups)**: Eliminar *"Vamos mergulhar nisso!"*, *"Sinceramente? Depende..."*, *"Sem mais delongas..."*. Vá direto ao ponto.
  5. **Sem Debates com Homens de Palha**: Não perca tempo refutando objeções não feitas (*"Isso não quer dizer que documentação não importa..."*).
  6. **Evitar Tríades Forçadas**: Não force listas artificiais de 3 itens (*"inovação, agilidade e escala"*) quando 1 ou 2 forem a realidade.
  7. **Vocabulário Proibido de IA**: Eliminar palavras batidas como *mergulhar/delve, testemunho/testament, tapeçaria/tapestry, cenário/landscape, pivotal, catalisador, farol/beacon, crucial*. Usar linguagem clara, coloquial quando adequado, e comercialmente persuasiva.
  8. **Preservação de Fatos**: Nunca inventar dados, números, depoimentos ou funcionalidades para florear o texto. Manter dados reais do cliente.
- **Integração com MarketingSkills**: Todo texto gerado via skills de copywriting, emails, landing pages e anúncios passa obrigatoriamente pelo filtro anti-clichê do Humanizer.
