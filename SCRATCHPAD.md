# SCRATCHPAD — Status do Trabalho

## Tarefas Concluídas:
1. **Persistência de Cotas Exatas nos Recipientes (Cremes, Frutas, Toppings)**:
   - Removida a imposição `Number(row.limite_bases) >= 2 ? ... : 2` no `lib/repositories/productsRepository.ts`.
   - Removidos todos os fallbacks estáticos (`?? 1`, `?? 2`, `?? 3`, ternários por gramatura) que impediam salvar cota `0`.
   - Gravado fielmente no PostgreSQL e refletido na API e no cardápio do cliente.
2. **Governança de Modelos de Opções para Franquias (Visibilidade Total sem Edição de Preços/Mídias)**:
   - `components/admin/menu/MenuHierarchyView.tsx`: Botão "Modelos de Opções" liberado para Franqueadora e Franquias.
   - `components/admin/menu/OptionModelsManagerDialog.tsx`:
     - Visibilidade do Modelo (`handleToggleModelActive`) e Edição (`handleOpenEditModel`) liberados para franquias.
     - Duplicar e Excluir mantidos exclusivamente para a Franqueadora Master.
     - Botão `Criar Modelo` restrito à Franqueadora.
   - `components/admin/menu/OptionModelDialog.tsx`:
     - Prop `isSuperAdmin?: boolean` integrada.
     - Para franquias (`!isSuperAdmin`): nomes, preços, regras e mídias bloqueados como `readOnly`/`disabled`.
     - Botão `+ Adicionar Item` e lixeira de exclusão ocultos para franquias.
     - **Botão do Olho (`Eye`/`EyeOff`) 100% ativo e clicável** em cada item de opcional.
     - Botão "Salvar Modelo" ativo para persistir a visibilidade dos itens no banco.
   - `app/api/option-models/[id]/route.ts`:
     - Sanitização estrita no backend: franquias podem alterar SOMENTE a flag `active` do modelo e dos itens. Preços, nomes, regras e novas adições são descartados.
   - `lib/repositories/optionModelsRepository.ts`:
     - Sincronização automática da flag `active` em `product_toppings` e `product_bases` ao salvar o modelo de opções.
3. **Mensagens Amigáveis de Erro em PT-PT**:
   - Criado `lib/utils/friendlyError.ts` com sanitização universal de erros técnicos do PostgreSQL (`users_email_key`, foreign keys, etc.).
   - Re-exportado em `lib/api/response.ts` e consumido em `components/admin/users/UsersAdmin.tsx`.
4. **Isolamento Rigoroso de Visibilidade por Loja (Multi-Tenant Isolation)**:
   - `lib/repositories/optionModelsRepository.ts`: Alterações de visibilidade de itens ou modelos feitas por franquias ou com `applyToAll: false` gravam exclusivamente em `store_product_overrides` por `tenant_id`, sem modificar tabelas mestres globais (`product_option_models`, `product_toppings`, `product_bases`).
   - `getOptionModelsByTenant`: Mescla dinamicamente os overrides de `store_product_overrides` para a loja ativa.
   - `app/api/option-models/[id]/route.ts`: Respeita `applyToAll` e força `applyToAll: false` para franquias.
5. **Modal de Editar Produto para Franquias (Modo Apenas Visibilidade)**:
   - `components/admin/menu/ProductRowItem.tsx`: Adicionado botão `Gerir Opcionais` (`Edit2`) para franqueados, permitindo abrir o modal de edição.
   - `components/admin/menu/ProductEditDialog.tsx`:
     - Modo Franquia (Apenas Visibilidade): campos de mídias, nome, descrição, categoria, cotas e preços bloqueados (`readOnly`/`disabled`).
     - Botão do olho para visibilidade do produto na loja e botões de visibilidade/edição de opcionais 100% interativos.
     - Botão `Guardar Alterações` ativo para franquias, persistindo overrides locais via `/api/products/toggle-availability`.
6. **Governança de Publicação e Replicação (Individual vs Toda a Rede)**:
   - `components/admin/menu/OptionModelDialog.tsx`: Franqueadora Master pode escolher se a alteração de opções replica para toda a rede ou fica apenas na loja ativa.
   - `components/admin/menu/MenuHierarchyView.tsx`: Diálogo de publicação agora sempre permite à Franqueadora escolher entre publicar apenas na unidade ativa ou replicar e publicar para toda a rede.
   - `app/api/catalog/publish/route.ts`: Quando `replicateAll: true`, replica os overrides de produtos da loja ativa para todos os tenants antes de atualizar a versão global.
7. **Exportação Universal de Relatórios em CSV**:
   - Criado `lib/utils/csvExport.ts` com `\uFEFF` (BOM), delimitador `;`, separador `sep=;\r\n` e formatação monetária com vírgula para abertura automática em Excel de Portugal.
   - Aplicado em todos os relatórios: Histórico de Pedidos, Feedback, Satisfação, Estoque, Suprimentos e Auditoria.
