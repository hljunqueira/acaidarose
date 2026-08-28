# Especificação de Design & Engenharia de UX: Menus em Vídeo
**Açaí da Rose — Interface Minimalista para Mobile, Totem Kiosk, TV e Franqueadora**

---

## 1. Princípios de Design

A identidade visual do Açaí da Rose adota uma abordagem **minimalista, tipográfica e refinada**, eliminando ruídos visuais, emojis e excessos decorativos para focar no produto e na velocidade de decisão do cliente.

### Pilares de UX:
* **Motion-First com Sobriedade**: Microvídeos curtos (3 a 5s) exibem o produto em movimento sem sobrecarregar a interface.
* **Tipografia e Hierarquia**: Uso de fontes de alta legibilidade (`Inter` / `Geist`), pesos bem definidos e contrastes precisos.
* **Paleta Minimalista**:
  - `Background`: `#0A0612` (Escuro profundo, sem reflexos exagerados)
  - `Surface`: `#160F24` (Superfície dos cards com borda sutil de 1px em `#2A1E3D`)
  - `Primary / Accent`: `#7C3AED` (Roxo da marca em botões de ação e destaques selecionados)
  - `Text High Contrast`: `#F9FAFB` (Títulos e preços)
  - `Text Muted`: `#9CA3AF` (Descrições e rótulos secundários)

---

## 2. Cardápio Mobile / QR Code (`/menu?loja=...`)

```
+-------------------------------------------------------------+
| ACAI DA ROSE              Torres Novas                      |
+-------------------------------------------------------------+
| DESTAQUES EM VIDEO                                          |
| [ Copos ]       [ Sorbets ]     [ Toppings ]    [ Especiais ]|
| (Video 4s)      (Video 4s)      (Video 4s)      (Video 4s)  |
+-------------------------------------------------------------+
| CATEGORIAS                                                  |
| Mais Pedidos  |  Copos  |  Bases  |  Toppings  |  Bebidas   |
+-------------------------------------------------------------+
| PRODUTO EM DESTAQUE                                         |
| +---------------------------------------------------------+ |
| | [ Video em Loop: Montagem Copo 500ml ]                  | |
| |                                                         | |
| | Copo Especial 500ml                              6.50 EUR| |
| | Açaí tradicional, 2 bases e 3 complementos à escolha    | |
| |                                                         | |
| | [ Ver Story ]                      [ Montar Copo ]      | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
| Ver Pedido (2 itens)                               13.00 EUR|
+-------------------------------------------------------------+
```

### Comportamento & Interações:
1. **Destaques no Topo (Stories)**:
   - Cards compactos em proporção 9:16 com borda sutil de 1px.
   - Ao tocar, abre o **Visualizador Vertical em Tela Cheia**:
     - Vídeo de 4 segundos em loop contínuo sem cortes;
     - Barra de progresso linear no topo;
     - Painel inferior contendo nome, valor e o botão direto: `Montar Copo`.
2. **Cards de Produto**:
   - Imagem de capa em alta definição com transição suave para microvídeo em loop quando visível na tela.
3. **Seletor de Ingredientes**:
   - Interface limpa com contadores em texto sóbrio: `2 de 3 complementos selecionados`.
   - Botões de seleção com estado ativo definido por preenchimento sutil e borda roxa.

---

## 3. Totem Kiosk de Autoatendimento (`/totem?loja=...`)

### Interface Tátil Vertical (Telas de 32" a 43"):
1. **Modo Descanso (Screensaver Cinematográfico)**:
   - Em caso de inatividade por mais de 30 segundos, a tela inicia a reprodução de vídeos em alta definição com transição suave de fade.
   - Texto central minimalista: `Toque para iniciar o seu pedido`.
2. **Navegação & Ergonomia**:
   - Botões e cards amplos com altura mínima de 56px, espaçamento generoso e tipografia dimensionada para leitura confortável a 1 metro de distância.
   - Botão de acessibilidade no rodapé para reposicionar a interface na metade inferior da tela.

---

## 4. TV Menu Board Digital (`/tv?loja=...`)

### Layout para Monitores de Salão (16:9 / 4K):
1. **Divisão de Tela (60% / 40%)**:
   - **Lado Esquerdo (Tabela de Produtos e Preços)**: Tipografia clara, tamanhos de recipientes (300ml, 500ml, 700ml) e valores atualizados em tempo real.
   - **Lado Direito (Janela de Vídeo Promocional)**: Rotação suave de vídeos de alta definição de produtos e novidades da rede.
2. **Transições Discretas**:
   - Troca de mídias a cada 12 segundos com transição cross-fade de 400ms, sem piscamentos ou animações agressivas.

---

## 5. Gestor de Mídias no Painel da Franqueadora (`/admin/menu`)

1. **Upload Centralizado com Pré-visualização**:
   - Área de drag-and-drop para envio de vídeos verticais (MP4, H.264).
   - Compressão automática para limite máximo de 2 MB por arquivo.
   - Geração automática de imagem de capa (*poster image*) a partir do primeiro frame.
2. **Definição de Escopo**:
   - Controle de publicação: `Toda a Rede` ou `Lojas Selecionadas`.
   - Vínculo direto do vídeo ao recipiente ou topping correspondente no catálogo.
