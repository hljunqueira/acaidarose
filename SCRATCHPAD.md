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
