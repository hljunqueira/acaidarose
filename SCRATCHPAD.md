# SCRATCHPAD — Status do Projeto Açaí da Rose

## 1. Status Geral
- **Ambiente**: Produção (VPS PostgreSQL 16 + Next.js 15 na Vercel)
- **Design System**: Bimodal refinado (Claro / Escuro), sem mocks, sem emojis residuais e sem parênteses explicativos na UI.
- **Último Commit**: `a5e6030` (Padronização visual e estética integral de todas as páginas).

## 2. Varredura e Padronizações Concluídas
- **Módulo de Pedidos & PDV**:
  - `QRCodeOrdersAdmin.tsx`: Botões limpos (`Ver Itens`, `Receber`).
  - `OrderItemsModal.tsx`: Ação `Confirmar Pagamento`.
  - `OrderEditDialog.tsx` e `NewOrderManualModal.tsx`: Opções de status e botões de atendimento sem emojis (`Na Mesa`, `Balcão`, `Novo Pedido`, `Em Preparação`, `Pronto`, `Pago`).
  - `TableCheckoutDetail.tsx`: Botões com ícones Lucide (`Eye`, `Trash2`), status limpos e liberação de mesa padronizada.
  - `TableThermalReceiptDialog.tsx`: Cabeçalho institucional limpo e layout 80mm padronizado.
  - `BaseSelector.tsx` e `CartSummary.tsx`: Remoção de emojis e parênteses.
- **Módulo de Cardápio & Cliente**:
  - `CustomerMenuSearch.tsx`: Tags de busca e resultados minimalistas.
  - `CustomerProductDetail.tsx`: Seletores de frutas, toppings e caldas limpos.
  - `CustomerIngredientsGuide.tsx` e `CustomerMenuMore.tsx`: Estrelas de avaliação com `Star` de Lucide e selos de qualidade textuais e elegantes.
- **Módulo de Franqueadora & Gestão**:
  - `StoreSupplyOrdersView.tsx`: Título `Reposição de Insumos com a Matriz` e tabela sem emojis.
  - `InventoryManagementView.tsx`: Título `Gestão de Estoque Local` e `Checklist Rápido de Turno`.
  - `SupplyHubView.tsx`: Título `Central de Abastecimento & Expedição`.
  - `StoreCompanySettingsView.tsx`: Títulos de cards de identificação e horários limpos.
  - `StoreDetailsDialog.tsx`, `FranchiseCorporateView.tsx`, `FranchiseRequestsView.tsx`, `FranchiseReportDialog.tsx`, `EditRoyaltyDialog.tsx`: Badges de royalties e contratos sem emojis.
  - `SafeDeleteDialog.tsx`: Alertas e botões institucionais.
- **Módulo Técnico**:
  - `PreventionCenterView.tsx`: Status limpos e consistentes.

## 3. Validação
- `npx tsc --noEmit`: 0 erros de tipagem.
- `npm run build`: 16 páginas estáticas compiladas com sucesso.
- Deploy: Sincronizado no GitHub `origin/main` e ativo na Vercel.

## 4. Integração de Formulários & Migração (WordPress)
- **Patch de Banco de Dados**: Aplicado patch diretamente no PostgreSQL de produção na VPS para alinhar a tabela `franchise_requests` ao Next.js (adicionado colunas `title`, `description`, `requested_changes_json` e tipo `FRANCHISE_APPLICATION`).
- **Validação cURL**: Teste via cURL no endpoint `/api/franchise-requests` da Vercel retornou com sucesso `201 Created` e persistência íntegra no banco de dados.
- **Cópia de Backup**: Cópia de referência dos arquivos do WordPress para `legacy-static` concluída com sucesso.
- **Migração Histórica**: Processado o dump SQL do WordPress em memória e importados 11 leads de candidaturas de franquia com sucesso para o banco de dados PostgreSQL de produção na VPS.
- **Crawler & Download Estático**: Executado o download estático das páginas principais (index, contact, franchising, about-us, products) de `acaidarose.pt`, convertendo os caminhos para relativos e injetando o script CORS AJAX de formulários para se comunicar com `api.acaidarose.pt`.
- **Ajustes Visuais (franchising.html)**: Corrigido o alinhamento do título do Subheader (alinhado à esquerda com limite de 50% para não sobrepor o boneco roxo) e aplicada uma estilização premium e moderna nos inputs do formulário, checkboxes, selects e botão de submissão.
- **Atualização de Rodapé (Todos os HTMLs)**: Atualizado o ano do copyright para 2026 e removido o link da "Agencia Save" de todos os 5 arquivos de páginas estáticas em `legacy-static/`.
- **Migração de DNS & Cloudflare**: Domínio migrado com sucesso para o Cloudflare (Nameservers `bonnie.ns.cloudflare.com` e `rex.ns.cloudflare.com` ativos). Configurada criptografia no modo **Flexible SSL**.
- **Deploy Otimizado na VPS**: Desenvolvido script de deploy automatizado (`fast-deploy.js`) que enviou os arquivos estáticos de assets e HTML compactados (213 MB) via SCP para a VPS e descompactou via SSH em `/root/acaidarose/legacy-static/`.
- **Configuração do Nginx na VPS**: Criados manualmente os arquivos de configuração do Nginx (`acaidarose.pt.conf` e `api.acaidarose.pt.conf`) na pasta `/etc/icontainer/apps/nginx/nginx/conf/conf.d/` da VPS. Mapeados os arquivos estáticos para `/www/sites/acaidarose.pt/index` e configurado proxy reverso para `api.acaidarose.pt` apontando para a Vercel.
- **Validação Local**: Testes de cURL locais confirmaram resposta `200 OK` do Nginx para o site estático e redirecionamento transparente de cabeçalhos (`X-Vercel-Cache`) para a API de produção.
