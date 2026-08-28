# Walkthrough — Migração PostgreSQL 16, Eliminação de Mocks e UX Minimalista

Todas as tarefas solicitadas pelo usuário foram concluídas, testadas e enviadas para produção na Vercel com build validado (`16/16` páginas estáticas geradas com sucesso).

---

## 1. O Que Foi Realizado

### A. Eliminação Total de Mocks e Fallbacks Legados
- O arquivo `lib/supabase/mockStore.ts` (732 linhas) foi **excluído permanentemente**.
- Todas as 8 rotas de API restantes foram migradas para persistência 100% PostgreSQL 16 na VPS:
  - [`app/api/products/route.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/app/api/products/route.ts)
  - [`app/api/orders/route.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/app/api/orders/route.ts)
  - [`app/api/orders/[id]/route.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/app/api/orders/[id]/route.ts)
  - [`app/api/orders/search/route.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/app/api/orders/search/route.ts)
  - [`app/api/qrcode-config/route.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/app/api/qrcode-config/route.ts)
  - [`app/api/ratings/route.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/app/api/ratings/route.ts)
  - [`app/api/reports/day/route.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/app/api/reports/day/route.ts)
  - [`app/api/franchise-requests/route.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/app/api/franchise-requests/route.ts)
  - [`app/api/tenants/[id]/settings/route.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/app/api/tenants/[id]/settings/route.ts)
  - [`app/api/webhooks/ifthenpay/route.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/app/api/webhooks/ifthenpay/route.ts)
- Todos os repositórios (`productsRepository.ts`, `ordersRepository.ts`, `tablesRepository.ts`, `staffRepository.ts`, `tenantsRepository.ts`) operam com SQL direto.

### B. Padrão de Links e QR Codes Oficiais por Número / Nome de Loja
- **Matriz Aveiro (Loja 1)**:
  - ID Canônico: `11111111-1111-1111-1111-111111111111`
  - URL Base: `/menu?loja=aveiro-1&mesa={N}` (reconhece `1`, `aveiro`, `aveiro-1`, `matriz`)
- **Filial Torres Novas (Loja 2)**:
  - ID Canônico: `22222222-2222-2222-2222-222222222222`
  - URL Base: `/menu?loja=torres-novas-2&mesa={N}` (reconhece `2`, `torres-novas`, `torres-novas-2`, `filial-2`)

### C. Fallback Gracioso sem Loja na URL: Modo Catálogo Vitrine (Read-Only)
- Se o cliente abrir apenas `/menu` diretamente (sem parâmetros de mesa):
  - Carrega por padrão a **Matriz Aveiro (Loja 1)**.
  - Ativa o modo **Catálogo Vitrine Digital (Read-Only)**:
    - Oculta o carrinho de compras.
    - Oculta o botão de customização/montagem de taça e checkout.
    - Exibe banner informativo no topo orientando a ler o QR Code da mesa.
    - Clicar nos itens abre modal de visualização de ingredientes e detalhes informativos.
- Se o cliente ler o QR Code físico na mesa (ex: `/menu?loja=aveiro-1&mesa=3`):
  - Ativa o fluxo completo e interativo de personalização, adição ao carrinho e checkout de pagamento.

### D. UX Minimalista sem Emojis
- Varredura completa realizada em todo o projeto.
- Remoção de decorações e emojis nos produtos, tabelas, sidebars e cabeçalhos.

---

## 2. Validação e Evidência de Build

- **TypeScript Check**: `npx tsc --noEmit` ➡️ **0 erros**.
- **Next.js Build**: `npm run build` ➡️ **16/16 páginas estáticas compiladas com sucesso**.
- **Git Deploy**: Commit `4538805` enviado para `origin main` (deploy automático Vercel).
