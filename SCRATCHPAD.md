# Scratchpad & Histórico de Sessões

## Tarefas Concluídas
- [x] **Desacoplamento e Reestruturação das Lojas Demo**:
  - Franqueadora mantida na Sede Central de Torres Novas (`super@acairose.pt`).
  - Lojas franqueadas estruturadas: Loja 1 Lisboa (Parque das Nações), Loja 2 Santarém e Loja 3 Aveiro.
- [x] **Módulo de Ofertas & Promoções no Cardápio**:
  - Store reativa `offersStore.ts` com suporte a campanhas de rede e ofertas locais com horários e cupons.
  - Painel administrativo `MenuOffersAdmin.tsx` com divisão Franqueadora vs Franqueado.
  - Exibição de preços promocionais De / Por e seção de ofertas ativas no cardápio QR Code (`CustomerMenuHome.tsx` e `CustomerProductDetail.tsx`).
- [x] **Grupo Atendimento & Salão (Fluxo Ponta a Ponta)**:
  - Drag & Drop com mouse nos cards de pedidos do Kanban (`QRCodeOrdersAdmin.tsx`).
  - Semáforo de tempo de espera (SLA: Verde 0-5m, Amarelo 5-10m, Vermelho >10m).
  - Filtro rápido de origem (Todos, Mesas/QR Code, Balcão/Take-Away).
  - **5ª Coluna: Pedidos Cancelados (`CANCELLED`)** no Kanban com seleção de motivo para auditoria (`CancelReasonDialog.tsx`).
  - **Fluxo de Salão Corrigido**: Clique na mesa abre direto o pedido com botão de **Receber / Cobrar** em vez de forçar montador balcão (`TablesHallView.tsx` e `mockStore.ts`).
  - **Eliminação de Loops e Botão Voltar**: Migrado para `selectedTableId` estável (string primitiva) derivando a mesa diretamente de `tables`, eliminando qualquer ciclo de re-render e garantindo retorno instantâneo do botão `<- Voltar para Salão de Mesas`.
  - Botão Chamar Garçom com motivos rápidos de 1 toque (*Atendimento / Dúvida*, *Talheres / Guardanapos*) e ticket térmico (`CallWaiterModal.tsx`).
  - Regra de ouro: Pagamento confirmado no PDV antes do disparo da comanda para a impressora térmica (`TableCheckoutDetail.tsx`).
- [x] Validação TypeScript com 0 erros (`npx tsc --noEmit`).
