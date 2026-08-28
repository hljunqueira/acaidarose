# Guia de Apontamentos DNS, Domínios & Conexão de Infraestrutura
**Açaí da Rose — Mapeamento Completo de Registros DNS (Vercel + VPS PostgreSQL 16)**

---

## 1. Topologia de Funcionamento Atual (Sem Dependência Imediata de DNS)

Atualmente, o sistema **já funciona 100% em produção** utilizando a seguinte arquitetura desacoplada:

* **Frontend & Aplicação Web Next.js 15**: Hospedada na Vercel no domínio oficial:
  👉 **`https://acaidarose.vercel.app/`**
* **Banco de Dados Relacional & Backups**: Hospedado no container PostgreSQL 16 na VPS:
  👉 **`198.50.117.110:5432`** (`acaidarose_prod`)

```mermaid
flowchart LR
    User["Clientes & Operadores"] --> Vercel["⚡ Vercel Edge Network (https://acaidarose.vercel.app)"]
    Vercel -->|DATABASE_URL via TCP:5432| VPS["🗄️ PostgreSQL 16 na VPS (198.50.117.110)"]
    VPS --> Storage["💾 NVMe + Backups Diários 03:00 AM"]
```

---

## 2. Guia de Apontamentos Futuros para Domínio Personalizado (`acaidarose.pt`)

Quando desejar vincular o domínio próprio `acaidarose.pt` (no Cloudflare, PT.pt, GoDaddy ou Namecheap), basta criar a seguinte **Tabela de Registros DNS**:

| Tipo de Registro | Nome do Host (Name) | Destino / Valor (Content) | Proxy / TTL | Finalidade |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (raiz) | `76.76.21.21` | DNS Only (Auto) | Aponta o domínio raiz para a Vercel |
| **CNAME** | `www` | `cname.vercel-dns.com` | DNS Only (Auto) | Redireciona `www.acaidarose.pt` para a Vercel |
| **CNAME** | `app` | `cname.vercel-dns.com` | DNS Only (Auto) | Subdomínio dedicado para PDV e Franqueadora |
| **A** | `vps` (ou `db`) | `198.50.117.110` | DNS Only (Auto) | Acesso direto ao servidor VPS e banco |

---

## 3. Passo a Passo para Configurar no Painel DNS (Quando For Ativar)

### Passo A: No Painel da Vercel
1. Aceda ao painel do projeto em **Settings > Domains**.
2. Adicione os domínios:
   - `acaidarose.pt`
   - `www.acaidarose.pt`
   - `app.acaidarose.pt`
3. A Vercel validará os certificados SSL Let's Encrypt automaticamente.

---

### Passo B: Na Zona DNS do Provedor (ex: Cloudflare / Registrador .PT)
1. Crie os registros `A` e `CNAME` conforme a tabela da Seção 2.
2. Caso utilize **Cloudflare**, desative temporariamente a nuvem laranja (deixe em modo *DNS Only / Somente DNS*) para emissão inicial do certificado SSL da Vercel, e em **SSL/TLS** configure como **Full (Strict)**.

---

## 4. Resumo das Credenciais e Conexões

* **Domínio Ativo Imediato**: `https://acaidarose.vercel.app`
* **Painel da Central de TI**: `https://acaidarose.vercel.app/dev`
* **Acesso do Operador / Login**: `https://acaidarose.vercel.app/login`
* **Ementa Digital Pública (QR Code)**: `https://acaidarose.vercel.app/menu`
* **Endereço do Banco de Dados**: `postgresql://acai_admin:da9d329d3252f5b61a2d810b4b765ce9@198.50.117.110:5432/acaidarose_prod`
