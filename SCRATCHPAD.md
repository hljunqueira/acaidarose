# SCRATCHPAD

## Status Atual: 🚀 APONTAMENTO DNS API.ACAIDAROSE.PT CRIADO & CONEXÃO REAL POSTGRESQL 16 TESTADA COM SUCESSO

### Evidências da Execução:
1. **Apontamento DNS Criado**:
   - `api.acaidarose.pt` ➡️ `198.50.117.110` (Tipo `A`, TTL `1 hour`).
   - O domínio principal `acaidarose.pt` continua apontado para o site legado sem nenhuma alteração.
2. **Conexão Real do Next.js com o Banco PostgreSQL 16**:
   - `lib/db/postgres.ts` criado com pool de conexões `pg`.
   - `app/api/health/route.ts` criado para telemetria e health check.
   - Teste de conectividade direta via TCP: **`CONNECTIVITY SUCCESS! Stores: 2 Server Time: 2026-08-28T02:58:09.406Z`**.
3. **Validação de Código**:
   - `npx tsc --noEmit` executado com **código 0 (zero erros de compilação)**.

### Status da VPS Exclusiva (`198.50.117.110`):
- Container PostgreSQL 16 (`acaidarose-db`) ativo e saudável na porta `5432` com liberação de firewall UFW.
- 21 tabelas relacionais ativas, triggers, dados de Aveiro e Torres Novas e 3 utilizadores.
- Backups automáticos diários às 03:00 AM.
- Vercel CLI configurada para deploy direto em `https://acaidarose.vercel.app`.
