# Padrões de Código, Arquitetura Limpa & Convenções de Nomenclatura
**Açaí da Rose — Guia de Organização de Diretórios, Componentes, Rotas e Manutenção de Longo Prazo**

---

## 1. Visão Geral da Arquitetura do Projeto

Para garantir que o projeto seja facilmente sustentável por novos desenvolvedores e equipe de TI ao longo dos anos, o **Açaí da Rose** segue os princípios de **Clean Architecture & Feature-Driven Structure**:

```
acaidarose/
├── app/                  # Rotas do Next.js 15 (App Router) e APIs Backend
│   ├── api/              # Endpoints REST atômicos (/api/**/route.ts)
│   ├── dev/              # Rota da Central Master de TI (/dev/page.tsx)
│   ├── login/            # Rota de Autenticação (/login/page.tsx)
│   ├── menu/             # Ementa Digital Pública (/menu/page.tsx)
│   ├── receipt/          # Comprovativo Digital do Pedido (/receipt/page.tsx)
│   ├── layout.tsx        # Layout raiz com Fontes e Provedores
│   └── page.tsx          # Ponto de entrada com chaveador de contexto
├── components/           # Componentes React Modulares organizados por Domínio
│   ├── admin/            # Telas de Gestão Administrativa
│   │   ├── company/      # Configurações fiscais da loja
│   │   ├── franchise/    # Módulos corporativos da Franqueadora
│   │   ├── inventory/    # Gestão de estoque e supply chain
│   │   ├── menu/         # Gestão de taças, bases e toppings
│   │   ├── orders/       # Histórico de pedidos e comandas
│   │   ├── qrcode/       # Configurações da ementa digital
│   │   ├── reports/      # DRE, vendas e relatórios de turno
│   │   ├── staff/        # Colaboradores e garçons
│   │   ├── tables/       # Mapa de mesas e salão
│   │   └── users/        # Utilizadores e permissões
│   ├── auth/             # Modais de login e seleção de loja
│   ├── kds/              # Esteira de produção da cozinha
│   ├── landing/          # Seções do site institucional público
│   ├── layout/           # Topbar, Sidebar, Drawer Mobile, Theme
│   ├── pdv/              # Ponto de venda balcão e montador de açaí
│   └── ui/               # Componentes atômicos do Design System (shadcn)
├── docs/                 # Documentação Técnica e Operacional Oficial (23 Guias)
├── hooks/                # Custom Hooks React reutilizáveis
├── lib/                  # Regras de Negócio, Stores, Repositórios e Serviços
│   ├── db/               # Cliente de Conexão com PostgreSQL 16
│   ├── i18n/             # Dicionários de Mensagens Amigáveis (PT-PT)
│   ├── notifications/    # Sintetizador de Áudio Chime e Web Push
│   ├── repositories/     # Camada de Acesso a Dados SQL (Zero Mocks)
│   ├── services/         # Lógica de Negócio (Estoque, Royalties, Fiscal)
│   └── stores/           # Gerenciadores de Estado Zustand
├── public/               # Mídias estáticas, logos oficiais e vídeos
├── supabase/             # Schemas SQL de produção e migrações
└── types/                # Definições estritas de TypeScript
```

---

## 2. Convenções de Nomenclatura de Arquivos

### A. Rotas do Next.js vs. Componentes de Visualização
* ⚠️ **Apenas arquivos dentro de `/app` devem usar `page.tsx`**:
  - `app/login/page.tsx`
  - `app/menu/page.tsx`
* 🛡️ **Componentes dentro de `/components` NUNCA devem usar o sufixo `Page.tsx`**:
  - Em vez de `FranchiseCorporatePage.tsx`, utiliza-se **`FranchiseCorporateView.tsx`**.
  - Em vez de `ReportsPage.tsx`, utiliza-se **`ReportsModuleView.tsx`**.

### B. Sufixos Semânticos Padronizados para Componentes:
| Tipo de Componente | Sufixo Obrigatório | Exemplo Real no Projeto |
| :--- | :--- | :--- |
| **Tela / Visualização Principal** | `*View.tsx` | `TablesHallView.tsx`, `QRCodeConfigView.tsx` |
| **Modais & Janelas de Diálogo** | `*Dialog.tsx` ou `*Modal.tsx` | `SafeConfirmDialog.tsx`, `EditRoyaltyDialog.tsx` |
| **Cards de Resumo & Métricas** | `*Card.tsx` | `StoreMetricsCard.tsx`, `ServerMetricsCard.tsx` |
| **Tabelas de Dados & Listagens** | `*Table.tsx` ou `*List.tsx` | `OrdersHistoryTable.tsx`, `BasesList.tsx` |
| **Hooks Customizados** | `use*.ts` | `useToast.ts`, `useNetworkStatus.ts` |
| **Stores Zustand** | `*Store.ts` | `authStore.ts`, `franchiseStore.ts` |
| **Repositórios de Banco** | `*Repository.ts` | `ordersRepository.ts`, `tenantsRepository.ts` |

---

## 3. Regras de Ouro para Manutenção e Novos Desenvolvimentos

1. **Zero Queries SQL Dentro dos Componentes**:
   - Componentes React realizam chamadas para endpoints em `/api/**` ou consomem Repositórios em `lib/repositories/`.
2. **Tipagem TypeScript Estrita (`noImplicitAny`)**:
   - Todas as entidades consomem os tipos centrais em `types/database.ts` e `types/auth.ts`.
3. **Strings e Feedbacks em PT-PT Semântico**:
   - Utilizar sempre o dicionário [`lib/i18n/errorMessages.ts`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/lib/i18n/errorMessages.ts) para mensagens amigáveis ao utilizador.
4. **Isolamento de Estado (Multi-Tenancy)**:
   - Todo repositório ou rota de API deve receber e filtrar obrigatoriamente por `tenant_id`, exceto em operações exclusivas do `SUPER_ADMIN`.
