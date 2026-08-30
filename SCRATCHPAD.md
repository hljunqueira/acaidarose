# SCRATCHPAD - Açaí da Rose

## Status Atual
- **Sincronização no Banco de Dados**: Concluída com sucesso (`node scripts/seed-canonical-menu.js`).
  - Atualizadas as tabelas de Frutas (`Uva`), Toppings Tradicionais (17 itens com `Leite em pó`), Cremes (10 opções) e Adicionais Premium (`Nutella`, `Creme de Leite em pó`, `Creme de Pistache`) para ambas as unidades (Matriz Aveiro e Torres Novas).
- **Backend & Frontend**: Servidor operacional em `http://localhost:3000` (Status: HEALTHY / PostgreSQL conectado).
- **Compilação**: `npm run build` e `npx tsc --noEmit` executados com 0 erros.
- **Carrinho e Pedidos**: Totalmente funcional com o componente `CustomerCartSheet` e integração com `POST /api/orders`.
- **Sessão de Mesa / QR Code**: Preservação de parâmetros na navegação da logo em `CustomerMenuHeader`.
- **UX & Aparência**: Seletor de Tema Claro / Escuro implementado na aba Sobre.
