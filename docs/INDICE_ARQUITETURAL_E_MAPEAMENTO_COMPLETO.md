# Índice Arquitetural & Mapeamento Completo do Repositório (100% dos Arquivos)
**Açaí da Rose — Catálogo Completo de Componentes, Stores, Hooks, Serviços, Tipos, APIs e Banco de Dados**

---

## 1. Visão Geral da Estrutura de Diretórios

```
acaidarose/
├── app/                  # Rotas Next.js 15 App Router & 31 API Endpoints
├── components/           # 70+ Componentes de Interface (PDV, Menu, Admin, UI)
├── lib/                  # Stores Zustand, Repositórios, Serviços e Integrações
├── types/                # Definições TypeScript do Domínio e Banco de Dados
├── hooks/                # Custom React Hooks
├── docs/                 # Documentação Técnica, Fiscal, UX e Guias de Produção
├── supabase/             # Schemas DDL e Migrações SQL
└── public/               # Assets estáticos e imagens
```

---

## 2. Inventário Completo da Camada `lib/`

### A. Stores Zustand (`lib/stores/`)
* [`authStore.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/stores/authStore.ts): Estado de autenticação do utilizador, role (`SUPER_ADMIN`, `TENANT_ADMIN`, `CASHIER`) e loja ativa.
* [`cartStore.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/stores/cartStore.ts): Estado do carrinho/cesto de compras (itens montados, bases, toppings, notas e cálculo do subtotal em EUR).
* [`franchiseStore.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/stores/franchiseStore.ts): Seleção de franqueado no painel corporativo e visualização de faturamento por loja.
* [`highlightsStore.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/stores/highlightsStore.ts): Gestão de produtos em destaque na tela inicial do cardápio mobile.
* [`menuConfigStore.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/stores/menuConfigStore.ts): Configuração visual do cardápio (banners, visibilidade de categorias e ordenação).
* [`offersStore.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/stores/offersStore.ts): Promoções ativas, combos e cupões da rede.

### B. Serviços & Integrações (`lib/services/` & `lib/api/`)
* [`ifthenpayService.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/services/ifthenpayService.ts): Comunicação com API do gateway MB WAY em Portugal (disparo de push e verificação de status).
* [`qrCodeService.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/services/qrCodeService.ts): Geração de links seguros para QR Code de mesas físicas e take-away.
* [`authGuard.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/api/authGuard.ts): Middleware interno para proteção de rotas de API por nível de permissão.
* [`response.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/api/response.ts): Padronização de respostas JSON (`success`, `data`, `error`, `statusCode`).

### C. Repositórios de Dados (`lib/repositories/`)
* [`productsRepository.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/repositories/productsRepository.ts): Catálogo canônico, overrides de preço e disponibilidade por loja.
* [`ordersRepository.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/repositories/ordersRepository.ts): Pedidos, KDS, buscas e relatórios diários de vendas.
* [`tablesRepository.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/repositories/tablesRepository.ts): Gestão de mesas, comandas acumuladas e transferências.
* [`tenantsRepository.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/repositories/tenantsRepository.ts): Gestão de lojas, dados fiscais e configurações da franquia.
* [`cashierRepository.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/repositories/cashierRepository.ts): Turnos de caixa, suprimentos, sangrias e conciliação.
* [`usersRepository.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/repositories/usersRepository.ts): Utilizadores, hash de palavra-passe e controle de acessos.
* [`staffRepository.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/repositories/staffRepository.ts): Garçons e operadores de salão.

### D. Utilitários & Internacionalização (`lib/utils/` & `lib/i18n/`)
* [`soundNotification.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/utils/soundNotification.ts): Emissão de alertas sonoros discretos (Chime) no KDS e na Smart TV de chamadas.
* [`formatters.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/i18n/formatters.ts): Formatação de moeda em Euros (`pt-PT`, `EUR`, `12,50 €`) e datas no fuso horário de Lisboa.

---

## 3. Inventário Completo da Camada de Tipos (`types/`)

* [`database.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/types/database.ts): Tipagens TypeScript de todas as tabelas do PostgreSQL (`tenants`, `users`, `orders`, `product_containers`, etc.).
* [`catalog.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/types/catalog.ts): Tipagens de recipientes/taças, bases, toppings, limites de montagem e categorias.
* [`order.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/types/order.ts): Estrutura de itens do pedido, status (`PAID`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`) e pagamentos.
* [`tables.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/types/tables.ts): Status de ocupação de mesas (`FREE`, `OCCUPIED`, `BILL_REQUESTED`) e comanda.
* [`cashier.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/types/cashier.ts): Tipagem de turnos de caixa, suprimentos e sangrias.
* [`tenant.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/types/tenant.ts): Configuração de filial, taxas de royalties, MB WAY e NIF.
* [`auth.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/types/auth.ts): Sessão, perfis e permissões.
* [`staff.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/types/staff.ts): Registros de colaboradores.

---

## 4. Inventário Completo de Hooks (`hooks/`)

* [`use-mobile.jsx`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/hooks/use-mobile.jsx): Detecção responsiva de breakpoint mobile (<768px).
* [`use-toast.js`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/hooks/use-toast.js): Disparo de notificações e toasts na interface.

---

## 5. Matriz Completa de Documentação (`/docs`)

| Documento | Assunto & Finalidade Técnica |
| :--- | :--- |
| 📄 [`GUIA_PASSO_A_PASSO_PRODUCAO.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/GUIA_PASSO_A_PASSO_PRODUCAO.md) | Roteiro mestre de 6 fases para Go-Live na VPS `198.50.117.110`. |
| 📄 [`MAPEAMENTO_COMPLETO_PAGINAS_MODAIS_E_MIGRACAO.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/MAPEAMENTO_COMPLETO_PAGINAS_MODAIS_E_MIGRACAO.md) | Mapeamento 360° de Frontend, 31 rotas de API, 7 Repositórios e 19 tabelas PostgreSQL. |
| 📄 [`ARQUITETURA_INFRAESTRUTURA_E_DOMINIOS.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/ARQUITETURA_INFRAESTRUTURA_E_DOMINIOS.md) | Topologia de VPS, DNS `acaidarose.pt`, PostgreSQL Nativo (~150MB) e Backups às 03:00 AM. |
| 📄 [`ROADMAP_ESTRATEGICO_E_MELHORIAS.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/ROADMAP_ESTRATEGICO_E_MELHORIAS.md) | Planejamento de produto 2026–2027 dividido em 3 horizontes cronológicos. |
| 📄 [`GLOSSARIO_VOCABULARIO_PORTUGAL_PT.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/GLOSSARIO_VOCABULARIO_PORTUGAL_PT.md) | Guia terminológico oficial para Portugal (Taça, Ementa, Telemóvel, NIF, MB WAY). |
| 📄 [`SISTEMA_FISCAL_E_PAGAMENTOS_PORTUGAL.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/SISTEMA_FISCAL_E_PAGAMENTOS_PORTUGAL.md) | Certificação AT (ATCUD, QR Code, SAF-T), MB WAY, TPA, Impressão ESC/POS e RGPD. |
| 📄 [`GESTAO_ESTOQUE_E_SUPPLY_CHAIN_FRANQUIAS.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/GESTAO_ESTOQUE_E_SUPPLY_CHAIN_FRANQUIAS.md) | Estoque híbrido, alertas e Portal B2B de Abastecimento com comparador de economia. |
| 📄 [`TRANSFORMACAO_UX_MENUS_EM_VIDEO.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/TRANSFORMACAO_UX_MENUS_EM_VIDEO.md) | Especificação de design minimalista para Mobile, Totem Kiosk e TV Menu Board. |
| 📄 [`PAINEL_CHAMADA_TV_CLIENTES_ESTILO_FASTFOOD.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/PAINEL_CHAMADA_TV_CLIENTES_ESTILO_FASTFOOD.md) | Painel Smart TV em tempo real para salão com alerta discreto e proteção anti burn-in. |
| 📄 [`CARDAPIO_EM_VIDEO_STORIES_E_FRANQUIAS.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/CARDAPIO_EM_VIDEO_STORIES_E_FRANQUIAS.md) | Arquitetura técnica de mídias com CDN Edge e governança Matriz vs Lojas. |
| 📄 [`CENTRAL_TI_DEV_E_TOKENS_DISPOSITIVOS.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/CENTRAL_TI_DEV_E_TOKENS_DISPOSITIVOS.md) | Console Master `/dev`, troca rápida de loja (*Impersonate*) e tokens de hardware fixos. |
| 📄 [`PLANO_EVOLUCAO_E_COMPARATIVO_IDEAL.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/PLANO_EVOLUCAO_E_COMPARATIVO_IDEAL.md) | Benchmark comparativo do Açaí da Rose vs sistemas de mercado. |
| 📄 [`MAPEAMENTO_BANCO_OIMENU_ABRAHAO.md`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/MAPEAMENTO_BANCO_OIMENU_ABRAHAO.md) | Mapeamento histórico de tabelas e modelos legados. |
