# Matriz de Permissões & Níveis de Acesso: TI vs. Franqueadora vs. Lojas
**Açaí da Rose — Arquitetura de Perfis, Multi-Tenancy e Isolamento de Dados**

---

## 1. Estrutura dos 3 Níveis Administrativos + Operação

```
[ Nível 1: SUPER_ADMIN (Master TI & Gestão Geral — Henrique) ]
  └── Painel do TI (/dev) & Acesso Global a Tudo:
        ├── Monitoramento e Métricas de Servidor / VPS
        ├── Live Error Stream & Logs de Auditoria
        ├── Assistente de Provisionamento em 1 Clique (Wizard de Novas Franquias)
        ├── Gestão de Tokens de Hardware (KDS, Totens, TV, TPA)
        └── Modo Impersonate (Assumir qualquer loja ou perfil para suporte imediato)

[ Nível 2: FRANCHISOR_ADMIN (Admin Franqueadora — Sede Matriz Aveiro) ]
  └── Painel Corporativo da Franqueadora + PDV Completo da Loja Matriz Aveiro:
        ├── Operação Física da Loja Aveiro (PDV Balcão, Mesas, KDS, Turnos de Caixa)
        ├── Faturamento Global Consolidado, DRE da Rede e Royalties
        ├── Gestão e Cadastro de Unidades Franqueadas
        ├── Aprovação de Solicitações de Preços das Filiais (franchise_requests)
        ├── Gestão de Insumos da Rede e Pedidos de Abastecimento B2B
        └── Acervo Oficial de Vídeos e Stories de Marketing

[ Nível 3: TENANT_ADMIN (Admin Loja / Franqueado Local — Ex: Torres Novas) ]
  └── Acesso Restrito Exclusivamente à sua Loja Vinculada:
        ├── Gestão da Equipa da Loja (Operadores de Caixa)
        ├── Fecho de Caixa Cego, Relatório do Dia & DRE da Unidade
        ├── Mapa de Mesas, Esplanada e QR Codes da Loja
        └── Envio de Pedidos de Insumos B2B para a Matriz Aveiro

[ Nível 4: CASHIER (Operador de Caixa / Balcão) ]
  └── Operação Diária do Balcão e Salão:
        ├── PDV Balcão (Venda Rápida, Troco, MB WAY, Multibanco)
        ├── Comandas de Mesas e KDS da Cozinha
        └── Abertura e Fecho do seu próprio Turno de Caixa
```

---

## 2. Matriz Comparativa de Funcionalidades

| Funcionalidade / Módulo | SUPER_ADMIN *(TI Master)* | FRANCHISOR_ADMIN *(Franqueadora)* | TENANT_ADMIN *(Admin Loja)* | CASHIER *(Operador)* |
| :--- | :---: | :---: | :---: | :---: |
| **Painel do TI (`/dev`) & Logs do Sistema** | Sim (Exclusivo) | Não | Não | Não |
| **Provisionamento Automático de Franquias** | Sim | Sim | Não | Não |
| **Modo Impersonate (Entrar como Loja)** | Sim | Sim | Não | Não |
| **Faturamento Consolidado de Todas as Lojas** | Sim | Sim | Não | Não |
| **Configurar Taxas de Royalties & Marketing** | Sim | Sim | Não | Não |
| **Aprovar Alteração de Preços das Filiais** | Sim | Sim | Não | Não |
| **Relatórios Financeiros da sua Loja** | Sim | Sim (Todas) | Sim (Apenas da sua) | Não |
| **Cadastrar Operadores de Caixa da Loja** | Sim | Sim (Todas) | Sim (Apenas da sua) | Não |
| **PDV Balcão & Registro de Vendas** | Sim | Sim | Sim | Sim |
| **Mesas, Comandas e KDS da Cozinha** | Sim | Sim | Sim | Sim |
| **Abertura / Fecho do seu Turno de Caixa** | Sim | Sim | Sim | Sim |
| **Fazer Pedido de Insumos B2B para a Matriz** | Não | Recebe & Fatura | Envia Pedido | Não |

---

## 3. Utilizadores Oficiais de Produção no Banco de Dados

1. **Super Admin (Master TI)**:
   - **Nome**: Henrique Linhares Junqueira (Super Admin / Master TI)
   - **E-mail**: `henriquelinharesjunqueira@gmail.com`
   - **Papel**: `SUPER_ADMIN`
   - **Acesso**: Painel TI (`/dev`) e controle irrestrito de todo o ecossistema.

2. **Admin Franqueadora**:
   - **Nome**: Diretoria Franqueadora
   - **E-mail**: `franqueadora@acaidarose.pt`
   - **Papel**: `FRANCHISOR_ADMIN`
   - **Acesso**: Painel Corporativo da Franqueadora com visão de todas as lojas.

3. **Admin Loja (Filial Torres Novas)**:
   - **Nome**: Gerente Torres Novas
   - **E-mail**: `gerente.torresnovas@acaidarose.pt`
   - **Papel**: `TENANT_ADMIN`
   - **Acesso**: Restrito exclusivamente à filial de Torres Novas.
