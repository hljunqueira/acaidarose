# Especificação Técnica: Painel de Chamada de Pedidos para Smart TV
**Açaí da Rose — Interface Minimalista de Atendimento em Tempo Real para Salão e Balcão**

---

## 1. Visão Geral do Painel

O Painel de Chamada para Smart TV organiza o fluxo de retirada de pedidos no balcão das lojas, exibindo em tempo real quais pedidos estão em preparação e quais já estão prontos para entrega.

O design segue um padrão **minimalista de alto contraste** (fundo escuro e tipografia limpa), garantindo visibilidade clara a longas distâncias sem poluição visual.

---

## 2. Layout da Tela (16:9 / 4K)

```
+-------------------------------------------------------------------------+
| ACAI DA ROSE                       Unidade Torres Novas        20:45    |
+-------------------------------------------------------------------------+
|                                    |                                    |
| EM PREPARACAO                      | PRONTO PARA RETIRADA               |
|                                    |                                    |
|   # 102      # 105      # 108      |   # 098                            |
|   # 109      # 110      # 112      |   # 099                            |
|   # 114      # 115                 |   # 100                            |
|                                    |   # 101  [ Chamando ]              |
|                                    |                                    |
+-------------------------------------------------------------------------+
| [ Rodape Informativo: Acompanhe o seu pedido pelo ecra ]                |
+-------------------------------------------------------------------------+
```

---

## 3. Especificações Visuais & Comportamentais

### A. Estrutura de Colunas:
* **Coluna Esquerda (Em Preparação)**:
  - Fundo sutilmente escurecido (`#120B1C`).
  - Números dos pedidos em cor neutra de médio contraste (`#D1D5DB`) em blocos uniformes.
* **Coluna Direita (Pronto para Retirada)**:
  - Fundo em destaque sutil (`#181024` com borda de 1px em tom roxo `#7C3AED`).
  - Números em fonte ampliada e alto contraste (`#FFFFFF`).
  - O pedido recém-finalizado recebe uma animação sutil de destaque linear por 8 segundos.

### B. Sistema de Notificação Sonora:
* **Alerta Discreto (Chime)**: Tom sonoro curto e elegante (frequência de 440Hz suave) acionado apenas no instante em que a cozinha move o pedido para o estado de pronto.
* **Sintetizador de Voz Opcional**: Disparo automático de áudio nativo do navegador: *"Pedido cento e um, pronto no balcão"*.

---

## 4. Engenharia e Resiliência Técnica

1. **Conexão em Tempo Real (WebSockets / SSE)**:
   - Os eventos de mudança de status no KDS da cozinha atualizam a TV em menos de 100ms, sem recarregamento de página.
2. **Reconexão Automática**:
   - Em caso de oscilação do sinal Wi-Fi da loja, a tela tenta restabelecer a conexão silenciosamente a cada 5 segundos.
3. **Proteção contra Retenção de Imagem (Anti Burn-in)**:
   - Micro-deslocamento imperceptível de pixels a cada 15 minutos para preservar telas OLED e LED de uso comercial contínuo.
4. **Execução sem Instalação de Software**:
   - Funciona nativamente no navegador de qualquer Smart TV comercial (LG webOS, Samsung Tizen, Android TV, Fire TV).
   - Rota: `https://app.acaidarose.pt/chamada?loja=torres-novas&token=dev_tn_tv_88a9`
