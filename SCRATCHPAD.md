# SCRATCHPAD - Açaí da Rose

- **Módulo de Suprimentos B2B, Isenção de IVA (0%), Frete Fixo Franquias, Produtos Gráficos, Fornecedores & Certificado QZ Tray [CONCLUÍDO & EM PRODUÇÃO]**:
  - **Solicitações do Usuário Atendidas**:
    1. *Opção Sem IVA / Isento (0%)*: Há produtos em Portugal sem incidência de IVA.
    2. *Blindagem de Custos para Franquias*: Lojas filiais/franqueadas (Torres Novas, Aveiro) visualizam apenas catálogo de insumos homologados para compra, sem ter acesso aos custos de aquisição da Matriz ou margens de lucro corporativas.
    3. *Frete Fixo de Distribuição (€ 60,00)*: Estipulado frete fixo de € 60,00 por pedido de abastecimento para entrega consolidada mensal partindo da central na Figueira da Foz para Aveiro e Torres Novas (preparado para futuro cálculo por km).
    4. *Exclusão de Frutas Frescas e Criação de Produtos Gráficos & Merchandising (`GRAFICOS`)*: Removida a categoria `cat-fruta` e adicionada `Produtos Gráficos & Merchandising` (código `GRAFICOS`), além de botão dinâmico `+ Nova Categoria` no diálogo de insumos para cadastrar novas categorias sob demanda.
    5. *Lista Oficial de Fornecedores da Franqueadora*: Cadastrados os 10 fornecedores oficiais homologados (Açaí Amazon Berry S.L., Friends Açaí, Pedaços do Brasil, CJS Embalagens, Ecopak, Monouso, Aviludo, Gelcentro, Makro, Recheio Cash & Carry SA) com gestão completa editável (criar, editar, inativar) via `SuppliersManagementModal`.
    6. *Eliminação Definitiva de Avisos do QZ Tray*: Gerado certificado digital X.509 de 20 anos (`acaidarose-qz-cert.crt`) para registro no QZ Tray (`Site Manager`), integrado aos endpoints `/api/qz/cert` e `/api/qz/sign` com chave privada RSA SHA-512 sincronizada na Vercel e local.
    7. *Deploy da Plataforma*: Executado `node scripts/deploy-plataforma.js` e promovido na Vercel e VPS com sucesso.

- **Diagnóstico SSH: Anexos de E-mail não visíveis em Dispositivos Móveis [CONCLUÍDO & VALIDADO]**:
  - **Sintoma Reportado**: No telemóvel do Valdair (print do app de e-mail/Gmail), o e-mail da contabilidade ("Reencaminho o e-mail com o IRS.") exibia apenas um ícone de imagem quebrada e nenhum dos dois anexos em PDF.
  - **Inspeção Realizada via SSH na VPS (`198.50.117.110`)**:
    1. *Integridade no Servidor*: O e-mail `1792675652...` em `/root/acaidarose/data/mail_data/domains/acaidarose.pt/valdair/Maildir/` (310 KB) contém 100% dos anexos íntegros no disco:
       - `IRS ROSANE.pdf` (83.400 bytes, PDF válido)
       - `DEMOSNTRAÇÃO LIQUIDAÇÃO IRS.pdf` (70.986 bytes, PDF válido)
       - `image001.png` (inline image)
    2. *Causa Raiz Identificada nos Logs (`mail.log` e `auth.log`)*:
       - O telemóvel (`188.83.112.207` MEO) está configurado incorretamente com o protocolo **POP3** em vez de **IMAP**.
       - O cliente POP3 móvel executa apenas `TOP` (limite de corte móvel a ~119 KB) e nunca executa `RETR` (`top=1/119534, retr=0/0`).
       - O corte a 119 KB atinge o início do primeiro PDF sem fechar os boundaries MIME, fazendo com que o leitor móvel descarte os anexos.
    3. *Correção*: Configuração do telemóvel para utilizar **IMAP** (`mail.acaidarose.pt:993` SSL/TLS) e SMTP (`mail.acaidarose.pt:587` STARTTLS).

  - **Solicitação do Usuário**:
    1. "no automatico ainda ta saindo assim o layout sem a logo que nem e no manual, analise e faça um plano" (Foto do talão automático com VIA DE COZINHA, Total do Pedido 6.50 ?, sem logo, sem QR code).
    2. "E colocar palavras em pt como cash em pt e status do pedido em pt, e pode executar o plano".
  - **Entregas Realizadas**:
    1. **Logomarca Monocromática Oficial (`public/logo-thermal.png` & `lib/printers/logoData.ts`)**:
       - Gerada imagem térmica monocromática em alta definição (380px de largura, 1-bit achatado em fundo `#ffffff` sólido sem transparência para evitar blocos pretos térmicos).
       - Exportada constante `THERMAL_LOGO_BASE64` e função assíncrona `generateReceiptQrCodeBase64`.
    2. **Integração de Imagem com QZ Tray e ESC/POS Multi-Part**:
       - `lib/printers/autoPrintService.ts`: Monta o payload híbrido suportado nativamente pelo QZ Tray (`INIT` + `WPC1252` + imagem base64 da logo centralizada + texto ESC/POS do talão + QR Code da comanda + corte de guilhotina).
       - O QR Code da comanda aponta dinamicamente para a URL `${origin}/receipt/${order.id}` para leitura rápida e avaliação de satisfação do cliente.
    3. **Termos 100% Canônicos em PT-PT (`lib/printers/escposBuilder.ts` & `app/receipt/[id]/page.tsx`)**:
       - `formatPaymentMethodPT`: `CASH` / `DINHEIRO` -> `Numerário`, `MBWAY` -> `MB Way`, `CARD` / `MULTIBANCO` -> `Multibanco (TPA)`, `BALCAO` -> `Balcão`.
       - `formatOrderStatusPT`: `PAID` -> `PAGO`, `PENDING` -> `PENDENTE`, `PREPARING` -> `EM PREPARO`, `READY` -> `PRONTO`, `COMPLETED` -> `CONCLUÍDO`, `CANCELLED` -> `ANULADO`.
       - Eliminado o caractere `?` na exibição do Euro: trocado `CODE_PAGE_CP850` por `CODE_PAGE_WPC1252` em todas as rotas e comprovativos, exibindo perfeitamente `€ 6,50`.
    4. **Configuração por Impressora no Painel (`PrinterSettingsView.tsx`) & Banco PostgreSQL**:
       - Tabela `store_printer_settings` migrada com as colunas `print_logo BOOLEAN DEFAULT true` e `print_qr_code BOOLEAN DEFAULT true`.
       - Modal de edição/criação de impressora com toggles intuitivos: `[✓] Imprimir Logomarca no Topo` e `[✓] Imprimir QR Code da Comanda no Rodapé`.
       - Badges correspondentes (`Logo no Topo`, `QR Code no Rodapé`) adicionados aos cards das impressoras.
       - Ação "Testar Corte" atualizada para enviar a logomarca oficial no cabeçalho do teste.
    5. **Validação**:
       - `npx tsc --noEmit` executado com código de saída 0 (zero erros de tipagem).

- **Modelos de Impressão (Talão Completo de Caixa - Foto 2 vs Comanda de Cozinha - Foto 1) & Destaque de Senha/Cliente [CONCLUÍDO & EM PRODUÇÃO]**:
  - **Solicitação do Usuário**:
    1. "Automatico tem que sair tbm assim e no caixa tem que sair a senha e nome do cliente, e possivel fazer isso nas configurações da impressora?"
    2. Referência: Foto 2 do talão físico com cabeçalho fiscal completo (NIF, morada, tel), dados de comanda e operador, dados do cliente, itens com bases e acompanhamentos ("Grátis"/preços), subtotal, total e forma de pagamento.
  - **Solução & Implementações Realizadas**:
    1. **Configurável nas Configurações da Impressora (`PrinterSettingsView.tsx`)**:
       - Adicionado seletor de **Modelo do Talão (Layout de Impressão)**:
         - `Talão Completo de Caixa / Conferência (Foto 2 - Recomendado)`: Layout idêntico à Foto 2, com NIF, morada, contacto, comanda, cliente, itens detalhados com bases, acompanhamentos "Grátis", subtotal por item, total e pagamento.
         - `Comanda de Produção / Copa (Foto 1 - Foco em Montagem)`: Versão reduzida para a bancada de montagem rápida dos açaís.
         - `Ticket Rápido de Senha (Balcão)`: Versão econômica com senha gigante para entrega ao cliente.
       - Adicionada opção do Caixa:
         - `[✓] Destacar Senha (#001) e Cliente no Topo`: Imprime a senha/comanda (`#001`) e o nome do cliente (`ROSANE`) em tamanho duplo e negrito no topo do talão para facilitar a chamada e identificação no balcão e no caixa.
    2. **Banco de Dados PostgreSQL**:
       - Colunas `print_layout` e `highlight_customer` persistidas na tabela `store_printer_settings` e sincronizadas via repositório e API (`GET`, `POST`, `PUT`).
    3. **Builder ESC/POS Direto (`lib/printers/escposBuilder.ts`)**:
       - `buildFullOrderEscPosReceipt`: Formatação exata em 40 colunas (`padRow`), bases e acompanhamentos agrupados com "Grátis" / preços, totais e rodapé de comprovativo interno.
       - Suporte nativo a acentuação e Euro (`€ 6,50` em vez de `?`): Tabela WPC1252 (`\x1Bt\x10`) no ESC/POS e `encoding: 'windows-1252'` no QZ Tray.
    4. **Auto-Impressão Silenciosa (`lib/printers/autoPrintService.ts`) & Pedidos QR Code (`QRCodeOrdersAdmin.tsx`)**:
       - Roteamento inteligente baseado no layout configurado na impressora ativa.
       - Dados fiscais (NIF, morada, telefone) consultados dinamicamente a partir do `currentTenant` da unidade.
    5. **Validação**: `npx tsc --noEmit` compilado com código 0 e deploy de produção publicado na Vercel (`https://acaidarose.vercel.app`).

  - **Solicitação do Usuário**:
    1. "Deixar o modal com 6 grid e largo e compacto"
    2. "e verificar se o pedido feito pelos qr code da loja vai impirir automatico"
  - **1. Modal de Impressoras (`PrinterSettingsView.tsx`)**:
    - **Largura Expandida & Altura Otimizada**: De `max-w-lg` para `max-w-5xl w-[95vw]` com rolagem interna compacta.
    - **Header em 2 Colunas**: Linha 1 (`Nome de Identificação` + `Driver do SO`) e Linha 2 (`Protocolo` + `Número de Vias`) organizados lado a lado, reduzindo a altura vertical em 50%.
    - **Grid de 6 Colunas Compacto**: A seleção de `Categorias` e `Produtos` agora utiliza `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5` com botões compactos (`px-2 py-1.5 text-[10.5px]`). Todas as 17 categorias cabem em 3 linhas compactas sem rolagem excessiva.
  - **2. Diagnóstico & Implementação da Auto-Impressão de Pedidos QR Code**:
    - **Diagnóstico Real**: Anteriormente, pedidos feitos pelos clientes via QR Code no telemóvel caíam no banco PostgreSQL e eram detectados pelo painel a cada 8s tocando som e exibindo toast, mas **NÃO imprimiam automaticamente** na impressora física. Além disso, o telemóvel do cliente jamais conseguiria se comunicar diretamente com a impressora da loja (o QZ Tray roda localmente no PC Windows da loja).
    - **Solução Implementada**:
      - `lib/printers/autoPrintService.ts`: Serviço que roteia os itens do pedido com base nas categorias e produtos configurados em cada impressora ativa, gera o recibo ESC/POS térmico formatado (`buildOrderKitchenEscPosReceipt`) e despacha silenciosamente para o driver local via QZ Tray (`printRawData`).
      - `components/admin/orders/QRCodeOrdersAdmin.tsx`:
        - Integrado watcher de novos pedidos: na primeira carga, registra os pedidos existentes para evitar reimpressão de histórico antigo. Nos polls seguintes (a cada 8s), todo novo pedido recebido via QR Code ou comanda de mesa dispara automaticamente a impressão na impressora térmica ativa da unidade.
        - Botão de controle de status no cabeçalho: `[✓ Auto-Imprimir: ON/OFF]` com luz indicadora de conexão do QZ Tray (Verde pulsante para Online / Âmbar para Offline).
        - Botão de impressão manual no card do pedido atualizado: se o QZ Tray estiver online com impressora ativa, imprime diretamente em 1 clique sem abrir diálogo do navegador; caso contrário, abre o modal de contingência nativo como fallback.
  - **Validação**: `npx tsc --noEmit` compilado com código 0 (sem erros de tipagem).

- **Diagnóstico & Correção da Conexão do QZ Tray Local no Navegador [CONCLUÍDO & VALIDADO]**:
  - **Sintoma**: O QZ Tray estava instalado e em execução no Windows (processo `javaw.exe` na porta 8181/8182), mas a tela de Impressoras Térmicas acusava `Offline / Não Detectado`.
  - **Causas Raízes Identificadas**:
    1. *Inversão Crítica de Portas em `lib/printers/qzClient.ts`*: O código forçava `secure: [8182]` e `insecure: [8181]`. No QZ Tray oficial, a porta segura (WSS / TLS) é **8181** e a insegura (WS) é **8182**. Com a inversão, o navegador tentava fazer handshake TLS em uma porta HTTP puro, quebrando a conexão com `ERR_SSL_PROTOCOL_ERROR`.
    2. *Sobrescrita de Hosts*: Forçar `host: 'localhost'` impedia o QZ Tray de usar seus domínios canônicos com certificado emitido (`localhost.qz.io` / `qz.surf`).
    3. *Certificado Falso em `/api/qz/cert`*: Retornava texto com `# QZ_CERTIFICATE não configurado...` que quebrava o parser X.509 do Java no QZ Tray. Corrigido para retornar 404 e só configurar segurança se houver certificado real em `.env`.
    4. *Orientação de Certificado em HTTPS*: Em sites HTTPS (produção), o navegador Chrome pode exigir uma autorização pontual em `https://localhost:8181`. Adicionada caixa de ajuda dinâmica na interface guiando o operador.
  - **Validação**: Verificação em Node conectando com sucesso no QZ Tray (`CONNECTED SECURE!`, listando as impressoras locais instaladas `MP-4200 TH`), e `npx tsc --noEmit` compilado com código 0.

- **Página Hub de Redirecionamento da Marca (`/links`) & Display com QR Code [CONCLUÍDO & VALIDADO]**:
  - **Objetivo**: Criar solução 100% independente do sistema (sem queries de banco, sem mexer no PDV) para centralizar os contactos oficiais da marca em um único QR Code com a logo oficial no centro, sem mencionar cidades:
    - **Fixo**: 249 825 131
    - **WhatsApp**: 911 050 264
    - **Site**: acaidarose.pt
    - **Instagram**: https://www.instagram.com/acaidarose_pt (@acaidarose_pt)
    - **Facebook**: https://www.facebook.com/profile.php?id=61550988842732&sk=directory_personal_details (Açaí da Rose)
    - **vCard**: Botão de 1 toque para guardar contacto na agenda com todos os números e perfis sociais.
  - **Entregas & Refinamentos Realizados**:
    1. *Design Clean & Focado*:
       - Removidas abas de alternância superiores; a tela foca 100% nos botões de contacto oficiais.
       - Botão "Ver QR Code" no rodapé abre modal exibindo **exclusivamente o QR Code** com a logo no centro e botão de download.
    2. *`scripts/deploy-links-page.js` & VPS Nginx*:
       - Deploy estático em `/etc/icontainer/apps/nginx/nginx/www/sites/acaidarose.pt/index/links/` na VPS (`198.50.117.110`) com reload do Nginx.
    3. *`app/links/page.tsx`*:
       - Sincronizado para Next.js / Vercel com os links exatos de Instagram e Facebook.
  - **Validação**: `npx tsc --noEmit` código 0; `curl.exe https://acaidarose.pt/links/` validado com HTTP 200, links de Instagram e Facebook confirmados no ar.

- **Visualização Exclusiva de Foto/Vídeo vs. Customizador de Mesa com QR Code [CONCLUÍDO & VALIDADO]**:
  - **Problema Reportado**: No modo catálogo vitrine (consulta sem QR Code de mesa física), clicar em "Detalhes" abria o modal de seleção de ingredientes/modificadores (leite, textura, toppings extras). Além disso, clicar na foto ou vídeo do item deveria abrir exclusivamente a mídia (foto/vídeo ampliado) e não as opções de personalização.
  - **Solução Implementada**:
    1. *`CustomerMediaModal.tsx`*: Criado componente exclusivo de mídia em popup limpo (backdrop blur, player de vídeo com controles ou foto em alta resolução, nome, peso e preço), sem nenhum formulário de ingredientes.
    2. *`CustomerMenuHome.tsx`*:
       - Clique direto no container da foto/vídeo (`e.stopPropagation()`) abre imediatamente o `CustomerMediaModal`.
       - Em modo catálogo (`isCatalogOnly`), o botão do card exibe `Ver Vídeo` ou `Ver Foto` e o clique no card abre o `CustomerMediaModal`.
       - Em mesas físicas (`!isCatalogOnly` / QR Code de mesa), o clique no card ou no botão `Pedir`/`Personalizar` abre o customizador completo (`CustomerItemDetailModal` ou `CustomerProductDetail`) para montar e enviar o pedido.
    3. *`app/menu/page.tsx` & `CustomerItemDetailModal.tsx`*: Integrado o `CustomerMediaModal` para consultas e clique de zoom nas fotos/vídeos.
  - **Validação**: `npx tsc --noEmit` código 0; `npm run build` gerou todas as rotas com sucesso (código 0).

- **Suporte 100% Dinâmico a Novas Lojas / Franquias (Zero Código) [ANALISADO & VALIDADO]**:
  - **Pergunta do Usuário**: "E quando for loja nova, vai ter que adicionar via código e não pelas configurações da matriz? Responda somente após análise."
  - **Resultado da Análise Técnica**:
    1. **Zero Código Necessário**: O cadastro de novas unidades é feito 100% pelas configurações da Matriz no painel administrativo (`FranchiseCorporateView` / `FranchiseAdmin` -> `POST /api/tenants`).
    2. **Herança Automática do Cardápio Mestre**: Ao salvar a nova loja, a função `createTenant` invoca automaticamente `syncAllStoresCatalog`, clonando instantaneamente os 79 containers, 11 bases, 26 toppings, mídias e regras da Matriz com versão 1 publicada. A loja já nasce pronta para vender.
    3. **Resolução Dinâmica Completa (Sem Dicionários Fixos)**:
       - Todas as rotas de TV (`/api/tv/settings`, `/api/tv/marquee`), Mesas (`/api/tables`), Versões (`/api/catalog/version`), Publicação (`/api/catalog/publish`) e Cardápio (`/api/products`) foram atualizadas para usar `resolveTenantId` assíncrono.
       - A nova unidade funciona de imediato com seu slug (`/menu?loja=coimbra`, `/chamada?loja=coimbra`) ou UUID.
       - Usuários/caixas, impressoras térmicas e configurações fiscais/horários são configurados diretamente pela interface da Matriz.
  - **Validação**: `npx tsc --noEmit` código 0; `npm run build` gerou todas as 40 rotas com sucesso (código 0).

- **Publicação Acumulada em Rede, Escopo da Franqueadora & Descarte Individual de Alterações [CONCLUÍDO & VALIDADO]**:
  - **Problema Reportado**: A Franqueadora alterava vários itens e precisava entrar de loja em loja para publicar; não acumulava para publicar todas de uma vez nem permitia descartar/remover uma alteração indevida sem ter que resetar tudo. Além disso, nas mesas com QR code de Torres Novas, a página não identificava a mesa.
  - **Causa Raiz & Soluções**:
    1. *Identificação de Mesas (`/api/tables`, `tablesRepository.ts`, `app/menu/page.tsx`)*:
       - O endpoint recebia slug (`torres-novas`) e comparava diretamente com `tenant_id::text` (UUID), retornando 0 mesas. Corrigido com `normalizeTenantId()`.
       - No cardápio (`app/menu/page.tsx`), mesas com token validado no banco não sofrem reset por checagem assíncrona local.
    2. *Escopo de Alterações na Franqueadora (`ApplyScopeModal.tsx`, `MenuHierarchyView.tsx`, `/api/products/toggle-availability`)*:
       - Criado modal limpo (sem emojis) que permite ao Master escolher: `[ Apenas na Loja Atual ]` ou `[ Para TODA A REDE (N lojas) ]`.
       - O backend replica o status para todas as lojas quando `applyToAll: true` e marca dirty em todas as unidades.
    3. *Descarte Individual de Alteração Indevida (`/api/catalog/revert`, `publishStore.ts`, `PublishChangesBanner.tsx`, `MenuHierarchyView.tsx`)*:
       - No modal de resumo de alterações, cada item exibe badge (`Toda a Rede` / `Loja Atual`), data/hora e o botão individual `[ Desfazer ]` (`revertItem`).
       - O backend restaura cirurgicamente o valor anterior do override no banco e remove apenas aquela alteração do resumo pendente.
    4. *Publicação em Lote em 1 Clique*:
       - Quando há pendências em mais de uma unidade, o sistema oferece `[ Publicar em Todas as Lojas (N) ]` (`publishAllPending`), publicando a rede inteira em 1 único clique.
  - **Validação**: `npx tsc --noEmit` código 0, `npm run build` gerou todas as 40 rotas com sucesso, commit `a1429cdb` e deploy em produção na Vercel (`READY` em https://acaidarose.vercel.app).


- **Responsividade & Acessibilidade do Checkout Mobile com Teclado Virtual (`CustomerCartSheet.tsx`) [CONCLUÍDO & VALIDADO]**:
  - **Problema Reportado**: Ao tocar no campo de NIF ou em qualquer input no celular na hora de pagar, o teclado virtual do iOS/Android subia e cobria o campo de digitação, enquanto o modal (centralizado com `translate-y-[-50%]`) ficava espremido contra o rodapé fixo, impedindo a visualização do NIF e dados digitados.
  - **Causa Raiz Identificada**:
    1. O `DialogContent` utilizava posicionamento absoluto centralizado (`top-1/2 translate-y-[-50%]`) com `max-h-[92vh]`. Quando o teclado virtual abria, a viewport do celular encolhia e o modal era cortado, empurrando os inputs para trás do rodapé fixo.
    2. O container rolável interno possuía apenas `pb-5`, sem folga de respiro inferior para que o último campo (NIF) pudesse ser rolado para cima do rodapé fixo.
    3. Faltava o trigger de auto-scroll (`scrollIntoView`) ao receber foco (`onFocus`).
  - **Entregas Realizadas**:
    1. *Bottom Sheet Mobile com Altura Dinâmica (`dvh`)*:
       - No mobile, o modal foi reestruturado para atuar como um Bottom Sheet nativo ancorado na base: `fixed inset-x-0 bottom-0 top-auto translate-x-0 translate-y-0 w-full max-w-none rounded-t-3xl rounded-b-none max-h-[90dvh] h-[90dvh]`.
       - No desktop (`sm:`), preserva a caixa de diálogo centralizada: `sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:rounded-3xl sm:h-auto sm:max-h-[90vh]`.
    2. *Folga Inferior de Rolagem (`pb-36`)*:
       - Adicionado `pb-36 sm:pb-6` com `overscroll-contain` no container interno, garantindo mais de 140px de respiro para rolar o campo de NIF e telemóvel bem acima do rodapé fixo e do teclado.
    3. *Auto-Scroll Centralizado no Foco (`onFocus`)*:
       - Implementado `handleFieldFocus` com `scrollIntoView({ behavior: 'smooth', block: 'center' })` em todos os campos de entrada (Nome, Forma de Pagamento, Telemóvel e NIF).
    4. *Teclados Otimizados*:
       - Adicionado `inputMode="numeric"` no campo de NIF e `inputMode="tel"` no telemóvel para acionar o teclado adequado no iOS e Android.
  - **Validação**: `npx tsc --noEmit` executado com código de saída 0 (zero erros).

  - **Objetivo**: Fazer o seletor de idiomas do cardápio do cliente refletir em tempo real os idiomas ativados na loja via banco de dados (`store_languages_config`), ocultando idiomas desativados (como Espanhol), e resolver o bug visual do Windows onde emojis de bandeira regional duplicavam como texto (`PT PT`, `US EN`, `ES ES`).
  - **Causa Raiz Identificada**:
    1. O header do cardápio (`CustomerMenuHeader.tsx`) possuía 3 botões estáticos hardcoded (`pt`, `en`, `es`) em vez de consultar a API `/api/translations/languages`.
    2. Como o Windows não possui glifos coloridos para emojis de bandeiras de países, os caracteres Unicode `🇵🇹`, `🇺🇸`, `🇪🇸` eram renderizados como códigos de texto ISO (`PT`, `US`, `ES`). Combinado com o rótulo `PT`/`EN`/`ES`, o resultado ficava duplicado (`PT PT`, `US EN`).
  - **Entregas Realizadas**:
    1. *`languageStore.ts`*:
       - Adicionada lista `activeLanguages` e função `loadActiveLanguages(tenantIdOrSlug)`.
       - Chamada com `no-store` para `/api/translations/languages?loja=...` filtrando apenas registros com `is_active === true` e deduplicando por `language_code`.
       - Mecanismo de fallback automático: se o cliente tiver salvo no `localStorage` um idioma que foi desativado (ex: Espanhol), o sistema redefine automaticamente para o idioma padrão (`pt`).
    2. *`CustomerMenuHeader.tsx`*:
       - Criado componente vetorial SVG `FlagIcon` de alta fidelidade para Portugal (PT), EUA (EN) e Espanha (ES), garantindo renderização nítida, corporativa e idêntica em qualquer sistema operacional (sem depender de emojis).
       - Integração com `useEffect` para carregar `loadActiveLanguages` com base na loja atual (`tenant?.id || tenant?.slug`).
       - Renderização condicional: o seletor só exibe botões para os idiomas que estejam ativos na loja (`activeLanguages`). Como Espanhol está desativado na rede, ele é omitido automaticamente.
  - **Validação**: `npx tsc --noEmit` executado com código de saída 0 (zero erros).

  - **Objetivo**: Corrigir sobreposição do texto com o ícone do select no carrinho mobile e introduzir a opção inicial `Selecione a forma de pagamento...`, limpando o formulário para só exibir campos condicionais após a escolha ativa do cliente.
  - **Entregas Realizadas**:
    1. *Correção de Espaçamento*:
       - Adicionado espaçamento inline explícito `style={{ paddingLeft: '2.85rem', paddingRight: '2.5rem' }}` no `<select>`, evitando truncamento ou sobreposição com o ícone flutuante.
       - Ícones alinhados centralmente via `top-1/2 -translate-y-1/2 z-10`.
    2. *Opção Inicial "Selecione..." & Validação*:
       - Estado inicial `paymentMethod` inicializado com string vazia `''`.
       - Renderizada opção inicial desabilitada `<option value="" disabled>Selecione a forma de pagamento...</option>`.
       - Exibição de ícone neutro (`CreditCard` translúcido) antes da seleção e transição para o ícone correspondente ao escolher.
       - Validação no `handleCheckout` bloqueando o envio e focando no seletor com scroll suave caso o cliente não selecione um método.
    3. *Limpeza Visual (Progressive Disclosure)*:
       - O campo de telefone específico de MB WAY e o campo de NIF não aparecem de forma prematura na tela, surgindo apenas quando o método correspondente é selecionado.
    4. *Validação*: `npx tsc --noEmit` executado com código de saída 0 (zero erros).
  - **Objetivo**: Tornar o card de apresentação 100% institucional e agnóstico de unidade para funcionar harmonicamente em todas as lojas da rede (Figueira da Foz, Torres Novas, Aveiro, etc.), removendo menções a cidades fixas, telefone e Google Maps.
  - **Entregas Realizadas**:
    1. *Foto da Loja*: Removido "Matriz Oficial - Torres Novas · Portugal", substituído por "Açaí da Rose · Tradição & Qualidade Artesanal".
    2. *Badge de Apresentação*: Substituído "Visite-nos em Torres Novas" pela tag "Conheça a Nossa Marca".
    3. *Título & Descrição*: Mantidos intactos ("O Autêntico Açaí Brasileiro ao seu Alcance" e a descrição gastronômica).
    4. *Remoção de Dados Fixos*: Removidos os blocos de Morada, Contacto Telefónico/MB Way e os botões de WhatsApp e Google Maps de Torres Novas.
    5. *Preservação da Rede Oficial*: Mantido o botão do Instagram institucional `@acaidarose.pt`.
    6. *Limpeza de Imports*: Removidos `MapPin` e `Phone` não utilizados de `lucide-react`.
    7. *Validação*: `npx tsc --noEmit` executado com 0 erros.

- **Ajuste de Cores & Contraste no Modo Claro do Card de Qualidade (`CustomerMenuMore.tsx`) [CONCLUÍDO & VALIDADO]**:
  - **Objetivo**: Corrigir textos desbotados/invisíveis no modo claro na seção "Qualidade & Selos de Conformidade Oficial" da aba "Mais / Sobre Nós" do cardápio do cliente.
  - **Entregas Realizadas**:
    1. *6 Selos de Qualidade*: Adicionado `text-purple-950 dark:text-purple-100` e bordas suaves `border-purple-200/60 dark:border-white/10`.
    2. *Box de Ingredientes*: Fundo com contraste suave `bg-purple-50/60`, título em destaque legível `text-pink-700 dark:text-pink-400` e texto em `text-slate-700 dark:text-purple-200/90`.
    3. *Tabela Nutricional Oficial*:
       - Cabeçalho: `bg-purple-100/70 text-purple-950 dark:bg-white/10 dark:text-purple-200`.
       - Linha Valor Energético: `bg-pink-50/80 text-pink-700 dark:bg-white/5 dark:text-pink-300`.
       - Nutrientes e gramaturas: `text-slate-700 dark:text-purple-200 font-medium` e valores numéricos em `text-slate-900 dark:text-white font-mono font-bold`.
       - Linhas divisórias: `divide-purple-100 dark:divide-white/10`.
    4. *Validação*: `npx tsc --noEmit` executado com código de saída 0 (zero erros).

- **Seletor Dropdown para Formas de Pagamento no Balcão (`CustomerCartSheet.tsx`) [CONCLUÍDO & VALIDADO]**:
  - **Objetivo**: Substituir o conjunto de botões de pagamento que ficavam espremidos e truncavam com reticências (`MB WAY ...`, `Multiban...`) por um seletor dropdown nativo e estilizado de 1 linha, com ícones dinâmicos contextuais e visual clean sem sobrecarga de espaço no checkout mobile/desktop.
  - **Entregas Realizadas**:
    1. *Substituição de Layout*:
       - Removida a grade de botões horizontais com `truncate` em `components/menu/CustomerCartSheet.tsx`.
       - Implementado componente de campo único de 1 linha (`h-11`) com tag "Paga ao levantar" no topo.
       - Ícone dinâmico à esquerda com transição automática conforme a opção selecionada (`Smartphone` para MB WAY Nº, `QrCode` para MB WAY QR, `CreditCard` para Multibanco, `Banknote` para Dinheiro, `Gift` para Pontos).
       - Ícone `ChevronDown` à direita indicando campo de seleção.
       - Classes responsivas `text-base sm:text-xs` para evitar zoom indesejado no iOS Safari.
    2. *Textos Sem Truncamento & Acessibilidade*:
       - Opções com rótulos completos e descritivos:
         - `MB WAY (Por Nº de Telemóvel)` / `MB WAY (By Phone Number)`
         - `MB WAY (QR Code no Balcão)` / `MB WAY (QR Code at Counter)`
         - `Multibanco (Cartão de Débito / Crédito)` / `Multibanco / Card (Debit or Credit)`
         - `Dinheiro (Numerário no Balcão)` / `Cash (Pay at Counter)`
         - `Resgatar Pontos (App Açaí da Rose)` / `Redeem Points (Açaí da Rose App)`
    3. *Validação*:
       - `npx tsc --noEmit` executado com 0 erros.
       - `npm run build` executado com sucesso e 40 páginas estáticas geradas com êxito.

  - **Objetivo**: Implementar a Central de Impressoras multi-impressoras 1-para-N no grupo "CONFIGURAÇÕES DA UNIDADE" da sidebar com link oficial para download do QZ Tray, detecção de status em tempo real, suporte ESC/POS e corte com guilhotina.
  - **Entregas Realizadas**:
    1. *Sidebar & Roteamento*:
       - `components/layout/AppSidebar.tsx`: Adicionado item `{ id: 'printers', label: 'Impressoras & QZ Tray', subtitle: 'Copa, Balcão & Guilhotina', show: true }` no grupo "CONFIGURAÇÕES DA UNIDADE" para todos os papéis administrativos (`SUPER_ADMIN`, `FRANCHISOR_ADMIN`, `TENANT_ADMIN`).
       - `app/page.tsx`: Importado e roteado `<PrinterSettingsView tenantId={activeTenantId} />` sob `view === 'printers'`.
    2. *Central de Impressoras (`components/admin/printers/PrinterSettingsView.tsx`)*:
       - Card informativo com link oficial de download do QZ Tray (`https://qz.io/download/`) e instalador direto do Windows.
       - Guia visual em 3 passos para o operador.
       - Badge de status de conexão em tempo real com o serviço local (`wss://localhost:8182`), detecção de versão e botão "Verificar QZ Tray".
       - Detecção automática de impressoras instaladas no Windows via `qz.printers.find()`.
       - Listagem 100% dinâmica por loja (`store_printer_settings`), sem seeds/defaults (inicia `[]` vazio com EmptyState corporativo e botão de criação).
       - Modal de cadastro/edição com seleção de driver, protocolo ESC/POS, 1 ou 2 vias, status, backup e checkboxes de categorias reais.
       - Ação rápida "Testar Corte" com envio de recibo ESC/POS binário e comando de guilhotina (`GS V 0`).
    3. *Banco de Dados & Repositório*:
       - `store_printer_settings` criada no PostgreSQL da VPS via script `scripts/migrate_store_printer_settings.js` com índice em `tenant_id`.
       - `lib/repositories/printersRepository.ts`: CRUD completo tipado sem mocks.
    4. *APIs & Assinatura Digital PKI*:
       - `/api/tenants/[id]/printers`: Endpoints GET (listar) e POST (cadastrar).
       - `/api/tenants/[id]/printers/[printerId]`: Endpoints PUT (editar) e DELETE (remover).
       - `/api/qz/cert` e `/api/qz/sign`: Endpoints para assinatura RSA SHA-512 que silenciam os popups de permissão do QZ Tray.
    5. *Cliente QZ Tray & ESC/POS*:
       - `lib/printers/qzClient.ts`: Conexão WSS resiliente, busca de drivers e envio raw.
       - `lib/printers/escposBuilder.ts`: Formatação de comandas com corte total de papel (`\x1dV\x00`), número de ticket expandido e suporte a acentuação PT-PT.
       - `types/qz-tray.d.ts`: Declaração de tipos para compilação estrita.
    6. *Validação*: `npx tsc --noEmit` compilado com código de saída 0 (zero erros).

- **Auditoria Multi-Ângulos & Correção de Inconsistências (Regra: Sem Initial & Sem Array Default) [CONCLUÍDO & VALIDADO]**:
  - **Objetivo**: Cruzar o plano arquitetural com o código já desenvolvido no repositório (`types/order.ts`, `CustomerCartSheet.tsx`, `QRCodeOrdersAdmin.tsx`, `TVOrdersPanelView.tsx`, `KitchenOrderPrintModal.tsx`, `MBWayQRCodeView.tsx`, `PaymentModal.tsx`), eliminando inconsistências e cravando a regra de ouro de zero dados mockados, zero arrays default e zero seeds.
  - **Inconsistências Identificadas & Corrigidas**:
    1. *Tipos de Pagamento (`types/order.ts`)*: Estendido `PaymentMethodCode` com `'MBWAY_PHONE' | 'MBWAY_QR' | 'MULTIBANCO' | 'DINHEIRO'` mantendo compatibilidade retroativa com `'MBWAY'`, `'CASH'`, `'NUMERARIO'`, `'POINTS'`. Dicionário `METHODS` em `app/receipt/[id]/page.tsx` atualizado para os novos rótulos.
    2. *Propagação de `categoryId` nos Itens*: Descoberto que `CustomerCartSheet.tsx` não incluía `categoryId` em `itemsPayload`. Adicionado mapeamento de `categoryId` e `categoryName` no payload para que o motor de impressão filtre itens por categoria em memória (O(1)) sem queries extras.
    3. *Regra Sem Initial e Sem Array Default*:
       - Tabela `store_printer_settings` nasce 100% vazia (zero seeds).
       - No frontend (`PrinterSettingsView.tsx`), `printers` inicia como `[]` vazio. Se vazio, exibe componente `EmptyState` corporativo com botão `[ + Adicionar Primeira Impressora ]`. Proibido qualquer array `DEFAULT_PRINTERS`.
       - Em `MBWayQRCodeView.tsx`, removido o telefone fixo mockado de exemplo (`+351 912 345 678`), exibindo apenas o contacto real do pedido.
    4. *Ciclo de Vida do Pedido no Kanban e TV*:
       - Pedido nasce como `status: 'AWAITING_PAYMENT'` e `paymentStatus: 'PENDING'`. A TV já filtra e oculta da lista "Em Preparação".
       - Botão `[ Receber ]` em `QRCodeOrdersAdmin.tsx` e `OrderItemsModal.tsx` substitui o update cego para `CASH` pelo novo modal `CounterPaymentDialog.tsx`. Ao liquidar, move para `PREPARING` e `PAID`, entrando na TV e disparando a impressão silenciosa.
    5. *Reaproveitamento de Componentes Homologados*:
       - Aba MB WAY QR: reaproveita `MBWayQRCodeView.tsx` e `generateMBWayPayload` de `qrCodeService.ts`.
       - Aba Dinheiro: reaproveita calculadora de troco e notas rápidas (+5€, +10€, +20€, +50€) de `PaymentModal.tsx`.
       - Fallback de Impressão: reaproveita Direct Body Mount (`#kitchen-print-mount`) de `KitchenOrderPrintModal.tsx`.
  - **Documentos Atualizados**:
    - [docs/PLAN_FLUXO_PAGAMENTO_BALCAO_E_QZ_TRAY_MULTI_IMPRESSORAS.md](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/PLAN_FLUXO_PAGAMENTO_BALCAO_E_QZ_TRAY_MULTI_IMPRESSORAS.md): Seção 2 com auditoria multi-ângulos.
    - Artefato [plano_executivo_pagamento_balcao_multi_impressoras.md](file:///C:/Users/Henrique%20-%20PC/.gemini/antigravity-ide/brain/8e1b8a4b-43d3-49ca-aed5-35778f2c331c/plano_executivo_pagamento_balcao_multi_impressoras.md).



- **Eliminação Total de Mocks, Arrays Default e Ternários Hardcoded + Governança de Vídeos da TV Franqueadora [CONCLUÍDO & VALIDADO]**:
  - **Objetivo**: Conectar 100% dos dados a tabelas reais do PostgreSQL (`tenants`, `store_tv_configs`, `store_qrcode_settings`, `audit_logs`, `tables`), eliminar todos os arrays e objetos default (`DEFAULT_TORRES_NOVAS_TENANT`, `DEFAULT_AVEIRO_FRANCHISE_TENANT`, `INITIAL_TENANTS`, `tenantQrConfigCache`, `marqueeConfigsByTenant`, `mock1/mock2`), proibir ternários fixos de IDs/slugs e implementar governança estrita na Smart TV (apenas a Matriz cadastra vídeos e replica para todas as lojas da rede; filiais apenas ativam/pausam localmente).
  - **Alterações Realizadas**:
    1. **Multi-Tenant Dinâmico & Lojas**:
       - `lib/stores/franchiseStore.ts`: Removidos `DEFAULT_TORRES_NOVAS_TENANT`, `DEFAULT_AVEIRO_FRANCHISE_TENANT`, `INITIAL_TENANTS` e o alias `DEFAULT_AVEIRO_TENANT`. Stores carregam dinamicamente da API `/api/tenants` conectada ao PostgreSQL.
       - `app/page.tsx`: Removidas referências a `DEFAULT_AVEIRO_TENANT`.
    2. **Governança de TV & Replicação Oficial da Franqueadora**:
       - `app/api/tv/settings/route.ts`: Implementada checagem de Matriz Franqueadora (`isHeadquarters` ou ID Figueira da Foz).
       - Replicação oficial ativada via `replicateToAllStores: true`: Matriz Franqueadora propaga a lista de vídeos para todas as lojas em `store_tv_configs`.
       - Filiais/Franquias bloqueadas de adicionar ou excluir vídeos da playlist (HTTP 403). Podem apenas alterar `active: true/false`.
       - `components/admin/tv/TVOrdersControlView.tsx`:
         - Adicionado botão **"Replicar Playlist para Todas as Lojas"** exclusivo da Matriz com confirmação e feedback em toast.
         - Dropzone e formulário de novo vídeo renderizados exclusivamente para a Matriz; filiais recebem cartão informativo padronizado.
         - Botões de "Tags & Badge" e exclusão de vídeos restritos à Matriz. Filiais possuem exclusivamente o botão `Pausar / Ativar`.
    3. **Letreiro Digital de TV (`marquee`) no PostgreSQL**:
       - `app/api/tv/marquee/route.ts`: Eliminado objeto em memória `marqueeConfigsByTenant` e `DEFAULT_CONFIG`. Conexão direta com a coluna `marquee_config` na tabela `store_tv_configs` do PostgreSQL.
    4. **QR Code, Mesas e Cardápio Sem Ternários Hardcoded**:
       - `app/api/qrcode-config/route.ts`: Eliminado cache em memória `tenantQrConfigCache`. Removidos ternários `startsWith('11111111') ? 'aveiro' : 'torres-novas'`, utilizando os campos reais `t.slug` e `t.name`.
       - `app/api/tables/token/[token]/route.ts`: Removidos ternários hardcoded de lojas; consulta direta da mesa e do tenant no banco.
       - `app/api/products/route.ts`: Retorna dinamicamente `tenantSlug` e `tenantNif`.
       - `app/menu/page.tsx`: Eliminados ternários fixos de nomes de loja e slugs em `setTenant`, consumindo os dados reais retornados pela API.
    5. **Auditoria, Agendamento e Diálogos de Opção**:
       - `lib/repositories/auditRepository.ts`: Eliminado ternário de IDs na resolução de nomes de loja.
       - `components/admin/menu/MenuSchedulesAdmin.tsx`: Removida checagem estática `|| tenantId === 'aveiro'`; usa verificação dinâmica de `currentTenant?.isHeadquarters`.
       - `components/admin/menu/OptionModelDialog.tsx`: Removidos mocks `mock1` e `mock2` e emoji `📷`. Utiliza `<Camera className="h-3.5 w-3.5" />` e exibe estado vazio limpo quando não há itens.
    6. **Validação**:
       - Compilação completa via `npx tsc --noEmit` executada com **código de saída 0** (zero erros).


- **Eliminação de Arrays Default & Badges Totalmente Customizáveis pelo Usuário (`TVOrdersControlView`, `TVOrdersPanelView`, `tvBroadcast`, `ContainerAssemblyRulesDialog`) [CONCLUÍDO & VALIDADO]**:
  - **Causa Raiz Resolvida**:
    - O array `DEFAULT_OFFICIAL_VIDEOS` injetava 5 vídeos mockados de demonstração toda vez que o banco não continha vídeos ou quando o botão "Restaurar Oficiais" era clicado.
    - O player da Smart TV em `TVOrdersPanelView` possuía fallback estático para `v-institucional` em vez de renderizar um estado limpo institucional quando a loja não possuía vídeos configurados.
    - As mídias tinham selos e badges forçados (`isOfficial` forçava "OFICIAL FRANQUEADORA"), sem dar ao operador a escolha de ter ou não badge no vídeo.
    - Havia um banner com emojis decorativos (`📐 📦 🎬`) com orientações de resolução que violava as diretrizes de design clean corporativo do projeto.
    - Em `ContainerAssemblyRulesDialog`, havia uma lista mockada `DEFAULT_CONTAINER_RULES` com nomes desatualizados (ex.: "Barca"), desconectada do banco.
  - **Correções Aplicadas**:
    - `lib/utils/tvBroadcast.ts`: interface `TVVideoItem` atualizada com `showBadge?: boolean` e `badgeText?: string`. `DEFAULT_OFFICIAL_VIDEOS` zerado e `getStoreTVVideos()` ajustado para retornar exclusivamente registros reais ou array vazio `[]`, limpando caches legados com IDs mockados.
    - `components/admin/tv/TVOrdersControlView.tsx`:
      - Botão "Restaurar Oficiais" removido.
      - Banner de resolução e emojis (`📐 📦 🎬`) removido.
      - Estado vazio de alta fidelidade implementado quando a lista de vídeos da loja está vazia.
      - Badges nos cards dos vídeos agora são 100% opcionais e customizáveis: só aparecem se `video.showBadge && video.badgeText`.
      - Modal de edição expandido com seção dedicada "Selo / Badge do Vídeo (Opcional)": toggle Ativar/Desativar, input de texto livre e chips de opções rápidas ("Oficial Franqueadora", "Destaque", "Promoção", "Novidade", "Exclusivo").
      - Persistência imediata de edições no PostgreSQL via `syncTVSettings({ videosPlaylist: updated })`.
    - `components/admin/tv/TVOrdersPanelView.tsx`:
      - Fallback mockado removido; resolução segura de `currentVideo`.
      - Se houver vídeo com badge ativada, renderiza o selo flutuante elegante na Smart TV.
      - Se a loja não tiver vídeos ativos cadastrados, renderiza tela institucional limpa com logo oficial e nome da loja.
    - `components/admin/menu/ContainerAssemblyRulesDialog.tsx`:
      - Array estático `DEFAULT_CONTAINER_RULES` eliminado.
      - Conexão direta com `/api/catalog?tenantId=...`, carregando os recipientes e copos reais do banco de dados e persistindo alterações via `/api/products`.
    - Validação de compilação TypeScript executada com sucesso (`npx tsc --noEmit` -> Código 0).

- **Eliminação de Mocks/Seeds/Defaults de Mídia & Reflexo Fiel de Fotos de Itens (`/menu` e Admin) [CONCLUÍDO & VALIDADO]**:
  - **Causa Raiz Resolvida**:
    - Dicionários estáticos hardcoded (`CUP_IMAGES` e `CUP_VIDEOS`) em `CustomerMenuHome.tsx` e `CustomerProductDetail.tsx` forçavam o vídeo de stock `/videos/hero_gliding_texture.mp4` e fotos padrão sobre os produtos do banco de dados (ex: recipiente de 750g), ignorando a ausência de vídeo e sobrepondo a foto cadastrada.
    - Em `MenuHighlightsAdmin.tsx`, a criação e seleção de item (`handleProductSelect`) forçava como fallback padrão a imagem `/images/official/acai_copo_500g.jpg`, fazendo com que todos os destaques de copos (250g, 350g, 500g, 750g, 1kg) herdassem a mesma foto do copo de 500g.
    - Em `CustomerPromoCarousel.tsx`, o `tenantId` caía por omissão em Matriz (`11111111-1111-1111-1111-111111111111`) antes do carregamento da loja ativa, causando inconsistência no primeiro paint.
    - Em `ActionDialogs.tsx`, fallbacks estáticos de fotos do Unsplash foram eliminados em diálogos de duplicação, exclusão e harmonização.
  - **Correções Aplicadas**:
    - `CustomerMenuHome.tsx`: removidos mapas `CUP_IMAGES` e `CUP_VIDEOS`; renderiza `<video>` apenas se `c.videoUrl` existir no banco; renderiza `<img>` com `c.image || c.videoPoster` sem inventar mídias inexistentes.
    - `CustomerProductDetail.tsx`: removido `CUP_IMAGES[weight]` e `CUP_VIDEOS[weight]`; renderiza exclusivamente `container.videoUrl` ou `container.image || container.videoPoster`.
    - `CustomerPromoCarousel.tsx` e `app/menu/page.tsx`: repasse de `tenantId={tenant?.id || activeLoja}`, sem fallback cego para Matriz.
    - `MenuHighlightsAdmin.tsx`: ao selecionar um item no dropdown, herda `p.image` e `p.videoUrl` reais do produto; na ausência de foto, exibe estado limpo sem forçar o copo de 500g.
    - `highlightsRepository.ts`: removido fallback `/images/official/acai_copo_500g.jpg` em `imageUrl`.
    - `store_stories` (PostgreSQL): atualizados os 5 destaques de Torres Novas para apontarem para as suas fotos específicas reais (`acai_copo_250g.jpg`, `acai_copo_350g.jpg`, `acai_copo_500g.jpg`, `acai_tigela_750g.jpg`, `acai_balde_1kg.jpg`).
    - Validação fresca de TypeScript executada com sucesso (`npx tsc --noEmit` -> Código 0).

- **Regras Estritas de Franquias (Visibilidade & Solicitação) + Reverter Alterações de Catálogo [CONCLUÍDO & VALIDADO]**:
  - **Destaques & Stories (`MenuHighlightsAdmin.tsx`)**:
    - Franquias **não alteram**, criam, reordenam ou excluem destaques.
    - O botão `+ Adicionar Novo Destaque` foi substituído por `Pedir Ajuste de Destaque` (abre `FranchiseRequestDialog`).
    - Nos cards de destaques de franquias, as ações de exclusão, edição, horários e replicação foram substituídas por um único botão limpo `Pedir Ajuste`.
    - Pílula de status `Visível / Oculto` mantida ativa para controle de exibição na loja.
    - Endpoints de backend (`/api/highlights`): `POST` e `DELETE` bloqueados para franquias (HTTP 403); `PUT`/`PATCH` permite estritamente a atualização do campo `active` (visibilidade).
  - **Menus, Categorias, Produtos e Opcionais (`MenuHierarchyView`, `ProductRowItem`, `MenuCategoriesAdmin`, `MenuSectionsAdmin`)**:
    - Franquias possuem controle exclusivo sobre **Visível / Invisível** (e Disponível / Indisponível em estoque).
    - Criar categorias, menus ou produtos mestre é bloqueado no frontend e no backend (`/api/products/[category]`, `/api/categories`, `/api/menus`).
    - Reordenação (drag & drop) bloqueada para franquias nas rotas `/reorder` e ícones de arrastar ocultos.
    - Edição de itens (`ProductRowItem.tsx`): ícones de edição de horários, replicação e exclusão ocultos para franquias; botão `Solicitar Ajuste` mantido para pedir alterações à Franqueadora.
  - **Opção de Reverter Alterações de Catálogo**:
    - Criada a rota de backend `POST /api/catalog/revert` para descartar modificações pendentes não publicadas (`store_product_overrides` onde `updated_at >= published_at`) e zerar pendências em `store_catalog_versions`.
    - Adicionada a ação `revert` no store Zustand `publishStore.ts`.
    - Botão `[ Reverter Alterações ]` adicionado no banner do topo (`PublishChangesBanner.tsx`), no modal de detalhes com diálogo de confirmação seguro (`confirmRevertOpen`), na barra de ferramentas e na barra flutuante inferior de `MenuHierarchyView.tsx`.
    - Validação de tipos TypeScript executada com sucesso (`npx tsc --noEmit` -> Código 0).

- **Pagamento com Pontos (App Cashback Açaí da Rose) & MB WAY Multi-Loja (Ifthenpay) [CONCLUÍDO & VALIDADO]**:
  - **Pesquisa & Análise do App de Cashback**:
    - O aplicativo oficial do Açaí da Rose (`com.s2cashback.acaidarose.s2cashback` no Google Play e iOS) é operado na plataforma S2 Cashback / Agência Save.
    - O cadastro e login do cliente são estritamente indexados pelo **NIF de Portugal** (9 dígitos).
  - **Botão de Pagamento com Pontos no Autoatendimento (`CustomerCartSheet.tsx`)**:
    - Grid de 3 opções de pagamento: `[ MB WAY ]`, `[ No Balcão ]`, `[ Pontos ]`.
    - Ao selecionar **Pontos**, o campo de **NIF torna-se estritamente obrigatório** (validação de 9 dígitos numéricos).
    - Exibe badge explicativo *"Identificador no App"* e instrução clara: *"O resgate de pontos é validado no aplicativo Açaí da Rose Cashback utilizando o seu NIF."*
    - Botão de envio contextual: *"Concluir com Pontos"*.
    - Ao finalizar, o pedido é registrado com `paymentMethod: 'POINTS'` e notas `PONTOS CASHBACK (NIF: XXXXXXXXX)`. A tela de sucesso orienta o cliente a apresentar o app ou NIF no balcão para validação e abatimento dos pontos.
  - **Integração Ifthenpay MB WAY Multi-Loja (Documentação Oficial SPG REST)**:
    - Normalização do telemóvel para o formato oficial da Ifthenpay: `351#912345678`.
    - Truncamento do `orderId` para no máximo 15 caracteres alfanuméricos (`formatIfthenpayOrderId`), contornando a rejeição de UUIDs de 36 caracteres.
    - Suporte dinâmico multi-tenant: chave MB WAY da loja consultada no PostgreSQL (`store_qrcode_settings.ifthenpay_mbway_key`), com fallback para a chave da rede.
    - Webhook oficial (`/api/webhooks/ifthenpay`) compatível com GET e POST, busca flexível por UUID completo, UUID truncado (últimos 15 caracteres) e `order_number`, e validação de chave anti-phishing.
  - **Banco de Dados PostgreSQL em Produção**:
    - Adicionadas as colunas em `store_qrcode_settings`: `allow_points_payment` (BOOLEAN DEFAULT TRUE), `ifthenpay_mbway_key` (VARCHAR 100) e `ifthenpay_anti_phishing_key` (VARCHAR 100).
    - Painel administrativo (`QRCodeConfigView.tsx`) atualizado com switches e campos de configuração por loja.

- **API Gateway JSON para `api.acaidarose.pt` [CONCLUÍDO]**:
  - **Causa Raiz Resolvida**: O subdomínio `api.acaidarose.pt` roteava diretamente para o Next.js na Vercel, renderizando o `app/page.tsx` (Landing Page) ao ser acessado na raiz `/`.
  - **Middleware Implementado (`middleware.ts`)**: Intercepta requisições direcionadas a `api.acaidarose.pt` (ou prefixo `api.*`). Se a requisição não for de rota de backend (`/api/*`), responde diretamente com o payload JSON canônico do Gateway de API com status HTTP 200 e headers sem cache (`Cache-Control: no-store, max-age=0`):
    `{ "service": "Açaí da Rose API Gateway", "status": "online", "version": "1.0.0", "docs": "https://acaidarose.pt", "message": "Açaí da Rose REST API Gateway. Endpoints disponíveis em /api/*", "timestamp": "..." }`.
  - **Isolamento Total**: Endpoints `/api/*` e requisições para o domínio principal (`acaidarose.pt`, `acaidarose.vercel.app`, `localhost`) passam normalmente sem qualquer interferência.

- **Voz da Smart TV em Português de Portugal (pt-PT) & Streaming de Áudio Independente do SO [CONCLUÍDO]**:
  - **Causa Raiz Identificada**: O sistema dependia unicamente do motor local `window.speechSynthesis` configurado com `lang: 'pt-PT'`. Em máquinas Windows sem o pacote de voz de Portugal instalado (apenas `Microsoft Maria pt-BR` ou `Microsoft Daniel pt-BR`), o Chromium abortava silenciosamente a fala por incompatibilidade de idioma e sofria com coleta de lixo (GC bug) do `SpeechSynthesisUtterance`.
  - **Nova Rota de Streaming de Áudio (`/api/tv/voice`)**: Criada rota no servidor Next.js que sintetiza a fala em Português de Portugal europeu autêntico (`pt-PT`), retornando MP3 nativo para reprodução imediata em qualquer Smart TV (LG, Samsung, Android TV), telemóvel ou PC.
  - **Chamada Completa de Senha + Nome**: Anuncia com clareza: *"Senha 001, Nathaly"* (ou nome da mesa/cliente).
  - **Cadência Feminina e Masculina**: Suporte a voz feminina padrão e cadência masculina encorpada.
  - **Fallback Inteligente de Alta Tolerância**: Se a rede oscilar, o sistema usa o sintetizador local com proteção de Garbage Collection (`activeUtterance`), destravamento de fila e seleção automática de voz sem erros de idioma.
- **Impressão Automática Silenciosa com QZ Tray Multi-Tenant (Padrão Goomer) [DOCUMENTADO / PLANEJADO]**:
  - **Especificação Técnica Completa**: Criado e atualizado [docs/ESPECIFICACAO_IMPRESSAO_AUTOMATICA_QZ_TRAY.md](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/ESPECIFICACAO_IMPRESSAO_AUTOMATICA_QZ_TRAY.md) baseado no padrão da Goomer Go.
  - **Regra de Zero Seeds Mockadas**: A tabela `store_printer_settings` nasce 100% vazia (sem seeds para Figueira, Torres Novas ou Aveiro). Cada loja cadastra seus hardwares verdadeiros via QZ Tray no primeiro acesso.
  - **Isolamento 100% por Loja (`tenant_id`)**:
    - Cada loja possui suas próprias impressoras cadastradas e seus próprios cabeçalhos fiscais legítimos.
  - **Emissão de Senha para Pedidos no Balcão (Canhoto de Retirada)**:
    - Quem pede no balcão não usa celular. Por isso, a impressora do caixa emite automaticamente um **Canhoto de Senha** com a **SENHA (#001)** em fonte gigante, o nome do cliente e a instrução clara para acompanhar o painel de TV até ser anunciado.
  - **Página Dedicada (`/admin/impressoras`)**:
    - Seletor de loja para Master; trava automática na loja logada para gerentes de filial.
    - Indicador de status em tempo real (🟢 Conectado / 🔴 Desconectado).
    - Guia de onboarding com download direto e configuração em 4 passos.
    - Roteamento por setor físico (Impressora da Copa/Cozinha vs Impressora do Caixa/Balcão vs Impressora Única).
    - Seleção de largura (80mm vs 58mm), vias, guilhotina mecânica (`GS V 0`) e abertura de gaveta (`ESC p`).
    - Botão de teste físico e trigger automático por eventos de pagamento (`PAID`).
  - **Reimpressão em 1 Clique (QR Code & Balcão) + Fallback em Caso de Falha do QZ Tray**:
    - **Reimpressão Fácil**: Disponível no PDV, Histórico de Pedidos, Mesas, Kanban e TV/Staff com opções de re-imprimir via da Cozinha, Canhoto de Senha ou Talão Completo (com carimbo `*** 2ª VIA / REIMPRESSÃO ***`).
    - **Fallback de Contingência Zero-Downtime**: Se o QZ Tray falhar, travar ou estiver desligado (timeout de 1.5s), o sistema exibe toast informativo e aciona automaticamente a impressão nativa do navegador (`window.print()`) sem travar a venda.
- **Atualização Cadastral e Fiscal da Filial Torres Novas [CONCLUÍDO & DEPLOY REALIZADO]**:
  - **NIF**: `517968223`
  - **Morada**: `Av Manoel de Figueiredo 12 RC Direito`
  - **Telefone / MB WAY**: `+351 911 050 264` (911050264)
  - **Persistência**: Atualizado no PostgreSQL da VPS/Vercel (tabela `tenants`), no `franchiseStore.ts`, em `production_schema.sql` e nos diálogos administrativos.
  - **Reflexo em Tempo Real**: O talão térmico (`/receipt/[id]`) lê dinamicamente do banco de dados, imprimindo os dados corrigidos instantaneamente.
- **Servidor de E-mail Corporativo Híbrido (Poste.io + SMTP Relay) [CONCLUÍDO]**:
  - **Decisão Arquitetural & Coexistência**:
    - Adotado o **Poste.io** (`analogic/poste.io:latest`) em substituição ao Mailcow (que exigiria 6–8 GB de RAM e inviabilizaria a VPS compartilhada de 6 GB com PostgreSQL 16).
    - O Poste.io opera em container único leve (~500 MB RAM) com limite rígido de 1.5 GB (`mem_limit: 1536m`) e ClamAV desativado, preservando mais de 4 GB para o PostgreSQL 16 e o Next.js.
  - **Arquitetura de Envio & Recepção (Zero Spam)**:
    - **Inbound (Recepção)**: Tráfego externo na porta 25 TCP chega direto ao Poste.io e é gravado no disco NVMe (`/root/acaidarose/data/mail_data`).
    - **Outbound (Envio)**: Roteado obrigatoriamente via Smart Host / SMTP Relay autenticado (ex.: Brevo ou Amazon SES na porta 587 STARTTLS), contornando bloqueios de porta 25 da VPS e garantindo entregabilidade máxima na Caixa de Entrada do Gmail/Outlook.
  - **Proxy Reverso, Autodiscover & SSL**:
    - `Caddyfile` atualizado para gerenciar certificados SSL Let's Encrypt para `mail.acaidarose.pt`, `autoconfig.acaidarose.pt` e `autodiscover.acaidarose.pt`, com suporte a autoconfiguração com 1 clique no iOS e Thunderbird.
  - **Governança de Armazenamento & Quotas**:
    - Quotas canônicas: 5 GB para Franqueadora e 2 GB por loja (`figueiradafoz@...`, `torresnovas@...`, `aveiro@...`, `geral@...`).
    - Rotação de logs Docker configurada para `max-size: 50m`, `max-file: 3`.
  - **Backups & Runbook**:
    - `backup.sh` atualizado para empacotar diariamente `mail_data_${TIMESTAMP}.tar.gz` junto ao dump do PostgreSQL às 03:00 AM com retenção de 30 dias.
  - **Deploy em Produção & Testes ao Vivo (100% OK)**:
    - Container `acaidarose-mail` online e saudável na VPS (`198.50.117.110`), consumindo apenas **310 MB de RAM** (com mais de 4.6 GB livres para o PostgreSQL 16).
    - Portas testadas com sucesso: `25` (Inbound SMTP), `465` (SMTPS), `587` (Submission STARTTLS), `993` (IMAPS) e `443` (Webmail HTTPS).
    - Certificado oficial Let's Encrypt emitido e ativo com auto-renovação configurada via Certbot hook.
    - Webmail e painel de instalação respondendo em **`https://mail.acaidarose.pt/admin/install/server`** (HTTP 200 OK).
  - **Correção de Anexos no Webmail (`mail.acaidarose.pt`) [CONCLUÍDO]**:
    - **Diagnóstico da Causa Raiz**:
      1. **Limite de Payload Descompassado**: O Roundcube informava `Tamanho máximo permitido: 75 MB`, porém o proxy Nginx da VPS estava fixado em `client_max_body_size 50M;`. Envios de notas fiscais/fotos acumuladas acima de 50MB retornavam erro HTTP 413, quebrando o parser JSON do Roundcube.
      2. **Conflito de Cabeçalhos X-Frame-Options no Chrome/Android**: O Nginx interno do Poste.io e o PHP emitiam simultaneamente `X-Frame-Options`, resultando no cabeçalho corrompido `x-frame-options: sameorigin, SAMEORIGIN`. O Chrome no Android bloqueava o iframe oculto (`savetarget`), disparando o alerta genérico `Erro de conexão (Falha na comunicação com o servidor)!`.
      3. **Revogação Síncrona de Permissão de Arquivo no Chrome/Android**: Em `/opt/www/webmail/program/include/rcmail_action.php`, o Roundcube executava síncronamente `this.value=null;` no evento `onchange` do input de anexo. No Android Chrome, zerar o input antes do stream do `FormData` revoga a permissão do `content://` URI da câmera/galeria, abortando a requisição no cliente com `status: 0`. Corrigido com `setTimeout(function(){ _inp.value=''; }, 2000)` para preservar o stream.
      4. **Diferença de Visualização Mobile (iPhone vs Android)**:
         - No iPhone (Safari), o viewport em retrato (< 480px) abre diretamente o layout `layout-phone` (1 coluna, cabeçalho limpo).
         - No Android, ao deitar o aparelho na horizontal (paisagem) ou se a opção "Para computador" estiver marcada no menu do Chrome, a largura ultrapassa 768px e aciona o layout `layout-normal` (painel lateral e botões de desktop).
         - Para o Valdair no celular, além do webmail corrigido, a melhor prática é configurar a conta no app Gmail nativo do Android via IMAP (`mail.acaidarose.pt:993`) e SMTP (`mail.acaidarose.pt:587`), dispensando uso do navegador.
      5. **Timeouts Curtos para Redes Móveis 4G**: Falta de parâmetros de timeout para upload em redes com oscilação.
    - **Ações Implementadas em Produção**:
      - Atualizado `/etc/icontainer/apps/nginx/nginx/conf/conf.d/mail.acaidarose.pt.conf` na VPS e versionado em `config/nginx/mail.acaidarose.pt.conf`.
      - Expandido `client_max_body_size` para `100m` (cobrindo os 75MB + margem MIME).
      - Adicionado `proxy_hide_header X-Frame-Options;` e `add_header X-Frame-Options "SAMEORIGIN" always;` para sanitizar o cabeçalho único.
      - Adicionado `proxy_connect_timeout 300s;`, `proxy_read_timeout 300s;`, `proxy_send_timeout 300s;` e `client_body_buffer_size 512k;`.
      - Corrigido o manipulador de input de arquivos no Roundcube dentro do container `acaidarose-mail` para evitar o descarte imediato do arquivo no Android.
      - Validação realizada via simulação completa (upload de 2MB, 10MB, 25MB e 52MB respondendo 200 OK em ~3s).
    - **Arquivos & Guias Entregues**:
    - [docker-compose.yml](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docker-compose.yml) atualizado com o serviço `mailserver`.
    - [config/caddy/Caddyfile](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/config/caddy/Caddyfile) atualizado com proxy reverso e autodiscover.
    - [config/nginx/mail.acaidarose.pt.conf](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/config/nginx/mail.acaidarose.pt.conf) sincronizado com a configuração de produção da VPS.
    - [docs/ARQUITETURA_INFRAESTRUTURA_E_DOMINIOS.md](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/ARQUITETURA_INFRAESTRUTURA_E_DOMINIOS.md) e [docs/GUIA_DE_APONTAMENTOS_DNS_E_DOMINIOS.md](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/GUIA_DE_APONTAMENTOS_DNS_E_DOMINIOS.md) atualizados com topologia e tabela de DNS.
    - [docs/MANUAL_DE_MANUTENCAO_VPS_RUNBOOK_E_DISASTER_RECOVERY.md](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/MANUAL_DE_MANUTENCAO_VPS_RUNBOOK_E_DISASTER_RECOVERY.md) atualizado com rotinas de backup e DR de correio.
    - [docs/GUIA_CONFIGURACAO_POSTEIO_E_SMART_HOST.md](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/GUIA_CONFIGURACAO_POSTEIO_E_SMART_HOST.md) criado com checklist operacional e teste de entregabilidade.
    - [docs/ADR_AVALIACAO_COOLIFY_E_PAAS_SELF_HOSTED.md](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/docs/ADR_AVALIACAO_COOLIFY_E_PAAS_SELF_HOSTED.md) criado com avaliação técnica formal do Coolify vs Vercel e critérios de adoção futura.



  - **Identificação Comercial Oficial**:
    - O formato de **750g** foi padronizado oficialmente como **Açaí Sensação**, removendo qualquer referência a "Família".
    - O formato de **1kg (1000g)** foi consagrado como **Açaí Família** ("o tamanho perfeito para partilhar com toda a família").
  - **Migração no Banco de Dados PostgreSQL (`scripts/migrate_rename_sensacao_familia.js`)**:
    - **Tabela `product_containers` (12 registros atualizados nas 3 lojas)**:
      - 750g Tradicional: `Taça ou Caixa Açaí Sensação 750gr` (EN: `750gr Sensation Açaí (Bowl or Box)`, ES: `Açaí Sensación 750gr (Bol o Caja)`).
      - 750g Somente Creme: `Taça ou Caixa Sensação 750gr (Somente Creme)`.
      - 1kg Tradicional: `Taça ou Caixa Açaí Família 1kg` (EN: `1kg Family Açaí (Bowl or Box)`, ES: `Açaí Familia 1kg (Bol o Caja)`).
      - 1kg Somente Creme: `Taça ou Caixa Família 1kg (Somente Creme)`.
    - **Tabela `store_stories` (Destaques Promocionais sincronizados nas 3 lojas)**:
      - O card anterior `Açaí 750g Família` foi corrigido para **`Açaí Sensação 750g`** com badge **`SENSAÇÃO`**, subtítulo `Camadas generosas de Frutas & Acompanhamentos` e preço 18,90€.
      - Inserido/atualizado o destaque oficial **`Açaí Família 1kg`** com badge **`FAMÍLIA`**, subtítulo `O tamanho perfeito para partilhar com toda a família` e preço 25,90€.
      - Replicado para a Matriz (Figueira da Foz), Filial 1 (Torres Novas) e Franquia (Aveiro).
    - **Incremento de Versão**: `store_catalog_versions` atualizado em todas as lojas para propagação automática em tempo real.
  - **Frontend & Integração**:
    - `CustomerProductDetail.tsx` e `PDVView.tsx` atualizados para reconhecer os novos nomes canônicos e aplicar o sufixo dinâmico de embalagem escolhida (`Taça Açaí Sensação 750gr` vs `Caixa Açaí Sensação 750gr (Takeaway)` e `Taça Açaí Família 1kg` vs `Caixa Açaí Família 1kg (Takeaway)`).
  - **Validação**: `npx tsc --noEmit` executado com **0 erros**.
- **Opcionais com Múltiplas Escolhas (Steppers) & Seleção de Embalagem (Taça vs. Caixa 750g/1kg) [CONCLUÍDO]**:
  - **Causa Raiz Resolvida**: No `CustomerMenuHome.tsx`, recipientes de açaí que possuíam `optionGroups` estavam sendo desviados para `CustomerItemDetailModal` (modal de lanches/cafés com escolhas simples de `max 1`), em vez de abrir o customizador completo `CustomerProductDetail.tsx`.
  - **Escopo Exclusivo para Açaí**: Somente produtos da linha Açaí permitem repetição e steppers numéricos (`[-] [Qtd] [+]`) com cotas e adicionais (+0,50€ / +2,00€). Lanches, sumos e cafés continuam com escolhas unitárias objetivas.
  - **Migração PostgreSQL (`scripts/migrate_rename_and_enable_quantities.js`)**:
    - Renomeados todos os recipientes de 750g e 1kg (tradicionais e Somente Creme) nas 3 lojas (`11111111-...`, `22222222-...`, `33333333-...`) para `Taça ou Caixa 750gr` e `Taça ou Caixa 1kg` nos 3 idiomas (PT, EN, ES).
    - Habilitado `allowItemQuantity: true` nos grupos `model-frutas`, `model-toppings` e `model-caldas`.
    - Atualizada a versão do catálogo em `store_catalog_versions` para propagação instantânea via WebSocket/polling.
  - **Seleção Obrigatória de Embalagem (750g e 1kg - Opção B)**:
    - **No Cardápio do Cliente (`CustomerProductDetail.tsx`)**: Seletor limpo no topo com `[ Taça (Consumo no Local) ]` vs `[ Caixa com Tampa (Takeaway) ]`. Validação obrigatória impedindo avanço sem escolha e sufixo dinâmico no nome final do item (`Taça 750gr` vs `Caixa 750gr (Takeaway)`).
    - **No PDV Balcão (`PDVView.tsx`, `CartSummary.tsx`, `cartStore.ts`)**: Seletor instantâneo de embalagem no cabeçalho do draft para operadores, badge de identificação no resumo do carrinho e conversão automática no fechamento.
    - **Na Cozinha Térmica 80mm (`KitchenOrderPrintModal.tsx`) & Recibos (`app/receipt/[id]/page.tsx`)**:
      - Destaque em badge preto sólido `CAIXA TAKEAWAY` vs `TAÇA`.
      - Agrupamento inteligente de acompanhamentos repetidos para clareza da copa (ex: `Morango (2x)` em vez de linhas duplicadas).
  - **Validação Rigorosa**: `npx tsc --noEmit` executado com **0 erros** de TypeScript.
- **Mesas Reais de Cada Loja no Histórico de Pedidos [CONCLUÍDO]**:
  - **Causa Raiz Resolvida**: No frontend `OrderHistoryAdminView.tsx`, a busca de mesas mapeava `t.tableNumber` em vez de `t.number` retornado pelo repositório PostgreSQL, caindo num mock fallback estático de 1 a 15/20.
  - **Mapeamento Canônico & Dinâmico**:
    - Ajustado `lib/repositories/tablesRepository.ts` e `/api/tables` para suportar `tenantId === 'ALL'` (retornando todas as mesas ativas da rede) ou filial específica.
    - No `OrderHistoryAdminView.tsx`, as opções de mesa agora utilizam `t.number` e `t.nickname`, exibindo fielmente:
      - **Loja 1 - Figueira da Foz (Matriz)**: estritamente as 10 mesas cadastradas (`Mesa 01` a `Mesa 10`);
      - **Loja 2 - Torres Novas (Filial 1)**: estritamente as 30 mesas cadastradas (`Mesa 01` a `Mesa 30`);
      - **Todas as Unidades (Rede)**: todas as mesas deduplicadas em ordem numérica.
    - Reset suave do filtro caso a mesa selecionada não exista na nova filial escolhida.
- **Pesquisa de Satisfação: Correção de Erro de Respostas & Tipos Flexíveis [CONCLUÍDO]**:
  - **Causa Raiz do Erro 500 Resolvida**: Tabela `satisfaction_survey_responses` no PostgreSQL não possuía as colunas `customer_email`, `customer_birthday` e `nps_score`, gerando a falha `column r.customer_email does not exist` ao abrir a aba "Respostas".
  - **Migração PostgreSQL Concluída**: Executado `scripts/migrate_satisfaction_responses_columns.js`, criando as 3 colunas dedicadas, a coluna `survey_type` em `satisfaction_surveys` e índices de performance (`idx_survey_responses_nps`, `idx_survey_responses_email`).
  - **Resiliência da API de Respostas**: Adicionado fallback em `/api/surveys/[id]/responses` para recuperar dados do JSONB `answers` caso alguma coluna esteja nula. Testado e validado com retorno HTTP 200 e analytics completo.
  - **Presets Rápidos de 1-Clique no Editor (`SurveyEditorView.tsx`)**:
    - `[Somente NPS]` (1 etapa · Nota 0 a 10 + comentário opcional);
    - `[Dados do Cliente]` (1 etapa · Captação de Leads: Nome, WhatsApp, Email, Aniversário);
    - `[NPS + Dados]` (2 etapas · Avaliação e Fidelização);
    - `[Pesquisa Completa 2.0]` (5 etapas · NPS + Métricas com estrelas + Como conheceu + Leads + Sugestão).
  - **Seletor Dinâmico de Tipo por Pergunta**:
    - Substituído o texto estático fixo por um `<select>` nativo e estilizado na pergunta ativa, permitindo ao administrador alternar o tipo de qualquer pergunta a qualquer momento (sem precisar deletar e recriar a pergunta).
  - **Badges de Formato no Modal (`SatisfactionSurveyManagerModal.tsx`)**:
    - Cada modelo na aba "Modelos de pesquisa" agora exibe o badge do seu formato (`Somente NPS`, `Dados do Cliente`, `NPS + Dados`, `Pesquisa Completa`, `Personalizada`) e a quantidade de perguntas.
  - **Compilação**: `npx tsc --noEmit` validado com **0 erros**.
  - Banco de dados migrado (`satisfaction_surveys`, `satisfaction_survey_responses`, `store_languages_config`), 5 tipos canônicos de perguntas, ativação por loja (1 pesquisa ativa por unidade), aba de tradução em Gestão de Idiomas e avaliação no menu público `/menu`.
- **Limpeza no Painel de Feedbacks [CONCLUÍDO]**:
  - Botão/modal `Critérios` e ação destrutiva `Zerar Avaliações` removidos, mantendo header limpo com `[Atualizar]`, `[Exportar relatório]` e `[Pesquisa de Satisfação]`.
- **Ajuste & Funcionalidade Completa dos Filtros do Analytics [CONCLUÍDO]**:
  - **Datas Customizadas**: Implementado seletor dinâmico de intervalo (`De: [AAAA-MM-DD]` e `Até: [AAAA-MM-DD]` com botão `Filtrar`) quando a opção "Customizado" é ativada, enviando `startDate` e `endDate` sanitizados para a API.
  - **Fuso Horário Canônico**: Ajustada formatação de data para `Europe/Lisbon` no PostgreSQL e JavaScript (`toLocaleDateString('pt-PT')`), garantindo correspondência exata para `Hoje`, `Ontem`, `Este mês` e `Customizado`.
  - **Correção Monetária**: Substituída a legenda residual brasileira `R$ 0,00` no gráfico de vendas por hora pelo padrão oficial em euros (`€ 0,00` e escala dinâmica proporcional via `formatCurrency`).
  - **Filtro de Busca Textual**: Adicionado campo de busca em tempo real por nome de produto e acompanhamento nas abas de "Venda de produtos" e "Vendas opcionais".
  - **Sincronização de Loja**: Sincronizado seletor de lojas com `useFranchiseStore` e `currentTenant`, com suporte para visão global da rede (`ALL`) ou filial específica.
- **Limpeza de Processos na Porta 3000 & Otimização do Servidor [CONCLUÍDO]**:
  - **Porta 3000 Liberada**: Verificação via `netstat` e encerramento de processos órfãos. Servidor Next.js 15 dev reiniciado de forma limpa e respondendo com sucesso (`✓ Ready in 8.7s`).
  - **Espaço em Disco Recuperado (C:)**: Purgados caches pesados do `.next/cache` que causavam `ENOSPC: no space left on device`, restaurando mais de 6.3 GB de espaço livre no disco C:.
  - **Otimização de Salvamento de Vídeos**:
    - Criado endpoint de upload multipart `/api/upload` que grava diretamente em `public/uploads/videos/`.
    - Eliminado o gargalo de conversão para Base64 (que gerava payloads de 5MB+ no PostgreSQL e travava requisições).
    - `ProductEditDialog.tsx` atualizado com preview local instantâneo (`URL.createObjectURL`) e upload assíncrono leve.
- **Consumo no Local vs Levar para Casa (Takeaway) & Sacos de Transporte (0,10€) [CONCLUÍDO]**:
  - **Requisito Atendido**: Impressão térmica e todas as telas de pedido agora discriminam explicitamente se o consumo é no local ou para levar, com adição dinâmica de quantidade de sacos de transporte a 0,10€ cada (exigência legal em Portugal).
  - **Design 100% Clean & Sem Ícones Decorativos**: Eliminados ícones supérfluos (`Coins`, `CreditCard`, `Smartphone`, `Truck`, emojis) nos seletores e talões, mantendo botões de incremento `[-]` e `[+]` de alto contraste e layout sóbrio.
  - **Fluxo Unificado em Todos os Pontos de Entrada**:
    - **Cardápio do Cliente (`CustomerCartSheet.tsx`)**: Seletor `Consumo no Local` vs `Levar para Casa`, contador de sacos com incremento dinâmico, cálculo automático no total e envio para a API.
    - **PDV Balcão (`PaymentModal.tsx`, `PDVView.tsx`)**: Seletor limpo, contador de sacos, recálculo dinâmico de troco para dinheiro e envio das propriedades `consumptionType`, `isTakeaway`, `needBag`, `bagQuantity`, `bagFee`.
    - **Gestão de Mesas (`TableCheckoutDetail.tsx`, `TableThermalReceiptDialog.tsx`)**: Fechamento de mesa integrado e talão com indicação expressa `CONSUMO: CONSUMO NO LOCAL`.
    - **Comandas Manuais Staff (`NewOrderManualModal.tsx`, `OrderEditDialog.tsx`)**: Abertura e edição de comandas com tipo de consumo e quantidade de sacos.
    - **KDS & Smart TV (`QRCodeOrdersAdmin.tsx`, `OrderItemsModal.tsx`, `TVOrdersControlView.tsx`)**: Badges limpos de `Local` vs `Levar (+X sacos)` em Kanban, lista e painel de controle da TV.
    - **Impressão Térmica de 80mm (`KitchenOrderPrintModal.tsx`, `app/receipt/[id]/page.tsx`)**: Destaque em caixa preta sólida `>>> PARA LEVAR (TAKEAWAY) <<<` vs `>>> CONSUMO NO LOCAL <<<`, linha obrigatória de `SACO DE TRANSPORTE: Xx (0.XX€)` e talão de recibo discriminado.
  - **Segurança de Estoque & Subtotais**: Sacos de transporte são tratados como itens e campos estruturados, garantindo consistência no `.reduce()` sem decrementar ingredientes alimentares no estoque híbrido.
  - **Validação**: `npx tsc --noEmit` validado com **0 erros** e Next.js build compilado com sucesso.
- **Organização por Menu no PDV (Açaí da Rose vs Lanches) & Design Clean**:
  - **Causa Raiz Resolvida**: No Montador Balcão do PDV (`PDVView.tsx`), todos os produtos da base de dados eram injetados diretamente na etapa 1 do seletor de taças de açaí, fazendo com que lanches (Pão de queijo, Pastel de nata, Croissants, etc.) fossem exibidos com regras de taça ("999 frutas inclusas", "0 acompanhamentos", "+ 1 creme incluso").
  - **Separação Canônica por Menus (`Açaí da Rose` / `Lanches`)**:
    - Adicionada barra de navegação com as abas canônicas `Açaí da Rose` e `Lanches` no cabeçalho do catálogo do PDV.
    - **Aba Açaí da Rose**: Exibe o wizard de 3 etapas de montagem de taça (`1. Tamanho da Taça`, `2. Cremes Gelados`, `3. Frutas & Acompanhamentos`) filtrando estritamente taças e recipientes.
    - **Aba Lanches**: Exibe grid de produtos unitários com categorias em pílulas (`Todas as Categorias`, `Tapiocas`, `Lanches`, `Pão de Queijo`, `Pastel de Nata`, `Croissants`), buscador rápido por nome e adição imediata à comanda com 1 clique.
  - **Design 100% Clean & Sem Ícones Decorativos**:
    - Removidos ícones supérfluos (como `Sparkles`, ícones de pacotes, talheres e animações `animate-pulse`), priorizando indicadores numéricos sóbrios e tipografia corporativa.
    - Ajustado glossário PT-PT: "Taça" e "Acompanhamentos".
  - **Controle Dinâmico de Quantidades no Carrinho (`CartSummary.tsx`)**:
    - Itens unitários de lanches possuem botões `+` e `-` para incremento ágil na comanda sem abrir modais de taça.
    - Suporte nativo em `useCartStore` (`addSimpleItem` e `updateItemQuantity`).
- **Comanda de Cozinha & Impressão Térmica de 80mm Padronizada**:
  - **Causa Raiz Resolvida (Corte/Não Renderização)**: O elemento `#kitchen-order-print` ficava encapsulado dentro do `DialogContent` do Radix UI com restrições de `overflow-y: auto`, `max-height: 75vh` e `position: fixed; transform: translate(-50%, -50%)`. No Chrome/Chromium, o motor de impressão corta a renderização na altura do container scrollável, gerando folhas em branco após o cabeçalho.
  - **Solução Definitiva (Direct Body Mount `#kitchen-print-mount`)**:
    - Em vez de um iframe oculto (que em browsers Chromium pode sofrer com viewport 0x0 gerando página em branco), agora o conteúdo é clonado diretamente para um container `<div id="kitchen-print-mount">` anexado diretamente ao `document.body`.
    - No `@media print`, todos os demais elementos do DOM (`body > *:not(#kitchen-print-mount)`) recebem `display: none !important`, e `#kitchen-print-mount` recebe `display: block !important` com largura estrita de 74mm (perfeito para bobinas de 80mm).
    - Essa abordagem é 100% livre de modais, `overflow-y`, `max-height` e `transforms`, renderizando todos os estilos Tailwind nativos e o pedido completo sem cortes nem páginas em branco.
  - **Nova Hierarquia Visual (Design Térmico de Bancada)**:
    - **Cabeçalho & Cliente Compactos**: Logo oficial reduzida para tamanho compacto (`h-9`), loja e emissão em linha única (`text-[9.5px]` e `text-[8.5px]`), e dados de cliente (`CLIENTE`, `CONTACTO`, `PAGAMENTO`) em fonte econômica (`text-[9px]`) para poupar papel.
    - **Destaque Máximo para a Produção**:
      - `SENHA: #001` grande e nítida com box de destino (`>>> MESA X <<<` ou `>>> BALCÃO <<<`) em borda preta sólida;
      - Recipiente / Taça em destaque reforçado (`border-2 border-black bg-zinc-100 p-1 font-black text-[13px]` com badge da quantidade);
      - Bases em destaque negrito;
      - Acompanhamentos em checklist quadrado bem nítido `[ ]` (`text-[11.5px] font-bold`) para conferência e marcação física rápida na bancada;
      - Observações em caixas de alto contraste (`border border-black bg-zinc-50`).
- **Sistema Universal de "Publicar Alterações" & Sincronização Dinâmica em Rede**:
  - **Causa Raiz Resolvida**: As alterações em produtos, categorias, destaques, modelos de opções, horários, dados de empresa e TV ficavam isoladas em abas do mesmo navegador (via `localStorage` / `BroadcastChannel`) ou aplicavam imediatamente sem rascunho de homologação.
  - **Tabelas Criadas no PostgreSQL 16 da VPS**:
    - `store_catalog_versions`: Controla `version`, `has_pending_changes`, `pending_changes_count`, `pending_changes_summary` (JSONB) e `published_at` por loja (`tenant_id`).
    - `store_tv_configs`: Persiste as definições reais de `marquee_config`, `videos_playlist`, `sound_config` e `display_config` na VPS para Smart TVs externas consumirem.
  - **Rotas de API Criadas**:
    - `GET /api/catalog/version`: Endpoint ultra-leve com `Cache-Control` e ETag para polling a cada 15s sem sobrecarga no servidor.
    - `POST /api/catalog/publish`: Publicação individual ou em rede completa (`replicateAll: true`), bump de versão e auditoria em `audit_logs`.
    - `POST /api/catalog/mark-dirty`: Marcação de rascunhos com histórico de ações amigáveis.
    - `GET / POST /api/tv/settings`: Persistência real de configurações de Smart TV.
  - **Componentes Instrumentados**:
    - `PublishChangesBanner.tsx`: Banner flutuante no topo de alto contraste visível em todas as 20 telas administrativas com badge de contagem de pendências, modal de resumo detalhado e botão de publicar com confirmação em rede.
    - `MenuHierarchyView.tsx`: Conectado `markDirty` em toggle de visibilidade/disponibilidade, exclusão, criação de categoria, reordenação e salvamento de itens.
    - `MenuCategoriesAdmin.tsx` e `MenuSectionsAdmin.tsx`: Conectado `markDirty` ao salvar, reordenar, deletar e ativar/desativar categorias e menus.
    - `QRCodeConfigView.tsx`: Conectado `markDirty` ao alterar modo de atendimento, regras de formulário e MB WAY.
    - `StoreCompanySettingsView.tsx`: Conectado `markDirty` ao alterar horários de funcionamento, NIF, contactos e morada.
    - `OptionModelsManagerDialog.tsx`: Conectado `markDirty` ao salvar, duplicar ou deletar modelos de opções.
    - `MenuHighlightsAdmin.tsx`: Conectado `markDirty` ao criar, editar, alterar visibilidade, horários, replicar ou excluir destaques.
    - `InventoryManagementView.tsx`: Conectado `markDirty` no botão `[ Pausar no Cardápio ]` do estoque híbrido.
    - `TVOrdersControlView.tsx`: Salva marquee, playlist e áudio no PostgreSQL e marca pendências no banner.
    - `TVOrdersPanelView.tsx`: Lê periodicamente as configurações completas do PostgreSQL.
    - `app/menu/page.tsx`: Polling a cada 15s para `/api/catalog/version` que recarrega o cardápio sem perda de carrinho (`cart`) do cliente.
    - `PDVView.tsx`: Atualização reativa de catálogo e polling a cada 15s preservando a comanda e montagem de taça ativa.

- **Correção da Identificação de Lojas nas Telas de TV (`/tv/[loja]`, `/tv`, `/chamada`)**:
  - Eliminado o ternário estático antigo em `app/tv/[loja]/page.tsx`, `app/tv/page.tsx` e `app/chamada/page.tsx` que forçava qualquer slug não-Torres Novas para a Matriz (Figueira da Foz).
  - Implementada e exportada a função canônica universal `resolveTenant(idOrSlug, tenants)` em `franchiseStore.ts`, resolvendo dinamicamente por slug (`aveiro`, `torres-novas`, `figueira-da-foz`), atalhos numéricos (`1`, `2`, `3`), nomes e UUIDs.
  - Integrado o carregamento em background dos tenants do banco de dados (`fetchTenants()`) no `TVOrdersPanelView.tsx` e vinculadas todas as chamadas de pedidos, áudio TTS e marquee ao `actualTenantId` resolvido.
  - A rota `/tv/aveiro` agora exibe corretamente **"Loja 3 - Aveiro (Franquia)"** e consome os pedidos exclusivos da unidade de Aveiro.
- **Nova Logo Oficial Global (`/logo-oficial-1.png`) & Sanitização de Lojas no Frontend**:
  - **Substituição da Logo Oficial**:
    - Nova logo em alta resolução com símbolo de marca registrada copiada para `public/logo-oficial-1.png` e espelhada em `public/logo-oficial.png`.
    - Todas as referências da aplicação atualizadas para `/logo-oficial-1.png` (`app/layout.tsx`, `app/login/page.tsx`, `app/not-found.tsx`, `app/receipt/[id]/page.tsx`, `CustomerMenuHeader.tsx`, `AppSidebar.tsx`, `LandingHeader.tsx`, `LandingFooter.tsx`, `TVOrdersPanelView.tsx`, `KitchenOrderPrintModal.tsx`, `TableThermalReceiptDialog.tsx`, `StoreSelectRadioDialog.tsx`, `SingleTableQRDialog.tsx`, `BatchTablesQRPrintDialog.tsx`, `TableQRCodeGeneratorDialog.tsx`, `emailService.ts`).
  - **Sanitização de Nome de Loja nas Telas de Clientes (TVs e QR Codes)**:
    - Funções canônicas `getDisplayStoreLocation(tenant, rawLoja)` e `getPublicStoreName(tenant, rawLoja, includeBrand)` em `franchiseStore.ts` higienizam strings como "Loja 1 - Figueira da Foz (Matriz)" para "Figueira da Foz" ou "Açaí da Rose — Figueira da Foz".
    - Telas de Smart TV (`/tv`, `/tv/[loja]`, `/chamada`), placas físicas de QR Code de mesas, gerador de QR codes e cabeçalho do menu do cliente agora exibem estritamente a nova logo e o nome limpo da localização da loja.
    - O ambiente interno de gestão (Admin Sidebar, Franqueadora B2B, Gestão de Lojas, Logs de Auditoria e banco PostgreSQL) permanece 100% íntegro com a nomenclatura canônica operacional ("Loja 1...", "Loja 2...", "Loja 3...").
- **Recuperação de Palavra-passe Híbrida (Automação 24/7 + Resgate Franqueadora/TI)**:
  - Integração com Resend API no domínio oficial verificado (`seguranca@acaidarose.pt`).
  - Template minimalista responsivo com fundo escuro, nova logo oficial centralizada e código de 6 dígitos em destaque.
  - Tabelas `password_reset_tokens` e `password_reset_requests` criadas no PostgreSQL 16 da VPS com expiração de 15 minutos e hash de segurança com bcrypt.
  - Endpoints `POST /api/auth/forgot-password` e `POST /api/auth/reset-password` integrados e auditados em `audit_logs`.
  - Componente `ForgotPasswordDialog.tsx` com link discreto na tela de login, fluxo em etapas, reenvio com cooldown de 60s e opção de contingência via WhatsApp com a Franqueadora.
- **Slogan Oficial da Marca & Portal da Equipa (Clean)**:
  - Corrigido o slogan oficial nos 4 Atos do Hero (`LandingHero.tsx`) e no rodapé institucional (`LandingFooter.tsx`) para:
    - *Açaí não se explica*
    - *Experimenta*
    - *Apaixona*
    - *E Repete*
  - Eliminado o bloco promocional com a frase de marketing gigante na tela de login (`app/login/page.tsx`).
  - Redesenhada a tela de autenticação para foco corporativo limpo no **Portal da Equipa**: removidos o logo pequeno redundante do topo e a pílula de badge, promovendo **"Portal da Equipa"** a título principal H1 de grande impacto com espaçamento perfeitamente equilibrado.
  - Inserida a logo oficial da marca como camada de fundo transparente (marca d'água sutil `opacity-[0.08]`) no painel do login.
  - Padronizado o botão de acesso no cabeçalho da landing page (`LandingHeader.tsx`) para `Portal da Equipa`.
- **Configurações de QR Code & Ementa Digital**:
  - Tabela `store_qrcode_settings` criada no PostgreSQL para persistência multi-tenant permanente.
  - Endpoints `GET` e `PUT` `/api/qrcode-config` 100% integrados ao banco de dados.
  - Checkout do cliente (`CustomerCartSheet.tsx`) respeitando dinamicamente todas as regras: controle de MB WAY, regras de campos (Nome, Telefone, NIF), modelo de atendimento (TV vs Mesa) e modo de visualização.
- **Painel de Smart TV (KDS)**:
  - Eliminados quaisquer fallbacks antigos de chamadas na TV (`TVOrdersPanelView.tsx`). A TV valida estritamente os pedidos ativos no banco de dados e remove instantaneamente comandas canceladas ou excluídas.
  - Adicionado controle de exibição da barra de "Últimos Pedidos Finalizados" no rodapé da Smart TV (`broadcastTVDisplayConfig`).
  - Disparo de `broadcastTVClearCall` ao excluir ou cancelar comandas no KDS.
- **Módulo de Pedidos ("Pedidos QR Code | Balcão")**:
  - Título atualizado no KDS (`QRCodeOrdersAdmin.tsx`).
  - Botão "Nova Comanda (PDV)" conectado para comutar diretamente para a interface completa do PDV Balcão & Mesas (`view: 'pdv'`).
  - Rota `app/admin/pdv/page.tsx` criada para redirecionamento limpo para `/?view=pdv`.
  - Corrigido o erro 500 no `UPDATE` de pedidos no PostgreSQL com cast `$8::jsonb` na coluna `items_json`.
  - Corrigidos warnings de acessibilidade Radix UI com a adição de `<DialogTitle>` nos modais de itens e auditoria.
- **Marquee 100% Customizável pelo Usuário (Zero Seeds & Fallbacks Travados)**:
  - Eliminados textos estáticos/seeds hardcoded no rodapé da Smart TV (`TVOrdersPanelView.tsx`).
  - Implementada interface completa `TVMarqueeConfig` com sincronização multi-tenant em tempo real (`lib/utils/tvBroadcast.ts`).
  - Nova aba "Editar Marquee" no painel staff (`TVOrdersControlView.tsx`) com:
    - Textos 100% livres (Mensagem Promocional e Mensagem Institucional);
    - Toggle para intercalar pedidos em preparo (`showPreparingOrders`);
    - Seletor de cor hexadecimal livre (`<input type="color">` + input hex + paleta de atalhos rápidos);
    - Tipografia customizável (Moderna Sans, Artesanal Cursiva, Digital Mono, Clássica Serif);
    - Escala de tamanhos dinâmicos (Pequeno, Médio, Grande, TV XL, Gigante 2XL, Max 3XL);
    - Controle contínuo de velocidade de rolagem (slider de 10s a 60s);
    - Live Preview interativo em tempo real simulando exatamente a TV;
    - Transmissão instantânea para as Smart TVs da loja.
- **Sincronização dos 4 Pilares do Cardápio & Estoque Híbrido (100% PostgreSQL)**:
  - Rotas `/api/categories` e `/api/menus` criadas com queries diretas e auditoria no banco.
  - Painéis `MenuCategoriesAdmin.tsx` e `MenuSectionsAdmin.tsx` conectados e persistindo no PostgreSQL.
  - Resolução da Causa Raiz da Categoria Pausada: propagação para `store_product_overrides`, ocultando no QR Code da mesa e no menu daquela loja, preservando as demais lojas ativas.
  - Purga total de seeds/fallbacks estáticos: removidos `defaultContainers`, `defaultBases` e `defaultToppings` em `productsRepository.ts` e stores Zustand.
  - Gestão e formulário de Opcionais adaptativo em `ProductEditDialog.tsx` (Frutas, Toppings, Caldas Nobres) com preços reais e cálculo de horário no fuso de Lisboa (`Europe/Lisbon`).
  - Modelo de Estoque Híbrido assistido por humano: sem bloqueios automáticos, botões rápidos `[ Pausar no Cardápio ]` e `[ Manter Ativo ]` em `InventoryManagementView.tsx`, e rastreabilidade total no log de auditoria (`AuditLogsView.tsx` - escopo `ESTOQUE_SUPPLY`).
- **Modelos de Opções & Governança Franqueadora vs Filial (100% PostgreSQL)**:
  - Adicionada coluna `option_groups JSONB` em `product_containers` e criada a tabela `product_option_models` para modelos reutilizáveis.
  - Pré-carregamento dos 4 modelos canônicos (Bases, Frutas, Acompanhamentos, Caldas) montados com dados reais do PostgreSQL caso o produto ainda não tenha opções salvas (nunca vem vazio).
  - Repositório `productsRepository.ts` atualizado para persistir `option_groups` no banco com registro de auditoria completo para o TI (`audit_logs`).
  - [x] Auditoria do banco de dados real PostgreSQL
  - [x] Criação da tabela `inventory_categories` e categorização de estoque (Nutella como CALDA)
  - [x] Separação e padronização dos dois códigos (`supply_code` B2B vs `code` PDV)
  - [x] Baixa de estoque em segundo plano (`decrementEstimatedStock`) sem travar vendas
  - [x] Logs de auditoria do TI em `audit_logs` (`AUTO_DECREMENT_STOCK`, `STOCK_ALERT_TRIGGERED`, etc.)
  - [x] UI Clean de categorias e insumos com filtro dinâmico
  - [x] Ajuste do PDV e Carrinho para glossário PT-PT e bases dinâmicas
  - [x] Validação TypeScript `npx tsc --noEmit` com código 0
  - Governança estrita Franqueadora vs Franqueado em `ProductEditDialog.tsx`:
    - Franqueadora Master: edição irrestrita de nomes, descrições, fotos, vídeos, preços e regras.
    - Franqueado Filial: modo leitura com cadeado 🔒, permissão para alternar visibilidade local (`Ativo / Oculto`) e botão **`[ Solicitar Ajuste à Franqueadora ]`** integrado ao `FranchiseRequestDialog`.
  - Campo de valor adicional (`Valor do Adicional (€)`) dinâmico em `OptionModelDialog.tsx` com botão `[ Aplicar a todos ]`.
  - Propagação dinâmica do valor adicional para `CustomerProductDetail.tsx`, `cartStore.ts` e `PDVView.tsx`.
  - Buscador em tempo real dos itens contratados em `OptionModelDialog.tsx` com remoção do placeholder antigo e ícone de pesquisa `Search`.
  - Ícones informativos `(i)` com descrições em tooltip adicionados a todos os 8 campos de configuração do modelo de opções.
  - As 8 regras de modelos de opções foram totalmente integradas e validadas no Menu do Cliente:
    - Cobrança dinâmica de excedentes da cota gratuita com o `Valor do Adicional (€)` (ex: 2º creme soma +2,00€ automaticamente);
    - Header com regra transparente ao cliente (`Até X grátis (extra +Y,YY€)`);
    - Exibição detalhada dos grupos e escolhas no Carrinho (`CustomerCartSheet.tsx`);
  - Limpeza de redundâncias de interface:
    - Removido o bloco duplicado e rudimentar de horários (`Definir horários específicos de disponibilidade`) de dentro de `ProductEditDialog.tsx`, centralizando toda a configuração na ação do Relógio (`ProductActiveHoursModal.tsx`);
    - Removido o botão desconectado `[Recomendar]` de `ProductRowItem.tsx`, mantendo a gestão de destaques unificada no módulo oficial `MenuHighlightsAdmin.tsx`.
  - **Clareza de Adicionais Grátis vs Excedentes com Live Preview (`OptionModelDialog.tsx`)**:
    - Rótulos adaptativos: Quando "Incluso no Copo (Grátis)", os campos exibem claramente **"Qtd. escolhas grátis incluídas"** *(com badge `Grátis`)* e **"Valor por escolha excedente (€)"** *(com badge `+ Extra`)*;
    - Botão **"Aplicar a todos"** agora é exibido **apenas no modo Individual**, ficando oculto no modo Grátis para eliminar qualquer confusão com a cota gratuita;
    - Card de **Pré-visualização Dinâmica no Cardápio (Live Preview)** em tempo real simulando exatamente o cabeçalho, os itens com seletores de quantidade/escolha e a explicação em linguagem natural da regra ativa.
  - **Dinamização Total Multi-Lojas na Franqueadora & Matriz Canônica (Figueira da Foz)**:
    - Removidos todos os dicionários e ternários estáticos (`STORE_SLUGS`, `STORE_LABELS`).
    - `useFranchiseStore` agora armazena a lista de lojas (`tenants: Tenant[]`) sincronizada com o PostgreSQL e provê o método `getTenant(idOrSlug)`.
    - Placas de mesa (`SingleTableQRDialog`, `BatchTablesQRPrintDialog`), QR codes de balcão (`QRCodeConfigView`), painéis de TV (`TVOrdersControlView`, `TVOrdersPanelView`) e o cardápio `/menu` agora geram e exibem títulos e URLs dinamicamente.
    - Qualquer nova loja criada na Franqueadora passa a funcionar automaticamente em todos os componentes sem necessidade de novas alterações de código.
    - Matriz corrigida canonicamente para **`Loja 1 - Figueira da Foz (Matriz)`** (slug `figueira-da-foz`).
  - **Sistema de IVA de Portugal (B2B da Franqueadora)**:
    - Segregação de Preço Líquido (sem IVA) + IVA (6%, 13%, 23%) = Total c/ IVA em todo o catálogo mestre de suprimentos, compras de fornecedores e pedidos de abastecimento da rede.
    - Campos de peso líquido (kg), preço por kg e margem líquida da Matriz integrados e persistidos no banco de dados.
  - **Módulo de Impressão Térmica QZ Tray & Layouts de Talão**:
    - **Modelos de Impressão (Layouts)**:
      - `FULL_RECEIPT` (Talão Completo Caixa - Foto 2): Cabeçalho institucional (nome, NIF, morada, contacto), comanda/ticket, data/hora, operador, cliente, discriminação de itens com bases e acompanhamentos (grátis / adicionais), subtotal, total em €, método de pagamento e aviso "Documento de conferência / Não serve de fatura".
      - `KITCHEN_SLIP` (Comanda de Produção / Cozinha): Itens, recipientes e acompanhamentos em destaque para expedição.
      - `TICKET_ONLY` (Ticket Rápido de Senha): Focado exclusivamente no número da senha e identificação do cliente/mesa.
    - **Destaque de Senha e Cliente no Topo**: Banner de alta visibilidade `[ #001 ]` e `MESA 1 - ROSANE` em tamanho duplo e negrito no topo do talão.
    - **Acentuação e Símbolo do Euro (€)**: Troca da codificação de página para `windows-1252` (`CODE_PAGE_WPC1252`), eliminando caracteres estranhos e garantindo `€` impecável nas impressoras ESC/POS (80mm).
    - **Configuração Multi-Impressora**: Seletores no `PrinterSettingsView.tsx` para definir o modelo de impressão e toggle para destacar a senha/cliente por impressora individual.
  - **Logs & Auditoria TI (`AuditLogsView.tsx` & `/api/dev/audit-logs`)**:
    - Integração de todos os eventos de impressão (`IMPRESSORAS_QZ`): cadastros, alterações de layout, testes de corte, impressões automáticas e eventuais falhas.
    - Mapeamento robusto com `SCOPE_ALIASES` para que os filtros por chip (`Impressoras & QZ Tray`, `Produtos & Cardápio`, `Estoque & B2B`, etc.) capturem 100% dos eventos mesmo com variações de escopo.
    - Contadores dinâmicos de eventos em cada chip de filtro.
    - Suporte a filtro por nível crítico (`ERROR`, `WARN`, `INFO`, `ALL`).
    - Modo de sincronização contínua ao vivo (`Auto-Sync 10s`).
  - **Correção da Impressão Térmica de Cozinha (Foto 1) e QR Code Contínuo**:
    - **Causa Raiz 1 (QR Code saindo cortado em 2 vias na Foto 2)**: Na impressão via navegador (`/receipt/[id]`), a folha continha margens e tamanho fixo no `@page`, fazendo o Chromium quebrar a página após a seção de pagamento. Drivers de bobina térmica executam guilhotina automática (`GS V 0`) em cada quebra de página, gerando o corte entre o pagamento e o QR Code. Corrigido com CSS contínuo estrito de 80mm (`width: 74mm`, `@page { margin: 0 }`, `break-inside: avoid !important`, `break-before: avoid !important` no QR code), garantindo talão 100% contínuo sem cortes indesejados.
    - **Causa Raiz 2 (Layout Cozinha saindo como Caixa na Foto 2)**: O pedido #001 foi impresso às 14:52 quando a Cozinha ainda estava com layout `FULL_RECEIPT` no banco, e o cache do `QRCodeOrdersAdmin` não atualizava dinamicamente ao salvar nas configurações. Implementado disparador de evento `printers-updated` no `PrinterSettingsView`, re-busca periódica (30s) e suporte a duplo layout nativo na página `/receipt/[id]` com alternador imediato entre `Comanda Cozinha (Foto 1)` e `Talão Caixa (Foto 2)`.
    - **Aprimoramento da Comanda de Cozinha (ESC/POS & Web)**: Formatação dos acompanhamentos e modificadores no padrão checklist operacional `[ ] Item (Qtd)` para bancada de montagem rápida, aviso de saco de transporte e destino em alto contraste.
- **Compilação & Validação**:
  - `npx tsc --noEmit` validado com 0 erros.
  - Sincronização e envio de dados testados com QZ Tray e impressão contínua.

---

## [Plano de Execução: Blindagem B2B Franquias & Regras de Produtos/Opcionais Sem Fallbacks]

### 1. Diagnóstico e Causa Raiz
1. **Vazamento de Custos em Torres Novas (`StoreSupplyOrdersView.tsx`)**:
   - `app/page.tsx` carregava `/api/tenants`, mas não chamava `setTenants` na store do Zustand (`useFranchiseStore`).
   - Com isso, a lista de lojas ficava apenas com a Matriz inicial. Ao buscar Torres Novas (`22222222-...`), `resolveTenant` caía no fallback `list[0]`, tratando Torres Novas indevidamente como Matriz.
   - `StoreSupplyOrdersView` também não validava a `role` do usuário: gerentes de franquia (`TENANT_ADMIN`) jamais podem ver dados de Franqueadora.
2. **Brecha de Montagem no Açaí (Açaí Tradicional Fixo + 1 Creme Incluso)**:
   - No PDV (`BaseSelector.tsx`) e Cardápio (`cartStore.ts`), o Açaí Tradicional vinha como um botão opcional desmarcado.
   - O cliente conseguia desmarcar o açaí e selecionar 2 cremes gelados caros (ex: Ninho + Pitaya) pelo preço do açaí comum, causando prejuízo.
   - O produto tradicional de Açaí deve vir com **Açaí Tradicional obrigatório/fixo incluso**, dando direito a **+1 creme gelado incluso**. Cremes adicionais somam **+€ 2,00 cada**.
   - Para quem deseja apenas cremes sem açaí, já existem os produtos específicos `Copo (Somente Creme)` com preços ajustados (€ 7.50, € 10.50, etc.).
3. **Auditoria de Edição de Produtos & Opcionais (Eliminação Total de Fallbacks/Mocks)**:
   - `ContainerAssemblyRulesDialog.tsx` só enviava `limiteBases` e `limiteComplementosGratis`, descartando `limiteFrutas` e `limiteToppings` e não atualizando `option_groups`.
   - `productsRepository.ts` continha ternários fixos no código (`limiteFrutas = weight === 250 ? 2 : weight === 350 ? 3 : 999`), ignorando os valores gravados no PostgreSQL.
   - `ProductEditDialog.tsx` usava funções de defaults baseadas em `weight` em vez de persistir e ler as configurações reais do banco de dados.

---

### 2. Arquitetura e Regras de Negócio (100% PostgreSQL — Zero Mock / Zero Fallback)
1. **Na Edição de Produto (`ProductEditDialog.tsx` & `ContainerAssemblyRulesDialog.tsx`)**:
   - Cada produto do tipo montagem (Copo / Taça / Caixa) possui em `product_containers.option_groups` e colunas reais:
     - `isBaseFixed`: boolean indicando se o Açaí Tradicional é a base fixa inclusa (padrão `true` para copos de açaí, `false` para produtos "Somente Creme").
     - `limite_bases` / `maxQty`: quantidade de cremes gelados inclusos (ex: 1 incluso para açaí; 2 inclusos para somente creme).
     - `additionalPrice`: preço cobrado por creme excedente (ex: € 2,00).
     - `limite_complementos_gratis`: quantidade de acompanhamentos inclusos (ou 999 para livre).
     - `limite_frutas`: quantidade de frutas inclusas (ou 999 para livre).
   - Ao salvar na Franqueadora/Matriz, os dados são salvos em `product_containers` no PostgreSQL e propagados para a rede.
2. **Na Edição de Opcional (`ProductEditDialog.tsx`, `product_bases`, `product_toppings`)**:
   - O usuário pode alterar livremente nomes, preços adicionais (`preco_extra`), categoria, status ativo/inativo e mídias.
   - O repositório e as telas lêem 100% desses registros sem criar defaults que sobrescrevam o usuário.
3. **No PDV e Cardápio (`BaseSelector.tsx`, `PDVView.tsx`, `cartStore.ts`, `CustomerProductDetail.tsx`)**:
   - Lêem a configuração do produto do banco de dados:
     - Se `isBaseFixed: true`: Açaí Tradicional aparece fixo com badge `[✓ Base Fixa Inclusa]` (bloqueado contra desmarcação).
     - O seletor de cremes exibe: *"Cremes Gelados (1 incluso no pedido • Cremes adicionais +€ 2,00 cada)"*.
     - Se o produto for "Somente Creme" (`isBaseFixed: false`): permite selecionar 2 cremes inclusos.
   - O cálculo em `cartStore.ts` respeita estritamente o `additionalPrice` e limites salvos no produto.
4. **Página de Vendas B2B para Franquias (`StoreSupplyOrdersView.tsx`)**:
   - Oculta 100% de custos da Matriz e margens de lucro para qualquer usuário de filial/franquia ou não-admin.
   - Catálogo comercial limpo: Nome, Categoria, Unidade/Embalagem, Preço Líquido (s/ IVA), Alíquota IVA, Preço c/ IVA, Quantidade a Pedir.
   - Frete fixo de € 60,00 por pedido adicionado no carrinho e checkout.
   - Botões de criação/edição de insumos bloqueados para franquias.

---

### 3. Fases de Execução
- [x] **Fase 1**: Blindagem de Matriz vs Franquias no `app/page.tsx` e `StoreSupplyOrdersView.tsx` (Página de Vendas B2B + Frete Fixo € 60,00).
- [x] **Fase 2**: Eliminar fallbacks em `productsRepository.ts` e salvar regras completas em `ContainerAssemblyRulesDialog.tsx` e `ProductEditDialog.tsx`.
- [x] **Fase 3**: Refatorar `BaseSelector.tsx`, `CustomerProductDetail.tsx` e `cartStore.ts` com Açaí Tradicional fixo + 1 creme incluso (e 2 cremes para Somente Creme) — design clean sem ícones decorativos ou emojis.
- [x] **Fase 4**: Migração do PostgreSQL executada (`shipping_fee`, Categoria `GRAFICOS`, 10 Fornecedores oficiais), validação `npx tsc --noEmit` com código 0 e deploy contínuo em execução.

---

## [Plano de Execução: Identificação de Mesa/Esplanada vs Balcão, Notificação Seletiva no Telemóvel & Aba de Balcão no Gestor de Mesas]

### 1. Diagnóstico & Análise Técnica Aprofundada

#### A. Identificação do Ponto de Atendimento (Esplanada vs. Balcão)
- **Cenário Atual**:
  - O sistema foi desenhado primariamente em torno de mesas numéricas (`Mesa 01`, `Mesa 02`). Se o cliente entra no `/menu` sem parâmetro de mesa ou token, o cardápio entrava em modo `Catálogo Digital (View Only)` bloqueando pedidos de autoatendimento no balcão.
  - Em Portugal (Figueira da Foz, Torres Novas, Aveiro), a nomenclatura oficial do salão/exterior é **Esplanada** (ex: `Esplanada 01`), e os pedidos feitos em pé na fila são **Balcão**.
- **Solução Arquitetural**:
  - **Mesa de Esplanada**:
    - URL do QR Code: `/menu?tipo=mesa&numero=04&loja=figueira-da-foz&token=tb04_xxx`.
    - Cabeçalho do menu exibe: `Esplanada 04 · Figueira da Foz`.
    - Pedido gravado no banco com: `tableNumber: 'Esplanada 04'` (ou `04`), `isTableOrder: true`.
    - Na Comanda de Cozinha (`KITCHEN_SLIP`): Topo destaca **`ESPLANADA 04 - [NOME DO CLIENTE]`**.
    - No PDV/Admin de Pedidos: Badge de alta visibilidade `ESPLANADA 04`.
    - Na TV de Senhas: Ticket exibe `ESPLANADA 04`.
  - **Balcão (Autoatendimento)**:
    - URL do QR Code: `/menu?tipo=balcao&loja=figueira-da-foz`.
    - Cabeçalho do menu exibe: `Balcão · Figueira da Foz`.
    - Cardápio ativo para compras normais (desativa o bloqueio `VIEW_ONLY`).
    - Campo **Nome do Cliente** torna-se **estritamente obrigatório** para identificação de entrega.
    - Pedido gravado no banco com: `tableNumber: 'Balcão'`, `isTableOrder: false`.
    - Na Comanda de Cozinha (`KITCHEN_SLIP`): Topo destaca **`BALCÃO - [NOME DO CLIENTE]`**.
    - No PDV/Admin de Pedidos: Badge diferenciada `BALCÃO`.
    - Na TV de Senhas: Ticket exibe `BALCÃO` e TTS anuncia: *"Senha #003, Rosane, retirar no balcão"*.

---

#### B. Notificação no Telemóvel: Análise Técnica de "Broadcast vs. IP do Telemóvel" (Zero Alarme Falso)
O usuário levantou a dúvida técnica: *"se for por balcão e broadcast ou IP do telemóvel para não notificar todos"*.

1. **Por que Identificar por IP do Telemóvel NÃO FUNCIONA (e causa desastre de UX)**:
   - **NAT no Wi-Fi da Loja**: Clientes conectados à rede Wi-Fi da loja compartilham o **mesmo endereço IP público** do roteador.
   - **CGNAT no 4G/5G**: Operadoras móveis (MEO, Vodafone, NOS) colocam centenas de smartphones sob o mesmo endereço IP público através de Carrier-Grade NAT.
   - **Consequência do IP**: Se o servidor disparasse a notificação para o IP do cliente cujo pedido ficou pronto, **todos os telemóveis de clientes conectados no Wi-Fi da loja apitariam ao mesmo tempo**, gerando falso alarme generalizado e correria indevida ao balcão.
2. **Por que Broadcast Global sem Filtro também FALHA**:
   - Se o servidor enviar um broadcast via SSE / WebSocket dizendo *"Pedido #003 pronto!"* para todos os clientes conectados no cardápio da loja, todos os celulares tocariam som e vibrariam.
3. **A Solução Técnica Segura, Robusta e À Prova de Falhas: Vínculo Local por `orderId` Único**:
   - **Passo 1 (Criação do Pedido)**: Ao finalizar o pedido no `/menu`, o backend retorna o objeto criado com `id` (UUID único, ex: `c7f91a2b-3456-4b89-a1b2-c3d4e5f67890`), `orderNumber` (`003`), `customerName` (`Rosane`), `status` (`PREPARING`).
   - **Passo 2 (Gravação Local no Smartphone)**: O navegador do cliente grava imediatamente no seu próprio `localStorage`:
     ```ts
     localStorage.setItem('customer_active_order', JSON.stringify({
       orderId: 'c7f91a2b-3456-4b89-a1b2-c3d4e5f67890',
       orderNumber: '003',
       customerName: 'Rosane',
       tableLabel: 'Balcão', // ou 'Esplanada 04'
       tenantId: '11111111-1111-1111-1111-111111111111',
       storeSlug: 'figueira-da-foz',
       status: 'PREPARING',
       notifiedReady: false
     }))
     ```
   - **Passo 3 (Escuta e Notificação Seletiva 100% Blindada)**:
     - O componente `CustomerOrderLiveTracker.tsx` no telemóvel do cliente implementa dupla camada de monitoramento:
       1. **Polling Atômico Dedicado**: A cada 3 a 4 segundos, consulta `GET /api/orders/${activeOrder.orderId}/status`. Como NENHUM outro telemóvel possui esse UUID no seu `localStorage`, **apenas o smartphone do dono consulta e recebe o seu próprio status**.
       2. **Filtro Estrito em Eventos Realtime/Broadcast**: Caso a TV ou o Admin emita um evento via SSE/BroadcastChannel:
          ```ts
          if (!activeOrder || event.orderId !== activeOrder.orderId) {
            return // Ignora solenemente! Silêncio absoluto no telemóvel alheio.
          }
          ```
   - **Passo 4 (Disparo do Alerta Único no Celular Correto)**:
     - Quando `status === 'READY'` (ou o operador clica em `[ Chamar na TV ]`):
       - Som limpo de chime via Web Audio API (`playOrderNotificationSound()`).
       - Vibração tátil no celular: `navigator.vibrate([300, 150, 300, 150, 500])`.
       - Modal de tela cheia no telemóvel:
         - *"O seu Açaí está pronto!"*
         - *"Senha #003 · Rosane"*
         - *"Pode retirar no balcão de entrega."*
         - Botão `[ Já Retirei / Concluir ]` que encerra o tracker.
       - Marca `notifiedReady: true` no `localStorage` para evitar repetições contínuas.

---

#### C. Aba Separada para o QR Code de Balcão no Gestor de Mesas (`TablesManagementView.tsx`)
O usuário solicitou: *"e o Qr code balcao pode separar uma aba dentro do gestor de mesas para não quebrar o token e criar rotas diferentes"*.

1. **Como Não Quebrar o Token e Não Criar Rotas Conflitantes**:
   - As mesas normais possuem registros na tabela `tables` com `table_number` (INTEGER) e `qr_code_token` (VARCHAR).
   - Se tentássemos criar uma "mesa balcão" com `table_number = 'Balcão'`, o PostgreSQL geraria erro de tipagem (`INTEGER` vs `STRING`), ou poluiria a contagem de mesas do salão.
   - **Arquitetura da Aba no Gestor de Mesas**:
     - No `TablesManagementView.tsx`, incluir o componente de Abas (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`):
       - **Aba 1: `Mesas de Esplanada`**:
         - Mantém 100% da lógica atual de listagem de mesas (números 01, 02, etc.), geração de tokens hash criptográficos (`tb01_xxx`), exclusão e diálogo de impressão em lote e individual.
         - Atualiza os rótulos de exibição de `Mesa 01` para `Esplanada 01`.
       - **Aba 2: `QR Code do Balcão`**:
         - Área dedicada para configurar, visualizar e imprimir a placa física do Balcão de Autoatendimento da loja selecionada.
         - **Rota Canônica Uniforme**: Aponta para `${origin}/menu?tipo=balcao&loja=${lojaSlug}`.
         - Mantém a mesma rota canônica `/menu`, sem criar sub-rotas órfãs ou duplicadas.
         - Gera placa de alta fidelidade para corte e montagem em acrílico/balcão:
           - Logotipo oficial Açaí da Rose + Identificação da Loja.
           - QR Code SVG nítido em alta resolução.
           - Título: **BALCÃO DE ATENDIMENTO**.
           - Instrução: *"Aponte a câmara do seu telemóvel, faça o seu pedido e acompanhe a chamada"*.
         - Ações na aba: `[ Copiar Link do Balcão ]`, `[ Descarregar Imagem PNG ]` e `[ Imprimir Placa de Balcão ]`.

---

### 2. Mapa de Arquivos a Serem Modificados

1. **`components/admin/tables/TablesManagementView.tsx`**:
   - Integração das abas `[ Mesas de Esplanada ]` e `[ QR Code do Balcão ]` via `@/components/ui/tabs`.
   - Aba Esplanada: listagem e impressão de placas de mesa renomeadas para `Esplanada XX`.
   - Aba Balcão: visualizador da placa física de balcão com botões de cópia de link, download PNG e impressão.
2. **`components/admin/tables/SingleTableQRDialog.tsx` & `BatchTablesQRPrintDialog.tsx`**:
   - Nomenclatura atualizada para `Esplanada XX` (ex: `Esplanada 01`, `Esplanada 02`).
   - Design clean sem ícones decorativos ou emojis.
3. **`app/menu/page.tsx`**:
   - Suporte a `tipo=balcao`: define `isBalcao = true`, permitindo pedidos normais de balcão (sem travar em `VIEW_ONLY`).
   - Nomenclatura do cabeçalho: `Esplanada XX · [Loja]` (se mesa) ou `Balcão · [Loja]` (se balcão).
4. **`app/api/orders/route.ts`**:
   - Ajustar validação de mesa física: se `isTableOrder === false` ou `tableNumber === 'Balcão'`, não executa checagem de `Number(tableNumber)` na tabela de mesas (evita erro `NaN` e rejeição indevida).
5. **`components/menu/CustomerCartSheet.tsx`**:
   - Se for balcão, campo `Nome do Cliente` torna-se obrigatório.
   - Envio do pedido com `tableNumber: 'Balcão'` e `isTableOrder: false`.
   - Ao receber a resposta da criação do pedido com sucesso, persiste o objeto no `localStorage` (`customer_active_order`).
6. **`components/menu/CustomerOrderLiveTracker.tsx` (Novo Componente)**:
   - Barra de status elegante fixada no rodapé do cardápio: `Pedido #003 · A preparar... [Ver Estado]`.
   - Hook de polling atômico dedicado a cada 3s em `/api/orders/${orderId}` + escuta de chamadas.
   - Filtro de isolamento estrito: só reage se `event.orderId === activeOrder.orderId`.
   - Disparo de Web Audio (chime), vibração (`navigator.vibrate`) e modal de retirada quando `status === 'READY'`.

---

### 3. Fases de Execução Propostas

- [x] **Fase 1**: Abas de Esplanada vs. Balcão no Gestor de Mesas (`TablesManagementView.tsx`):
  - Criadas abas Radix UI `[ Mesas de Esplanada ]` e `[ QR Code do Balcão ]`.
  - Implementado visualizador, download SVG/PNG e impressor da Placa Oficial de Balcão com rota `/menu?tipo=balcao&loja=...` (`CounterQRView.tsx`).
  - Atualizadas nomenclaturas das placas individuais e em lote para `Esplanada XX`.
- [x] **Fase 2**: Suporte a Pedido de Balcão no Menu & API de Pedidos:
  - `app/menu/page.tsx`: liberados pedidos quando `tipo=balcao` sem exigir mesa.
  - `app/api/orders/route.ts`: validação flexibilizada para não exigir mesa física no banco para `Balcão`.
  - `CustomerCartSheet.tsx`: Nome do Cliente obrigatório para pedidos de balcão e persistência do `customer_active_order` no `localStorage`.
- [x] **Fase 3**: Notificação Seletiva no Telemóvel do Cliente (`CustomerOrderLiveTracker.tsx`):
  - Criado componente de acompanhamento em tempo real no `/menu`.
  - Consulta atômica de status do pedido do cliente por `orderId` único a cada 3.5s.
  - Disparo de som de chime (Web Audio API) + vibração tátil (`navigator.vibrate`) + modal em ecrã inteiro quando o pedido estiver `READY` ou chamado.
  - Blindagem contra alarme falso em celulares de terceiros (filtragem estrita por `orderId` e `orderNumber`).
- [x] **Fase 4**: Kanban e Histórico Operacional atualizados para Esplanada vs. Balcão:
  - `QRCodeOrdersAdmin.tsx`: badges dinâmicas `Esplanada XX` vs `Balcão` no Kanban e na tabela.
  - `KitchenOrderPrintModal.tsx`: cabeçalho de destino atualizado para `ESPLANADA` vs `BALCÃO` e sem QR Code na impressão de produção.
  - `OrderItemsModal.tsx` & `OrderHistoryAdminView.tsx`: rótulos e badges atualizados.
- [x] **Fase 5**: Validação e Build:
  - `npx tsc --noEmit` executado com código 0 (sem erros de tipagem).
  - `npm run build` executado com código 0 (41 rotas estáticas e dinâmicas geradas com sucesso).




