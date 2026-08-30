# SCRATCHPAD - Açaí da Rose

## Status Atual
- **Configurações de QR Code & Ementa Digital**:
  - Tabela `store_qrcode_settings` criada no PostgreSQL para persistência multi-tenant permanente.
  - Endpoints `GET` e `PUT` `/api/qrcode-config` 100% integrados ao banco de dados.
  - Checkout do cliente (`CustomerCartSheet.tsx`) respeitando dinamicamente todas as regras: controle de MB WAY, regras de campos (Nome, Telefone, NIF), modelo de atendimento (TV vs Mesa) e modo de visualização.
- **Painel de Smart TV (KDS)**:
  - Eliminados quaisquer fallbacks antigos de chamadas na TV (`TVOrdersPanelView.tsx`). A TV valida estritamente os pedidos ativos no banco de dados e remove instantaneamente comandas canceladas ou excluídas.
  - Adicionado controle de exibição da barra de "Últimos Pedidos Finalizados" no rodapé da Smart TV (`broadcastTVDisplayConfig`).
  - Disparo de `broadcastTVClearCall` ao excluir ou cancelar comandas no KDS.
- **Módulo de Pedidos ("Pedidos QR Code | Balcão")**:
  - Título atualizado no KDS (`QRCodeOrdersAdmin.tsx`).
  - Botão "Nova Comanda (PDV)" conectado para comutar diretamente para a interface completa do PDV Balcão & Mesas (`view: 'pdv'`).
  - Rota `app/admin/pdv/page.tsx` criada para redirecionamento limpo para `/?view=pdv`.
  - Corrigido o erro 500 no `UPDATE` de pedidos no PostgreSQL com cast `$8::jsonb` na coluna `items_json`.
  - Corrigidos warnings de acessibilidade Radix UI com a adição de `<DialogTitle>` nos modais de itens e auditoria.
- **Compilação & Deploy**:
  - `npx tsc --noEmit` validado com 0 erros.
  - Todas as modificações commitadas e enviadas para `origin main`.
