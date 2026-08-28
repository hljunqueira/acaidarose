# SCRATCHPAD

## Status Atual: 🚀 NOVO SITE & SISTEMA PUBLICADO NO GITHUB (ORIGIN MAIN) & CONEXÃO VPS POSTGRESQL 16 HOMOLOGADA

### Evidências da Infraestrutura e Deploy:
1. **GitHub & Vercel**:
   - Código 100% atualizado, login limpo sem mocks, página 404 animada e 25 docs técnicos enviados para `https://github.com/hljunqueira/acaidarose.git` (branch `main`).
   - Vercel configurada para o domínio `https://acaidarose.vercel.app`.
2. **PostgreSQL 16 na VPS (`198.50.117.110`)**:
   - Container `acaidarose-db` ativo e saudável em `0.0.0.0:5432->5432/tcp`.
   - Porta 5432 aberta e segura no UFW firewall com senha forte de 32 hex.
   - 21 tabelas relacionais ativas, triggers, dados de Aveiro e Torres Novas e 3 utilizadores.
   - Rotina diária de backups às 03:00 AM (`/root/acaidarose/scripts/backup.sh`).
3. **DNS Dominios.pt**:
   - `api.acaidarose.pt` ➡️ `198.50.117.110` (Tipo `A`, TTL `1 hour`).
4. **Variáveis de Produção para a Vercel**:
   - `DATABASE_URL`: `postgresql://acai_admin:da9d329d3252f5b61a2d810b4b765ce9@198.50.117.110:5432/acaidarose_prod`
   - `JWT_SECRET`: `ca90799f2d1e2e604f32c3f8fba3bceb3b27be30058ec0ffad8a23053bbef50a`
   - `NEXT_PUBLIC_APP_URL`: `https://acaidarose.vercel.app`
