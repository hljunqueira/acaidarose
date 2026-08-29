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

---

## 3. Integração e Migração do WordPress (Fase 1 e 3)

### A. Cópia e Substituição de Arquivos
- Pasta `legacy-static` limpa e atualizada com o backup do WordPress original (`public_html`). Os arquivos PHP e `wp-content` foram copiados como referência de design de marketing.
- **Download Estático Efetuado**: Executado o download das páginas públicas do site online (`index.html`, `contact.html`, `franchising.html`, `about-us.html`, `products.html`) e reescrita das URLs de assets absolutos por caminhos locais (ex: `/wp-content/`).
- **Integração de Formulários CORS**: Injetado script JavaScript interceptador de `submit` nos arquivos HTML que converte os campos do formulário para o payload esperado e envia via AJAX (`fetch`) diretamente para a API `https://api.acaidarose.pt/api/franchise-requests`.
- **Ajustes Visuais (franchising.html)**: Redesenhamos o Subheader para alinhar o título "Seja um Franchisado" à esquerda com um limite de 50% de largura, evitando sobreposição e corte com o boneco 3D na direita. Estilizamos o formulário de candidaturas para torná-lo premium e responsivo (bordas arredondadas de 10px, padding interno generoso de 20px, inputs e selects com foco iluminado em vermelho da marca, e botão de envio moderno arredondado com efeito hover).
- **Atualização de Rodapé (Copyright 2026)**: Desenvolvemos e rodamos um utilitário para atualizar em lote o copyright de rodapé em todos os 5 arquivos de páginas estáticas (`about-us.html`, `contact.html`, `franchising.html`, `index.html`, `products.html`) para "Todos os Direitos reservados ao Açai da Rose - 2026", removendo a menção à agência externa conforme solicitado.




### B. Patch de Esquema no PostgreSQL de Produção
- Aplicado patch via script direto no banco de dados Postgres de produção da VPS para criar as colunas e relaxar as constraints de tipo na tabela `franchise_requests` para suportar candidaturas de franquia (`FRANCHISE_APPLICATION`).
- Teste cURL validado via terminal contra a rota de API na Vercel `/api/franchise-requests` obtendo sucesso absoluto (`201 Created`).

### C. Importação dos Dados Históricos do WordPress
- Executado script customizado (`migrate-wp-leads-from-sql.js`) para ler em memória o dump do MySQL do WordPress (`u902934419_crV5L.sql`), parsear as 39 submissões do Elementor Pro e SureForms, identificar 12 leads elegíveis de franquia e importá-los com sucesso para a tabela `franchise_requests` do Postgres.

### D. Migração de DNS, Cloudflare e Deploy Estático na VPS
- **Nameservers da Cloudflare**: Alterados com sucesso na raiz do registrador do domínio `.pt` para `bonnie.ns.cloudflare.com` e `rex.ns.cloudflare.com`.
- **Flexible SSL**: Ativada a criptografia SSL/TLS no Cloudflare no modo **Flexible**, garantindo HTTPS instantâneo para todos os visitantes do domínio sem necessidade de gerenciar certificados SSL manuais na VPS.
- **Deploy Otimizado de Assets**: Criado e rodado o script utilitário `fast-deploy.js` que compactou os arquivos estáticos e de imagens de `legacy-static` em um ZIP leve de 213 MB (excluindo arquivos `.php` redundantes por robocopy), transferiu para a VPS via SCP e descompactou via SSH em `/etc/icontainer/apps/nginx/nginx/www/sites/acaidarose.pt/index`.
- **Configurações Nginx da VPS**:
  - `acaidarose.pt.conf`: Criado no host em `/etc/icontainer/apps/nginx/nginx/conf/conf.d/` para servir o site estático no diretório `/www/sites/acaidarose.pt/index` na porta 80.
  - `api.acaidarose.pt.conf`: Criado no host para atuar como proxy reverso para `https://acaidarose.vercel.app` na porta 80, garantindo o envio CORS de formulários para a Vercel.
  - Executado o reload no container Nginx: `docker exec ic-nginx-PHXo nginx -s reload`.
- **Validação com cURL**: Testes de requisição HTTP simulando o Host `acaidarose.pt` e `api.acaidarose.pt` retornaram `200 OK` (com o tamanho e Etag do index estático) e os cabeçalhos de resposta corretos da Vercel (`X-Vercel-Cache`).

