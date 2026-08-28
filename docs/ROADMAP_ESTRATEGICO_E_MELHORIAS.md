# Roadmap Estratégico de Evolução & Mapeamento de Melhorias
**Açaí da Rose — Planejamento Técnico e de Produto (2026 – 2027)**

---

## 1. Visão Geral do Produto

O objetivo do roadmap é consolidar o **Açaí da Rose** como uma plataforma enterprise de food service, desenhada especificamente para redes de franquias em Portugal e expansão europeia. 

O design segue uma abordagem **minimalista, tipográfica e funcional** (estilo Linear / Stripe), priorizando clareza operacional, velocidade de atendimento e zero fricção para o cliente.

---

## 2. Horizontes de Entrega (Roadmap Cronológico)

```
[ Horizonte 1: Q4 2026 ]  -->  [ Horizonte 2: Q1 2027 ]  -->  [ Horizonte 3: Q2-Q4 2027 ]
- Go-Live 2 Lojas              - Menus em Vídeo (Stories)    - Totem Kiosk Autoatendimento
- Banco PostgreSQL Real         - TV de Chamada de Pedidos    - Módulo Supply Chain B2B
- Emissão Fiscal AT / ATCUD    - Central Master de TI        - Setorização de Salão / Praças
- Integração MB WAY / TPA      - Relatórios de DRE / Vendas  - Programa de Fidelidade & NPS
```

---

## 3. Mapeamento Detalhado por Módulos e Horizontes

---

### Horizonte 1: Entrada em Produção & Operação Fiscal (Q4 2026)
*Foco: Estabilidade do núcleo de vendas, migração de dados e conformidade legal em Portugal.*

1. **Camada de Dados & Persistência Real**:
   - Subida do PostgreSQL 16 dedicado na VPS com volumes NVMe persistentes.
   - Refatoração dos 7 repositórios de dados (`lib/repositories/`) para queries SQL nativas.
   - Desativação definitiva do estado volátil em memória (`mockStore.ts`).
2. **Motor Fiscal Homologado (Autoridade Tributária - AT)**:
   - Conexão via API certificada (Moloni / Vendus) para emissão de Faturas Simplificadas com assinatura RSA, código ATCUD e QR Code fiscal.
   - Emissão do ficheiro SAF-T (PT) mensal para a contabilidade de cada franquia.
3. **Pagamentos Integrados**:
   - Integração com gateway MB WAY (Ifthenpay / Eupago) com push instantâneo no telemóvel.
   - Conciliação de recebimentos via TPA físico e numerário no PDV.
4. **Impressão Térmica ESC/POS**:
   - Spooler de impressão para talões de 80mm no balcão e comandas de 58mm na cozinha.

---

### Horizonte 2: Experiência Visual, TV e Controle Técnico (Q1 2027)
*Foco: Elevação do ticket médio por apelo visual e ferramentas de gestão da rede.*

1. **Cardápio em Vídeo (Stories / Reels)**:
   - Carrossel minimalista no topo do cardápio mobile com microvídeos em loop (3 a 5s).
   - Player vertical em tela cheia com botão de compra direta para montagem do copo.
   - Hospedagem e streaming via Edge CDN (Cloudflare R2) para zero consumo de banda na VPS.
2. **Painel de Chamada de Pedidos para Smart TV**:
   - Rota fullscreen `/chamada?loja=slug` para Smart TVs de salão com colunas *Em Preparação* e *Pronto para Retirada*.
   - Alerta sonoro discreto e reconexão automática em caso de oscilação de rede.
3. **Central Master de TI (`/dev`)**:
   - Painel exclusivo para suporte técnico com modo *Impersonate* (troca de loja em 1 clique).
   - Gerenciamento de tokens de hardware fixos para TVs e tablets de loja.
4. **Relatórios Financeiros Consolidados**:
   - DRE simplificado por unidade (Faturamento bruto, deduções de IVA, taxa de royalties e ticket médio).

---

### Horizonte 3: Escala de Franquias & Autoatendimento (Q2 – Q4 2027)
*Foco: Eficiência operacional para redes com mais de 10 unidades.*

1. **Totem Kiosk de Autoatendimento**:
   - Rota vertical `/totem?loja=slug` com interface tátil ergonômica e screensaver cinematográfico.
   - Integração direta com TPA de cartão acoplado ao totem.
2. **Portal B2B de Abastecimento com Comparador de Preços**:
   - Marketplace interno para franqueados comprarem caixas de açaí e insumos diretamente da Matriz.
   - Comparativo de economia em tempo real contra atacadistas externos (Makro / Recheio).
3. **Setorização de Salão & Comandas por Assento**:
   - Divisão de mesas por praças físicas (*Esplanada*, *Salão Principal*, *Take-away*).
   - Separação de pedidos individuais por número de cadeira na mesa.
4. **Pesquisa NPS Pós-Venda**:
   - Avaliação rápida de 1 a 5 estrelas exibida no QR Code após o pagamento, gerando ranking de qualidade entre as franquias.

---

## 4. Diretrizes de Design & Princípios de Engenharia

1. **Estética Minimalista & Clean**:
   - Ausência de emojis infantis ou ícones decorativos sem função.
   - Tipografia refinada (`Inter` / `Geist`), espaçamentos generosos e hierarquia visual clara.
   - Paleta sóbria: fundo escuro profundo (`#0A0612`), superfícies neutras (`#160F24`), acentos em roxo institucional (`#7C3AED`) e texto em alto contraste (`#F9FAFB`).
2. **Zero "AI Look" (Design Humano & Direto)**:
   - Interfaces limpas, botões com estados claros (hover, active, disabled), micro-interações funcionais e sem poluição visual.
3. **Resiliência e Desacoplamento**:
   - Cada franquia opera de forma autônoma. Quedas em uma unidade não afetam as demais.
   - Tolerância a falhas com fallback de cache local no navegador do PDV.
