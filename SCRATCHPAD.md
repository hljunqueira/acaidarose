# SCRATCHPAD

## Status Atual: ✅ REPLICAÇÃO MULTI-LOJA, POLIMENTO DE UI & FAVICON CONCLUÍDOS

### Tarefas Executadas nesta Rodada:
1. **Modal de Publicação & Replicação de Cardápio (`ReplicateCatalogModal.tsx`)**:
   - Layout horizontal compacto em 2 colunas (`max-w-4xl`) sem rolagem excessiva.
   - Removido o botão `X` duplicado (mantendo apenas o fechar nativo do Radix Dialog).
   - Removido o ícone de sparkles da caixa de confirmação de produção.
   - Coluna Esquerda: Seletor de Escopo (**🌐 Toda a Rede** vs **🏪 Lojas Específicas**) com checkboxes das filiais.
   - Coluna Direita: Resumo dos valores dos 5 copos/tamanhos e aviso de aplicação imediata.

2. **Propagação Real de Preços no Backend (`productsRepository.ts` & `sync-all/route.ts`)**:
   - Atualização persistente de preços canônicos (`store.containers`) quando publicado para toda a rede e em `storePriceOverrides[tenantId]` para lojas selecionadas.
   - Sincronização imediata no PDV de cada unidade e nos menus públicos/QR Code (`/menu?loja=...`).

3. **Favicon e Ícones com a Logo Oficial (`app/layout.tsx` & `public/favicon.ico`)**:
   - Configurado o favicon e apple-touch-icon oficiais com a logomarca da Açaí da Rose.

4. **Correção de Pedidos QR Code no KDS & Limpeza de Header**:
   - Pedidos com `WAITING_PAYMENT` e `OPEN` agora entram normalmente na coluna *Novos Pedidos*.
   - Sufixo textual `(SUPER_ADMIN)` removido do cabeçalho.




