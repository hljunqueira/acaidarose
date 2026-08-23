# Scratchpad & Histórico de Sessões

## Tarefa Atual
- [x] Restrição estrita da função "Replicar para Filiais" exclusivamente para a Franqueadora:
  - No componente `ProductRowItem.tsx`, o botão de ícone **"Replicar para Filiais"** e a exclusão de itens foram restritos estritamente para `user.role === 'SUPER_ADMIN'`.
  - Perfis de loja (Gerente e Operador de Torres Novas, Santarém, Aveiro) agora têm apenas os controles de **Editar**, **Duplicar**, **Horários de Venda** e **Disponibilidade em Estoque Local**.
  - A replicação master para toda a rede permanece centralizada no **Painel da Franqueadora**.
- [x] Validação TypeScript com 0 erros (Exit Code 0).





## Log de Modificações Recentes
- Estrutura do projeto achatada para a raiz.
- Eliminados diretórios e arquivos legados do Emergent (.emergent/, test_reports/, tests/, memory/, test_result.md).
- PDF de rótulo movido para `docs/Rotulo_Acaiteria_Rosane.pdf`.
- `package.json` e `.gitignore` normalizados para Next.js 15 (trava `packageManager` removida para suporte a `pnpm`/`npm`/`yarn`).
- Removido arquivo legado duplicado `app/receipt/[id]/page.js` (mantido apenas o `page.tsx` oficial).
- `npm run build` e `tsc` executados com 100% de sucesso.



