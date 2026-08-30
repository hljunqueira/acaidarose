# Documentação Técnica e Funcional das Últimas Modificações

Este documento consolida e detalha todas as atualizações de arquitetura, banco de dados, fluxo de checkout, painel de Smart TV (KDS) e regras de negócio implementadas no sistema **Açaí da Rose**.

---

## 1. Módulo de Pedidos & KDS ("Pedidos QR Code | Balcão")

### 1.1. Renomeação do Título Principal
- **Arquivo**: `components/admin/orders/QRCodeOrdersAdmin.tsx`
- **Alteração**: O cabeçalho foi atualizado de `Pedidos & Comandas` para **`Pedidos QR Code | Balcão`**, refletindo com clareza as duas origens oficiais de pedidos atendidos na loja física.

### 1.2. Transição Direta para o PDV Oficial (Fim do Modal Legado)
- **Problema**: O botão "Nova Comanda" abria um modal legado simplificado que não sincronizava os campos de mesa/nome com a tela de finalização.
- **Solução**:
  - Modal legado `NewOrderManualModal` desativado;
  - O botão "Nova Comanda (PDV)" agora aciona o callback `onOpenPDV={() => setView('pdv')}`, direcionando instantaneamente o operador para a interface completa do PDV Balcão & Mesas;
  - Criada a página de redirecionamento `app/admin/pdv/page.tsx` para garantir que acessos diretos via URL direcionem para `/?view=pdv` sem erros de 404.

### 1.3. Correção do Erro 500 no `UPDATE` de Pedidos
- **Arquivo**: `app/api/orders/[id]/route.ts`
- **Causa Raiz**: A coluna `items_json` no PostgreSQL é do tipo nativo `jsonb`. O placeholder `$8` sem cast explícito em strings JSON gerava falha de parsing no driver `pg`.
- **Solução**: Adicionado o cast explícito `$8::jsonb` na cláusula `SET items_json = $8::jsonb`, permitindo arrastar cards no Kanban, editar itens e alterar status sem falhas de backend.

### 1.4. Correção de Acessibilidade Radix UI (`DialogTitle`)
- **Arquivos**: `components/admin/orders/OrderItemsModal.tsx`, `components/admin/orders/OrderHistoryAuditModal.tsx`
- **Solução**: Inclusão de componentes `<DialogTitle>` estilizados, eliminando os warnings do console do navegador e garantindo conformidade com padrões de acessibilidade (ARIA/Screen Readers).

---

## 2. Painel da Smart TV (Público & Staff)

### 2.1. Controle de Exibição dos Últimos Pedidos Finalizados
- **Arquivos**: `lib/utils/tvBroadcast.ts`, `components/admin/tv/TVOrdersControlView.tsx`, `components/admin/tv/TVOrdersPanelView.tsx`
- **Funcionalidade**:
  - Na aba **Rodapé & Avisos** do painel de controle (Staff), foi adicionado o controle:
    - **`[ ✓ Exibir na TV ]`**: Exibe o marquee contínuo com os últimos pedidos finalizados;
    - **`[ ✕ Ocultar na TV ]`**: Oculta completamente a barra inferior na Smart TV, maximizando o espaço útil para os vídeos gastronômicos e a chamada de senhas ativas;
  - A sincronização ocorre em tempo real entre dispositivos e abas via `BroadcastChannel` (`acai_tv_display_config_channel`) e `localStorage`.

### 2.2. Eliminação de Fallbacks e Limpeza Imediata de Pedidos Excluídos/Cancelados
- **Arquivos**: `components/admin/tv/TVOrdersPanelView.tsx`, `components/admin/orders/QRCodeOrdersAdmin.tsx`
- **Causa Raiz**: A Smart TV retinha dados de chamadas antigas no `localStorage` (`lastCalled` e `calledHistory`) mesmo após a exclusão da comanda no banco.
- **Solução**:
  - O componente `TVOrdersPanelView` valida em tempo real se o pedido em destaque (`heroOrder`) existe na lista ativa do banco de dados com status `READY` ou `PREPARING`. Caso o pedido tenha sido excluído ou cancelado, ele é **purgado na hora da tela da TV**;
  - Se a fila de pedidos prontos estiver zerada, a TV exibe o banner institucional limpo: *"Açaí da Rose · Pronto para Servir com Amor"*;
  - Ao cancelar ou excluir uma comanda no KDS, a função `broadcastTVClearCall(tenantId)` é disparada automaticamente.

---

## 3. Configurações do QR Code & Ementa Digital

### 3.1. Persistência Definitiva no PostgreSQL
- **Arquivo**: `app/api/qrcode-config/route.ts`
- **Tabela Criada**: `store_qrcode_settings`
  ```sql
  CREATE TABLE IF NOT EXISTS store_qrcode_settings (
    tenant_id UUID PRIMARY KEY,
    mode VARCHAR(30) DEFAULT 'ORDER_EMISSION',
    pickup_model VARCHAR(30) DEFAULT 'TV_CALL',
    allow_table_transfer BOOLEAN DEFAULT TRUE,
    allow_mbway_payment BOOLEAN DEFAULT TRUE,
    allow_international_phone BOOLEAN DEFAULT TRUE,
    customer_name_rule VARCHAR(20) DEFAULT 'REQUIRED',
    customer_phone_rule VARCHAR(20) DEFAULT 'REQUIRED',
    customer_nif_rule VARCHAR(20) DEFAULT 'OPTIONAL',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- **Benefício**: Configurações salvas no painel pelo operador ficam permanentemente gravadas no PostgreSQL (eliminando perdas por reciclagem de instâncias serverless no Vercel).

### 3.2. Aplicação Dinâmica no Checkout do Cliente
- **Arquivos**: `app/menu/page.tsx`, `components/menu/CustomerCartSheet.tsx`
- **Comportamento Implementado**:
  - **Pagamento MB WAY (`allowMbwayPayment`)**: Se desativado no painel, o botão de MB WAY é ocultado no telemóvel do cliente e o sistema direciona automaticamente para *"Pagar no Balcão"*;
  - **Regra de Nome (`customerNameRule`)**: Respeita se o nome é obrigatório ou opcional na identificação do pedido;
  - **Regra de Contacto Telefónico (`customerPhoneRule`)**: Oculta o campo se configurado como `NONE`, valida como obrigatório se `REQUIRED` ou permite envio opcional se `OPTIONAL`;
  - **Regra de NIF (`customerNifRule`)**: Oculta o campo de contribuinte se `NONE`, valida se `REQUIRED` ou mantém como `OPTIONAL`;
  - **Modelo de Entrega (`pickupModel`)**:
    - `TV_CALL`: Exibe badge informativo *"📺 Chamada na Smart TV"*;
    - `TABLE_SERVICE`: Exibe badge informativo *"🛎️ Serviço de Mesa: Levamos o seu açaí diretamente à mesa"*;
  - **Modo Catálogo (`mode === 'VIEW_ONLY'`)**: Desativa a finalização de pedidos pelo telemóvel, orientando o cliente a fazer o pedido diretamente no balcão.

---

## 4. Resumo dos Arquivos Modificados

| Arquivo | Descrição das Modificações |
|---|---|
| `app/api/qrcode-config/route.ts` | Conexão `GET` e `PUT` à tabela `store_qrcode_settings` no PostgreSQL. |
| `app/api/orders/[id]/route.ts` | Correção do cast `$8::jsonb` no UPDATE e tratamento de exclusão de comandas. |
| `app/menu/page.tsx` | Propagação de `qrConfig` para o componente de checkout `CustomerCartSheet`. |
| `components/menu/CustomerCartSheet.tsx` | Validações dinâmicas de campos (Nome, Telefone, NIF), métodos de pagamento e badges de atendimento. |
| `components/admin/orders/QRCodeOrdersAdmin.tsx` | Renomeação para "Pedidos QR Code \| Balcão", redirecionamento para o PDV oficial e emissão de `broadcastTVClearCall`. |
| `components/admin/tv/TVOrdersControlView.tsx` | Seletor para ocultar/exibir a barra de últimos pedidos finalizados na Smart TV. |
| `components/admin/tv/TVOrdersPanelView.tsx` | Validação estrita de pedidos ativos, remoção de fallbacks e suporte à ocultação do rodapé. |
| `lib/utils/tvBroadcast.ts` | Módulo de broadcast para sincronização de configurações de exibição da TV em tempo real. |
