# Guia Passo a Passo Detalhado: Migração e Colocação em Produção
**Açaí da Rose — Roteiro de Engenharia para Entrada em Produção (Go-Live)**

---

## 1. Visão Geral do Roteiro de Go-Live

Este documento estabelece o **passo a passo cronológico e técnico** para migrar o sistema do estado atual (ambiente de desenvolvimento com mocks em memória) para a **operação real de produção na VPS dedicada (`198.50.117.110`)**.

```mermaid
flowchart TD
    F1["Fase 1: Infraestrutura & Banco na VPS"] --> F2["Fase 2: Remoção dos Mocks & Repositórios SQL"]
    F2 --> F3["Fase 3: Telas de Frente de Loja (TV Chamada, Stories & Central TI)"]
    F3 --> F4["Fase 4: Gateways de Pagamento (MB WAY) & Fiscalidade AT"]
    F4 --> F5["Fase 5: Build de Produção, Deploy & Testes de Ponta a Ponta"]
    F5 --> F6["Fase 6: Rotinas de Backup & Telemetria Automática"]
```

---

## 2. Passo a Passo Detalhado por Fases

---

### 🟢 FASE 1: Preparação do Ambiente na VPS (`198.50.117.110`)

* [x] **Passo 1.1 — Hardening & Segurança do Sistema Operacional** *(Concluído)*
  - Firewall UFW ativo, Fail2ban ativo, 2 GB Swap e fuso horário `Europe/Lisbon`.
* [ ] **Passo 1.2 — Criar Estrutura de Diretórios na VPS**
  ```bash
  mkdir -p /root/acaidarose/{data,config,backups,ssl}
  ```
* [ ] **Passo 1.3 — Subir Instância Dedicada do PostgreSQL 16 com Docker**
  - Criar `/root/acaidarose/docker-compose.yml` contendo container `postgres:16-alpine` com volume persistente em disco NVMe.
* [ ] **Passo 1.4 — Executar o Schema Relacional Completo**
  - Aplicar o script SQL consolidado contendo todas as tabelas:
    - `tenants` (Lojas Torres Novas e Aveiro)
    - `users` (Super Admin, Gerentes e Caixas)
    - `product_containers`, `product_bases`, `product_toppings` (Catálogo canônico)
    - `restaurant_tables`, `orders`, `cashier_shifts`
    - `store_stories` (Cardápio em Vídeo)
    - `store_devices` (Tokens de Smart TVs e Totens)
    - `inventory_items`, `store_inventory`, `supply_orders`, `inventory_audits` (Estoque e Compras)

---

### 🟢 FASE 2: Conexão da Camada de Dados & Remoção Completa dos Mocks

* [ ] **Passo 2.1 — Configuração de Variáveis de Produção**
  - Criar `.env.production` no projeto:
    ```env
    DATABASE_URL=postgresql://acai_user:SENHA_FORTE@127.0.0.1:5432/acaidarose_prod
    NEXT_PUBLIC_APP_URL=https://app.acairose.pt
    NODE_ENV=production
    ```
* [ ] **Passo 2.2 — Refatorar os 6 Repositórios (Mocks ➡️ SQL Real)**
  1. `lib/repositories/productsRepository.ts`: Consultas reais de recipientes, bases, toppings e tabela de overrides de preços por filial.
  2. `lib/repositories/ordersRepository.ts`: Inserção atômica de pedidos com numeração sequencial diária por loja e status no KDS.
  3. `lib/repositories/tablesRepository.ts`: Ocupação de mesas em tempo real, pedidos acumulados e chamados de garçom.
  4. `lib/repositories/tenantsRepository.ts`: CRUD de franquias, NIF e configurações bancárias/fiscais.
  5. `lib/repositories/cashierRepository.ts`: Controle de turnos de caixa, suprimentos, sangrias e relatório financeiro de fechamento.
  6. `lib/repositories/usersRepository.ts`: Autenticação e controle de níveis de acesso (`SUPER_ADMIN`, `TENANT_ADMIN`, `CASHIER`).
* [ ] **Passo 2.3 — Eliminar `lib/supabase/mockStore.ts` do Ciclo de Vida do Sistema**.

---

### 🟢 FASE 3: Implementação dos Novos Módulos de Frente de Loja

* [ ] **Passo 3.1 — Rota da TV de Chamadas (`/chamada?loja=...`)**
  - Criar página em tela cheia com colunas *Preparando* vs *Pronto para Retirada*, alerta sonoro (*Chime/Ding-Dong*) e reconexão automática.
* [ ] **Passo 3.2 — Carrossel de Stories em Vídeo no Cardápio Mobile (`/menu?loja=...`)**
  - Adicionar o carrossel de microvídeos no topo com anéis gradientes neon e modal de visualização vertical estilo Reels com botão *"Quero Este"*.
* [ ] **Passo 3.3 — Central Master de TI (`/dev` ou `/admin/master`)**
  - Implementar o painel para você com: seletor de troca de loja (*Impersonate*), hub de links diretos de cada franquia e gerador de tokens de Smart TVs.

---

### 🟢 FASE 4: Integração Fiscal (AT) & Meios de Pagamento em Portugal

* [ ] **Passo 4.1 — Gateway MB WAY (Mobile)**
  - Configurar API do provedor em Portugal (*Ifthenpay* ou *Eupago*) para disparar push de pagamento direto para o telemóvel do cliente.
* [ ] **Passo 4.2 — Integração com Motor Fiscal Certificado pela AT**
  - Conectar API do *Moloni* ou *Vendus* para emissão automática de **Faturas Simplificadas** com código **ATCUD**, **QR Code fiscal** e geração do **SAF-T (PT)** mensal.
* [ ] **Passo 4.3 — TPA Multibanco de Balcão**
  - Homologar o fluxo de conferência de pagamento via terminal físico no PDV.

---

### 🟢 FASE 5: Build de Produção, Deploy & Validação

* [ ] **Passo 5.1 — Executar Build Otimizado do Next.js 15**
  ```bash
  npm run build
  ```
* [ ] **Passo 5.2 — Subir o Container da Aplicação na VPS**
  - Configurar o container `acaidarose-app` rodando Next.js 15 Standalone.
* [ ] **Passo 5.3 — Configurar Roteamento HTTPS no Nginx / Caddy**
  - Apontar o domínio da loja (ex: `app.acairose.pt` ou subdomínio) com certificado SSL Let's Encrypt automático.
* [ ] **Passo 5.4 — Teste de Homologação Ponta a Ponta**:
  1. Fazer pedido pelo QR Code da mesa no telemóvel;
  2. Verificar entrada instantânea no KDS da cozinha;
  3. Mover pedido para "Pronto" e verificar chamada na Smart TV com som;
  4. Realizar venda direta no PDV Balcão e imprimir/fechar fatura;
  5. Fechar o caixa e conferir relatório do dia.

---

### 🟢 FASE 6: Rotinas de Backup & Manutenção Automática

* [ ] **Passo 6.1 — Script de Backup Diário do PostgreSQL**
  - Configurar Cron Job diário (`03:00 AM`) que executa `pg_dump`, compacta em `.sql.gz` e mantém histórico dos últimos 30 dias em `/root/acaidarose/backups/`.
* [ ] **Passo 6.2 — Monitoramento de Recursos da VPS**
  - Telemetria de CPU, RAM e integridade de disco integrada à Central Master de TI.

---

## 3. Matriz de Responsabilidades & Ordem de Execução Recomendada

| Etapa | Ação Imediata | Tempo Estimado | Dependência |
| :--- | :--- | :---: | :--- |
| **1. Banco Real** | Subir Postgres na VPS + Executar SQL do Schema | ~30 min | VPS Pronta ✅ |
| **2. Repositórios** | Migrar `productsRepository` e `ordersRepository` | ~1h | Banco Real |
| **3. Novos Módulos**| Criar tela `/chamada` (TV) e Central `/dev` | ~1h30 | Repositórios |
| **4. Deploy Go-Live**| Build Next.js + Subir container na VPS | ~30 min | Módulos Prontos |
| **5. Pagamento/Fiscal**| Conectar chaves MB WAY e Moloni/Vendus | ~1h | Contratos/Chaves |
