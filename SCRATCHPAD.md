# Scratchpad — Status de Implementação Açaí da Rose

## ✅ Status Atual: 100% IMPLEMENTADO E HOMOLOGADO EM PRODUÇÃO
- **Data**: 28 de Agosto de 2026
- **Produção**: [https://acaidarose.vercel.app](https://acaidarose.vercel.app)
- **Base de Dados**: PostgreSQL 16.15 na VPS (Latência: ~90ms, Pool Ativo)

---

## 🎯 Entregas Concluídas:

### 1. Nova Arquitetura de Sidebars & Roteamento por Papel
- **`SUPER_ADMIN`**:
  - `CENTRAL MASTER TI & INFRA`: Central TI (Status VPS 95ms), Prevenção & Diagnóstico, Logs & Auditoria TI
  - `FRANQUEADORA MASTER`: Franqueadora Master (DRE & Royalties), Solicitações da Rede, Central de Abastecimento B2B
  - `OPERAÇÃO & ATENDIMENTO`: PDV Balcão & Mesas, Pedidos & KDS Cozinha, Painel TV de Senhas, Gestão de Mesas
  - `CARDÁPIO, MÍDIAS & PREÇOS`: Produtos do Cardápio, Categorias, Menus, Destaques & Stories
  - `GESTÃO DE ESTOQUE & SUPPLY CHAIN`: Gestão de Estoque Local, Reposição com a Matriz (B2B)
  - `CONFIGURAÇÕES DA UNIDADE`: Dados da Loja, Configurações QR Code, Utilizadores & Permissões, Relatórios & Fecho de Caixa
- **`FRANCHISOR_ADMIN`**:
  - `GESTÃO DA REDE & FRANQUIAS` ➡️ `OPERAÇÃO LOJA AVEIRO` ➡️ `ESTOQUE MATRIZ AVEIRO` ➡️ `GESTÃO DA LOJA MATRIZ AVEIRO`
- **`TENANT_ADMIN`**:
  - `OPERAÇÃO & ATENDIMENTO` ➡️ `CARDÁPIO LOCAL` ➡️ `ESTOQUE & ABASTECIMENTO` ➡️ `GESTÃO & CONFIGURAÇÕES DA UNIDADE`
- **`CASHIER`**:
  - `OPERAÇÃO & ATENDIMENTO` (PDV, KDS, Checklist Rápido de Estoque, Fecho de Turno)

### 2. Novas Views Criadas e Integradas:
- `components/admin/dev/DevMasterView.tsx` (`dev_hub`)
- `components/admin/dev/PreventionCenterView.tsx` (`prevention_center`)
- `components/admin/dev/AuditLogsView.tsx` (`audit_logs`)
- `components/admin/supply/SupplyHubView.tsx` (`supply_hub`)
- `components/admin/tv/TVOrdersPanelView.tsx` (`tv_panel`)
- `components/admin/inventory/InventoryManagementView.tsx` (`inventory`)
- `components/admin/inventory/StoreSupplyOrdersView.tsx` (`supply_orders`)

### 3. Persistência 100% PostgreSQL 16 na VPS & Eliminação de Mocks:
- `app/api/auth/login/route.ts` & `lib/api/authGuard.ts`: Autenticação direta com bcryptjs e Tenant Isolation Guard.
- `lib/repositories/tenantsRepository.ts`: CRUD e Overview de rede direto na VPS.
- `lib/repositories/usersRepository.ts`: Gestão de operadores com trava de até 3 caixas.
- `lib/repositories/productsRepository.ts`: Consulta de cardápio e overrides por loja.
- `lib/repositories/ordersRepository.ts`: Inserção atômica de pedidos com trigger de numeração diária (`#001`, `#002`).
- `lib/repositories/inventoryRepository.ts`: Gestão de estoque com alertas de ruptura e pedidos B2B.
- `lib/repositories/cashierRepository.ts`: Fecho de caixa, suprimentos e sangrias.

---

## 🔒 Credenciais Oficiais Homologadas em Produção:
1. `SUPER_ADMIN`: `henriquelinharesjunqueira@gmail.com`
2. `FRANCHISOR_ADMIN`: `franqueadora@acaidarose.pt` (Sede Aveiro)
3. `TENANT_ADMIN`: `gerente.torresnovas@acaidarose.pt` (Filial Torres Novas)
- Palavra-passe padrão: `183834@Hlj`
