# SCRATCHPAD - Status de Implementação

## [Status Atual: 22/11/2026]

### Problemas Solucionados & Validados em Produção Live (Commit `17ca2de8`):

1. **Ordem Canônica dos Opcionais (Admin, Menu do Cliente e PDV)**:
   - Saneado o banco de dados de produção: atualizado `display_order` canônico de 1 a 12 em `product_option_models`.
   - Reordenados todos os arrays `option_groups` de `product_containers` (inclusive copos e taças Somente Creme) para a sequência padrão:
     1. Cremes Gelados & Bases
     2. Frutas Frescas Selecionadas
     3. Acompanhamentos Tradicionais
     4. Caldas Nobres & Especiais
     5. Quer talher extra?
   - `CustomerProductDetail.tsx` e `PDVItemOptionsModal.tsx` agora realizam ordenação estável por `displayOrder` antes de renderizar os grupos.

2. **Escala de Preços de Caldas Nobres por Tamanho de Recipiente**:
   - Ao alterar os valores para 750g e 1kg (Creme de Pistache +€4,00, Nutella +€2,00, Creme Ninho +€2,00), os copos menores (250g, 350g, 500g) tinham herdado os valores grandes porque o modelo de opções mestre era compartilhado globalmente.
   - `productsRepository.ts` agora aplica a escala proporcional de porção por peso de forma nativa:
     - **Copos até 500g (250g, 350g, 500g)**: Creme de Pistache: +€2,00 | Nutella: +€1,00 | Creme Ninho: +€1,00
     - **Taças / Caixas (750g e 1kg)**: Creme de Pistache: +€4,00 | Nutella: +€2,00 | Creme Ninho: +€2,00

3. **Correção do Bug do Morango ("Aparece e some de novo")**:
   - Diagnosticado no banco: a tabela `store_product_overrides` continha 15 registros órfãos antigos com `is_visible: false` vinculados ao texto `'morango'` e a UUIDs legados.
   - O diálogo `ProductEditDialog.tsx` executava um loop agressivo salvando overrides de todas as opções a cada salvamento do formulário de produto, reintroduzindo o status invisível.
   - Loop automático removido de `ProductEditDialog.tsx`.
   - `toggleStoreItemStatus` no backend agora resolve o nome do item a partir do código (`FRU-004`) e sincroniza todos os identificadores simultaneamente.
   - Banco de dados de produção limpo com Morango (`FRU-004`) 100% ativo e visível em todas as lojas.
