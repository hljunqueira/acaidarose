# Arquitetura de Layout, Sidebar & Painéis por Perfil e Role
**Açaí da Rose — Mapeamento Detalhado de Páginas, Componentes e Navegação por Perfil de Acesso**

---

## 1. Visão Geral dos 4 Painéis Isolados

O sistema opera com **4 painéis independentes**, garantindo que cada utilizador visualize apenas os módulos, dados e funcionalidades pertinentes ao seu nível de autorização:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ESTRUTURA DE PAINÉIS DO SISTEMA AÇAÍ DA ROSE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🖥️ PAINEL 1: CENTRAL DE TI MASTER      │ SUPER_ADMIN (Henrique)             │
│    -> Acesso total irrestrito, servidor, logs, provisionador e hardware     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🏢 PAINEL 2: PAINEL DA FRANQUEADORA    │ FRANCHISOR_ADMIN (Sede Aveiro)     │
│    -> Gestão de toda a rede, DRE global, royalties, B2B e PDV Aveiro        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🍨 PAINEL 3: PAINEL DA LOJA FRANQUEADA │ TENANT_ADMIN (Gerente Torres Novas)│
│    -> Gestão exclusiva da filial, equipe, estoque, fecho e pedidos B2B      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 💳 PAINEL 4: PAINEL OPERADOR DE CAIXA  │ CASHIER (Operador de Balcão)       │
│    -> PDV rápido, comandas de mesas, KDS e fecho do seu turno               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detalhamento das Páginas e Componentes por Perfil

---

### 🖥️ PAINEL 1: CENTRAL DE TI MASTER (`SUPER_ADMIN` — Henrique)
*Escopo: Infraestrutura, integridade dos servidores, banco de dados, observabilidade e governança técnica global.*

| Módulo / Página | Rota / ID View | Componentes & Modais Principais | Descrição & Funcionalidades |
| :--- | :--- | :--- | :--- |
| **Status da VPS & Servidores** | `/dev/server-status` | `ServerMetricsCard`, `VPSResourceGauge` | Monitoramento em tempo real de 4 vCPUs AMD EPYC, 6 GB RAM, 100 GB NVMe, Uptime e Latência. |
| **Live Error Stream & Logs** | `/dev/logs` | `LiveErrorStreamTable`, `JsonPayloadViewerModal` | Rastreamento de erros do browser (`navigator.sendBeacon`) e backend com stack trace e contexto. |
| **Wizard de Provisionamento** | `/dev/franchise-wizard` | `ProvisionFranchiseWizardModal`, `StepByStepCloner` | Criador de filiais em 1 clique: gera loja, clona catálogo, cria mesas, usuário gerente e emite tokens. |
| **Tokens de Dispositivos** | `/dev/device-tokens` | `DeviceTokensGrid`, `GenerateTokenDialog`, `SafeRevokeModal` | Emissão e revogação de tokens de autenticação para Smart TVs, tablets KDS, totens e TPAs. |
| **Banco de Dados & Backups** | `/dev/database` | `PostgresHealthCard`, `BackupHistoryTable`, `TriggerBackupButton`| Status do PostgreSQL 16, logs do cron diário (03:00 AM) e teste de integridade de dumps. |
| **Modo Impersonate Global** | `Topbar Global` | `ImpersonateDropdownSelector`, `ExitImpersonateBanner` | Permite ao TI entrar como qualquer Franqueadora ou Loja instantaneamente para suporte técnico. |

---

### 🏢 PAINEL 2: PAINEL CORPORATIVO DA FRANQUEADORA (`FRANCHISOR_ADMIN` — Sede Aveiro)
*Escopo: Gestão executiva de toda a rede de franquias, faturamento consolidado, aprovação de cardápio e PDV Matriz.*

| Módulo / Página | Rota / ID View | Componentes & Modais Principais | Descrição & Funcionalidades |
| :--- | :--- | :--- | :--- |
| **DRE Consolidado da Rede** | `/admin/corporate-dre` | `NetworkFinancialSummary`, `StoresRevenueRankingChart` | Faturamento global, ticket médio da rede, faturamento por loja (Aveiro vs Torres Novas) e métodos de pagamento. |
| **Royalties & Fundo Marketing**| `/admin/royalties` | `RoyaltiesTable`, `CalculateRoyaltiesModal`, `InvoiceExporter`| Cálculo automático de 5% de royalties e 1% de marketing por filial com relatórios de liquidação. |
| **Gestão de Lojas Franqueadas**| `/admin/franchises` | `FranchiseCardsGrid`, `EditFranchiseModal`, `StoreContractViewer` | Cadastro e edição de unidades franqueadas, NIFs, moradas, contatos e percentuais contratuais. |
| **Triagem de Solicitações** | `/admin/franchise-requests`| `MenuRequestsReviewModal`, `ApproveWithNotesDialog` | Fila de aprovação de reajustes de preço, indisponibilidade e novos itens das filiais com badge no menu. |
| **Catálogo Mestre da Rede** | `/admin/master-menu` | `ContainerEditorDialog`, `BasesManager`, `ToppingsAllergenTable`| Criação oficial de taças, sorbets, bases, toppings e alérgenos com replicação para todas as lojas. |
| **Portal B2B de Abastecimento**| `/admin/supply-orders` | `SupplyOrdersTriagingTable`, `B2BFulfillmentModal` | Recebimento, separação e faturamento de pedidos de insumos enviados pelas filiais para a Matriz Aveiro. |
| **Vídeos & Stories Oficiais** | `/admin/stories` | `VideoUploadZone`, `StoriesPreviewPhone`, `ReorderStoriesList` | Upload e distribuição de vídeos institucionais em alta resolução para os cardápios digitais e totens. |
| **PDV Loja Matriz Aveiro** | `/pdv` | `PDVQuickSaleView`, `CashRegisterShiftModal` | Atalho de 1 clique para operar o balcão, caixa e mesas da loja física Matriz de Aveiro. |

---

### 🍨 PAINEL 3: PAINEL DA LOJA FRANQUEADA (`TENANT_ADMIN` — Gerente Filial, ex: Torres Novas)
*Escopo: Gestão operacional e financeira exclusiva da unidade vinculada (isolamento multi-tenant estrito).*

| Módulo / Página | Rota / ID View | Componentes & Modais Principais | Descrição & Funcionalidades |
| :--- | :--- | :--- | :--- |
| **Dashboard & DRE da Filial** | `/admin/dashboard` | `StoreSalesMetricCards`, `DailyRevenueChart`, `HourlyPeakHeatmap`| Vendas do dia, faturamento por turno, número de pedidos e ticket médio da unidade. |
| **PDV Balcão da Loja** | `/pdv` | `AcaiBowlBuilder`, `PaymentMethodSelector`, `ReceiptPrinterModal`| Ponto de venda completo para venda rápida no balcão com cálculo de complementos e troco. |
| **Mapa de Mesas & Salão** | `/admin/tables` | `TableGridEditor`, `LiveTableStatusBadge`, `TransferTableModal` | Gestão de mesas, esplanada, abertura de comandas e visualização de consumo ativo. |
| **KDS Cozinha da Filial** | `/admin/kds` | `KDSOrderCard`, `PrepTimerProgress`, `AudioChimeTrigger` | Painel de produção da cozinha com tempos de preparo, separação por taça e sinal sonoro. |
| **Fecho de Turno & Caixa** | `/admin/cashier-shifts`| `BlindCashCloseModal`, `SangriaSuprimentoDialog`, `CashReportPrint`| Abertura com fundo de troco, retiradas justificadas e conferência cega no fecho do dia. |
| **Equipa & Operadores** | `/admin/staff` | `CashierUsersTable`, `CreateCashierModal`, `ResetPasswordDialog` | Cadastro e controle de colaboradores e operadores de caixa da filial. |
| **Ementa & Pedidos de Preço** | `/admin/menu` | `StorePriceOverrideModal`, `SubmitPriceChangeRequestDialog` | Consulta de taças e envio formal de solicitação de ajuste de preço para a Matriz Aveiro. |
| **Estoque Local & Pedido B2B** | `/admin/inventory` | `StockCountChecklist`, `B2BSupplyOrderCart`, `SavingsCalculator` | Saldo de insumos, contagem de quebras no fecho de caixa e pedido de reposição para a Matriz Aveiro. |
| **Configurações QR Code** | `/admin/qrcode` | `QRCodeConfigView`, `DownloadAllQRPDFButton` | Modos de autoatendimento, ativação de MB WAY, troca inteligente de mesa e exportação de QR Codes. |

---

### 💳 PAINEL 4: PAINEL DO OPERADOR DE CAIXA (`CASHIER` — Operador de Balcão)
*Escopo: Operação ágil de vendas, recebimentos e atendimento no balcão e salão.*

| Módulo / Página | Rota / ID View | Componentes & Modais Principais | Descrição & Funcionalidades |
| :--- | :--- | :--- | :--- |
| **PDV Balcão (Venda Rápida)** | `/pos` | `ContainerSelectorStep`, `BaseSelectorStep`, `ToppingsPickerStep`| Montagem de taça em 3 passos com cálculo de complementos grátis vs extras e total imediato. |
| **Finalização & Pagamento** | `/pos/checkout` | `CashChangeCalculator`, `MBWayPushTrigger`, `TPAConnectorModal` | Pagamento em numerário com troco exato, envio de push MB WAY e terminal Multibanco/TPA. |
| **Comandas de Mesas** | `/pos/tables` | `TableBillSummary`, `SplitBillModal`, `IssueSimplifiedInvoiceDialog`| Lançamento de itens na conta da mesa, fechamento com NIF na fatura e divisão de conta. |
| **KDS de Entrega** | `/pos/delivery-pickup`| `ReadyOrdersList`, `MarkDeliveredButton` | Chamada de pedidos prontos para entrega ao cliente no balcão. |
| **Meu Turno de Caixa** | `/pos/shift` | `OpenShiftModal`, `QuickSangriaModal`, `BlindCloseCountModal` | Abertura com troco inicial, sangria com recibo e fecho do seu turno ao final do expediente. |

---

## 3. Arquitetura do Layout Global & Sidebar

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR GLOBAL UNIFICADA (Altura: 56px - Fixa)                                │
│ [Logo Açaí da Rose] | [Dropdown Filial Ativa ▾] | [Sino Notificações (3)] [👤]│
├─────────────────┬────────────────────────────────────────────────────────────┤
│ SIDEBAR DINÂMICA│ ÁREA DE CONTEÚDO PRINCIPAL (Viewport Dinâmico)             │
│ (240px / 64px)  │                                                            │
│                 │  ┌──────────────────────────────────────────────────────┐  │
│ [Itens filtrados│  │ Header da Página: Título + Botão de Ação Primária    │  │
│  pelo Role do   │  ├──────────────────────────────────────────────────────┤  │
│  utilizador]    │  │ Breadcrumb: Início > Franqueadora > Filiais          │  │
│                 │  │ Grids, Tabelas com Paginação, Modais Minimalistas   │  │
│                 │  └──────────────────────────────────────────────────────┘  │
│ ────────────────│                                                            │
│ 🟢 Online (VPS) │                                                            │
└─────────────────┴────────────────────────────────────────────────────────────┘
```

### Recursos Globais de UX:
1. **Modo Compacto / Ícones (64px)**: Alternável pelo botão no rodapé ou pelo atalho `Ctrl + B` para maximizar a área de trabalho do PDV.
2. **Badges em Tempo Real**:
   - Badge laranja no menu **Solicitações** indicando pedidos pendentes de aprovação na Franqueadora;
   - Badge vermelho no sino indicando chamados de mesa ou alertas de estoque.
3. **Design System Escuro Profundo**: Superfície `#0A0612` / `#160F24`, bordas sutis `#2A1E3D` e botões de ação funcionais sem gradientes excessivos.
