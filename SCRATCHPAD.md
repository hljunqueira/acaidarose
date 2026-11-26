# SCRATCHPAD - Status de Implementação

## [Status Atual: 22/11/2026]

### Evoluções, Correções & Validações em Produção Live (Últimos Commits `37fc68ea`, `0aba04f8`, `ca13a1a5`, `c88ff78c`, `917008a3`):

1. **Ordem Dinâmica dos Opcionais (100% Definida pela Franqueadora)**:
   - Não existe sequência rígida ou padrão estático no código: a exibição respeita estritamente o `display_order` configurado livremente pela Franqueadora no painel administrativo (`product_option_models` e `option_groups`).
   - `CustomerProductDetail.tsx` e `PDVItemOptionsModal.tsx` realizam ordenação puramente baseada no `displayOrder` configurado no banco de dados, garantindo que o cardápio e o PDV sigam sempre e exclusivamente a ordem determinada pela Franqueadora.

2. **Preços de Opcionais 100% Configuráveis no Painel (Commit `c88ff78c`)**:
   - Eliminadas quaisquer regras rígidas ou escalas proporcionais fixas no código (zero hardcode por peso).
   - `productsRepository.ts`, `CustomerProductDetail.tsx` e `PDVView.tsx` leem diretamente os valores definidos pelo administrador no modelo de opções ou customizados por produto (`customProdPrice ?? opt.price ?? canonicalModel.additional_price ?? 0`), garantindo precificação configurável com total liberdade para a Franqueadora.

3. **Visibilidade e Pausa de Itens 100% Dinâmica por Loja (Commit `917008a3`)**:
   - O controle de visibilidade no `ProductEditDialog.tsx` preserva com exatidão o estado `active: opt.active !== false` configurado pelo operador, sem loops agressivos.
   - `updateOptionModel` preserva preços e configurações de opções sem sobrescrever silenciosamente os containers.
   - `toggleStoreItemStatus` no backend sincroniza os overrides de disponibilidade e visibilidade simultaneamente por ID, nome e código do item (ex: `FRU-004`) na tabela `store_product_overrides` por `tenant_id`.
   - A resolução de catálogo (`productsRepository.ts`) avalia todos os overrides ativos da loja (`matchedOverrides.some(...)`), garantindo que ativar ou pausar qualquer opcional reflita de imediato no cardápio e no PDV daquela unidade.

4. **PDV com Etapas Dinâmicas & Sem Preview Fixo (Commit `c88ff78c`)**:
   - O fluxo de montagem do PDV (`PDVView.tsx`, `StepIndicator.tsx`, `ToppingSelector.tsx`) adapta-se dinamicamente às etapas e grupos do modelo de opções configurados no banco, sem passos fixos ou restrições artificiais.

5. **Central de Ajuda e Manuais Interativos (Commits `ca13a1a5`, `0aba04f8`, `37fc68ea`)**:
   - Editor em tela cheia (Full-Screen) com Live Preview interativo, callouts visuais e categorias em destaque.
   - Mockups de tela em HTML estilizados com barra de janela (Window Frame Mockup) de alta definição.
   - Correção na troca de perfis e sincronização de token na URL.
   - Controles Super Admin: visualização de dados dos votantes, exclusão individual de feedbacks e reset de votos por manual.

6. **Módulo de Fidelidade & Cashback Próprio (Arquitetura Multi-Tenant & Banco 100% Zerado)**:
   - Plataforma S2Cashback mapeada e substituída (economia de 184,38 €/mês).
   - Banco de dados inicia **100% ZERADO** (zero seeds, zero dados pré-populados de prêmios, regras ou campanhas).
   - **Zero Campanhas Hardcoded**: "Convidar" e "Segunda Dobrada" NÃO são implementadas de forma rígida no código. Em seu lugar, existe um motor genérico de campanhas, multiplicadores e códigos promocionais configurável sob demanda no painel administrativo pela Franqueadora.
   - Pontuação exclusiva para Açaí (produtos com `cashback_enabled: true`), ignorando café, lanches e bebidas industriais. No gerenciamento administrativo, consome diretamente a API do catálogo (`GET /api/products?tenantId=...`) para incluir produtos e prêmios reais sem duplicidade.
   - Integração relacional estrita: 100% amarrada à tabela existente `tenants` (`tenant_id UUID REFERENCES tenants(id)`), com Matriz Figueira da Foz como sede oficial (`is_headquarters = true`, ID `11111111-1111-1111-1111-111111111111`). Zero tabelas de lojas duplicadas ou mocks fictícios.
   - PDR Oficial e Especificação de Integração atualizados em `docs/PDR_MOBILE_CASHBACK_E_INTEGRACAO_ADMIN.md` (Versão 2.1).
   - **Governança Centralizada (Franqueadora) vs. Operação Restrita (Lojas)**: Definida a matriz estrita de permissões. A Franqueadora (`FRANCHISOR_ADMIN`) tem controle absoluto sobre catálogo de prêmios, custos em pontos, campanhas da rede, ativação de módulos e compensação financeira B2B (Clearing). O administrador da loja (`TENANT_ADMIN`) possui interface operacional simplificada em 2 abas, sem acesso a regras ou prêmios: apenas atende clientes locais, dá baixa manual em vouchers (`REDEEMED`) e efetua créditos pontuais em contingência com justificativa obrigatória registrada em `audit_logs`, além de consultar o extrato filtrado exclusivamente pelo seu `tenant_id`.
   - **Hero Oficial & Linguagem Amigável (Zero Jargão / Sem VIP / Sem Clube)**: Aprovada a integração da essência da landing page oficial (`app.acaidarose.pt`) no topo da Home do app ("Açaí Não se Explica: Experimenta, Apaixona e Repete") com fotografia apetitosa do açaí, eliminando termos corporativos/elitistas ("VIP", "Clube", "Patamares") em favor de uma comunicação calorosa, simples e próxima ("O Teu Cartão", "O Teu Saldo", "Amigos da Rose", "Açaí Todo Mês").
   - **Auditoria de Engenharia Mobile**: Adicionadas salvaguardas para Contingência Offline no balcão (cache criptografado via `expo-secure-store` e QR Code assinado offline), proteção contra screenshots (`preventScreenCaptureAsync`) e TOTP dinâmico rotativo a cada 60s, travas de idempotência (`X-Idempotency-Key`) e concorrência (`SELECT FOR UPDATE`) no PDV, ciclo de Refresh Token Rotation silencioso e desbloqueio por Biometria (`expo-local-authentication`), além de conformidade com Apple Review Guidelines (5.1.1 para exclusão de conta e 3.1.5(a) para serviços físicos fora do app).
   - **Auditoria de Product Management**: Aprimorada a UX com Onboarding de 15 segundos no balcão (Telemóvel + Nome + PIN de 4 dígitos), equivalência tangível dos pontos em produto real ("180 pts = 1 Copo 350g grátis"), ancoragem de botões na Thumb Zone ergonômica, feedback háptico sensorial (`expo-haptics`) com animação sutil de confetes no resgate, e redução da ansiedade do cliente com garantia de estorno automático para vouchers expirados.
   - **Padrão de Redação Natural & Skill Humanizer (Seção 13.7 do PDR)**: Toda a comunicação do app móvel segue os filtros da skill Humanizer (sem fórmulas "Not X but Y", sem aforismos pomposos, sem jargões de IA) e obedece estritamente ao Glossário Canônico: "Copo" obrigatório para 250g, 350g e 500g; "Taça" exclusivo para 750g e 1kg no salão; "Caixinha Plástica" para takeaway; proibição total de "Tigela"; "Acompanhamentos" (nunca "Complementos"); "Pedido" (nunca "Carrinho"); vocabulário estrito PT-PT ("Telemóvel", "Palavra-passe", "Talão/Fatura", "Registo", "Ecrã").
   - **Herança do Catálogo & Precificação de Pontos (Single Source of Truth - Seção 4.2 e 4.3 do PDR)**: O modal de inclusão de prêmios da Franqueadora consome `GET /api/products?tenantId=...`, puxando automaticamente foto oficial (`image`/`videoPoster`), nome (`name`, `nameEn`, `nameEs`), descrição, peso em gramas (`weightGrams`) e preço em euro (`precoBase`). O custo em pontos é 100% definido pela Franqueadora (com calculadora de sugestão inteligente baseada em taxa de retorno de ~4,5% a 5% sobre o preço em euro, editável livremente). Vínculo relacional estrito por `product_container_id` (zero redundância). Mapeados os 3 fluxos completos em diagrama de sequência: Inclusão $\rightarrow$ Renderização no App $\rightarrow$ Baixa a 0,00 € e estoque no PDV.
   - **Mapeamento Exaustivo de Telas e Tarefas (Seções 2.4 e 4.2/4.4 do PDR)**: Detalhadas todas as 11 telas do app mobile (`splash`, `login`, `registo`, `recuperar`, `index` com Hero oficial, `premios`, `extrato`, `perfil` com exclusão de conta Apple 5.1.1, `qrcode` dinâmico TOTP, `voucher` com timer 24h e celebração, `lojas` com GPS Haversine) e todas as 8 abas da Franqueadora + 2 abas operacionais das Franquias no Admin, contendo componentes, tarefas do usuário, estados de tela, micro-interações e endpoints consumidos.
   - **Camada Perimetral de Segurança Cloudflare & Rate Limiting (Seção 12.7 do PDR)**: DNS proxied (Orange Cloud) mascarando IP da VPS, mitigação DDoS L3/L4 e L7 nos domínios `app.acaidarose.pt` e `api.acaidarose.pt`, regras de rate limiting cirúrgicas (login: 5 req/min, OTP/recuperação: 3 req/hora por telemóvel, registo: 3 req/10 min por IP, resgate de prêmios: 2/min), Cloudflare API Shield com inspeção de User-Agent do app móvel e validação estrita de JSON schema, SSL/TLS Full (Strict) + HSTS, e Cloudflare R2 para mídias com zero custo de tráfego de saída (*zero egress fees*) e CDN em Portugal.
   - **Racional de Armazenamento na VPS & Decisão do Mesmo Banco de Dados (Seção 5.1 do PDR)**: Manutenção do módulo de fidelidade no mesmo banco PostgreSQL da VPS. Volumetria projetada de 40 MB a 60 MB em 1 a 2 anos (< 0,10% do disco da VPS), integridade referencial canônica via `FOREIGN KEY` com `tenants(id)`, `product_containers(id)` e `orders(id)`, reutilização do pool `pg.Pool` (`max: 20`) de `lib/db/postgres.ts` economizando 150-300MB de RAM na VPS, e isolamento de domínio via prefixo `loyalty_*`.
   - **Utilitários Complementares de Produção & Migração DDL Pronta (Seção 3.3 do PDR)**: Especificados o serviço de Push Notifications nativas (`pushNotificationService.ts`), gateway OTP transacional (WhatsApp Cloud API com fallback SMS), Cron Job diário (`POST /api/cron/loyalty-maintenance`) com chave de autorização `CRON_SECRET` para estorno automático de vouchers expirados e avisos preventivos aos 150 dias de inatividade, e matriz de variáveis de ambiente de produção (`.env`). Gerados o script DDL limpo `scripts/migrations/create_loyalty_module_tables.sql` e o executor `scripts/migrate_loyalty_tables.js`.
   - **Conclusão da Fase 1 (Banco & Backend APIs Prontos)**:
     1. Migration executada com sucesso no PostgreSQL da VPS (`node scripts/migrate_loyalty_tables.js`), criando as 8 tabelas `loyalty_*`, constraints, índices e colunas `cashback_enabled` e `points_cost` em `product_containers`.
     2. Tipagem completa definida em `types/loyalty.ts` (clientes, transações, vouchers, prêmios, campanhas, clearing B2B e DTOs de PDV/Mobile).
     3. Repositório central de dados `lib/repositories/loyaltyRepository.ts` implementado com transações atômicas `withTransaction`, concorrência controlada via `SELECT FOR UPDATE`, chave de idempotência `X-Idempotency-Key` contra duplicações, pontuação exclusiva para açaí (`cashback_enabled`), queima com clearing B2B e estorno diário de vouchers expirados.
     4. Autenticação e segurança em `lib/services/loyaltyAuth.ts` (tokens HMAC-SHA256, hash de senha com `bcryptjs`).
     5. Endpoints de API operacionais: `/api/pdv/loyalty/lookup`, `/api/pdv/loyalty/credit`, `/api/pdv/loyalty/redeem-voucher`, `/api/loyalty/auth/register`, `/api/loyalty/auth/login`, `/api/loyalty/rewards`, `/api/loyalty/rewards/redeem`, `/api/loyalty/vouchers`, `/api/loyalty/transactions` e `/api/cron/loyalty-maintenance`.
     6. Verificação estrita de compilação TypeScript com `npx tsc --noEmit` validada com sucesso (código 0).
   - **Conclusão da Fase 2 (Módulo Mobile Expo Pronto em `mobile/`)**:
     1. Configuração do ecossistema Expo em `mobile/package.json`, `mobile/app.json` e `mobile/tsconfig.json`.
     2. Constantes de design profissional em `mobile/constants/Colors.ts` (Light Mode com Roxo Açaí `#4A0E4E` e Dourado `#D4AF37`) e `mobile/constants/Typography.ts` (Apple HIG).
     3. Serviços de API e sessão: `mobile/services/api.ts` (Axios com interceptor Bearer) e `mobile/services/authStorage.ts` (SecureStore criptografado).
     4. Hooks React Query e Zustand: `mobile/hooks/useAuth.ts`, `mobile/hooks/useLoyalty.ts` e `mobile/hooks/useHaptics.ts`.
     5. Componentes de UI: `GlobalHeader`, `HeroHomeCard`, `PointsCard`, `CampaignCard`, `RewardCard`, `TransactionItem` e `EmptyState`.
     6. Arquitetura de Telas Expo Router:
        - Layout Raiz: `mobile/app/_layout.tsx` (Providers, StatusBar, SafeArea).
        - Autenticação: `mobile/app/(auth)/login.tsx` (com Face ID) e `mobile/app/(auth)/registo.tsx` (onboarding 15s).
        - Tab Bar: `mobile/app/(tabs)/index.tsx`, `premios.tsx`, `extrato.tsx`, `perfil.tsx` (com exclusão Apple Guideline 5.1.1).
        - Modais: `mobile/app/modal/qrcode.tsx` (com anti-screenshot e brilho), `mobile/app/modal/voucher.tsx` (timer 24h) e `mobile/app/modal/lojas.tsx`.
     7. Sequência Cinematográfica de Onboarding & Splash (`mobile/app/index.tsx`):
        - Abertura com vídeo nativo em tela cheia (`expo-video`) com os 4 Atos oficiais em scroll vertical suave: 1º "AÇAÍ NÃO SE EXPLICA", 2º "EXPERIMENTA", 3º "APAIXONA", 4º "E REPETE".
        - Conclusão do scroll com botões de entrada: "Entrar na Minha Conta" (Login), "Criar Conta em 15 Segundos" (Registo) e "Explorar como Convidado".
        - Telas de Login e Registo com Logo oficial de alta resolução + selo elegante "CASHBACK".
        - Tela interna de Início (`mobile/app/(tabs)/index.tsx`) leve, limpa e ágil, com Hero sóbrio estático, O Teu Cartão com saldo real e vouchers ativos para o caixa.
        - Compilação mobile com `npx tsc --noEmit` validada com código 0 (zero erros).
     8. Ajustes de Refinamento de UI/UX Mobile (Design Limpo & Alta Densidade):
        - Logo Canônica `public/logo.png` adotada integralmente como ícone do app, splash, favicon e header com fundo em vidro fosco (*frosted glass* estilo iOS/Apple HIG com sombra suave).
        - Onboarding/Login: simplificado para "Criar Conta" (eliminado texto prolixo), prefixo fixo `@` incorporado nativamente, placeholders removidos e usuário canônico `@hljunqueira` / `123456` ativo no PostgreSQL.
        - Sessão restrita: remoção do modo visitante anônimo; redirecionamento obrigatório para login ao encerrar sessão ou acessar sem credenciais.
        - Tela de Início (`mobile/app/(tabs)/index.tsx`):
          - Removidas duplicatas: excluída a logo centralizada, avatar, saudação e sino de notificações do corpo da página (já presentes no `GlobalHeader` fixo do topo).
          - Início direto e monumental no Gold Cashback Card (`PointsCard`), seguido pelas Ações Rápidas, Últimos Movimentos e Vouchers Ativos.
          - Eliminados ícones decorativos de sparkles e o banner "Segunda Dobrada".
          - Menu inferior flutuante (*docked pill* com cantos arredondados, elevação e sombra); ampliado o `paddingBottom` de todas as abas (`index`, `premios`, `extrato`, `perfil`) para 120px para garantir folga e eliminar qualquer corte inferior.
        - Validação TypeScript rigorosa: `Set-Location mobile; npx tsc --noEmit` executado com código 0 (zero erros).
     9. Ajustes Dinâmicos de Dados e Topo (GPS + PointsCard + Extrato Real):
        - PointsCard (`PointsCard.tsx`): Removida a mini logo e o texto "Açaí da Rose Cashback", substituídos pelo cabeçalho direto "Seus pontos atuais". Eliminado o rótulo "SALDO ATUAL", o ícone decorativo e a frase de equivalência ("Equivale a 1 copo..."). O Identificador (`Telemóvel: +351 ...`) ocupa agora a largura inteira sem qualquer truncamento, com o botão de leitura de QR code ("Toque para Ler") posicionado ergonomicamente embaixo.
        - GlobalHeader (`GlobalHeader.tsx`): Integrada a 2ª linha no topo com detecção da loja mais próxima via GPS (`expo-location` e cálculo de distância Haversine) e seletor interativo em 1 toque ("Trocar"), abrindo o modal de lojas e sincronizando o catálogo daquela unidade.
        - Últimos Movimentos (`index.tsx`): Eliminados 100% dos dados estáticos mockados. Consome agora as transações reais do cliente do PostgreSQL via `useLoyalty().transactions`, com fallback elegante para estado vazio.
        - Ações Rápidas: Removido o badge/rótulo textual "ATALHOS".
        - Compilação validada com sucesso: `Set-Location mobile; npx tsc --noEmit` (código 0, zero erros).
     10. Tela de Cadastro Otimizada & Fecho Resiliente de Modais:
        - Tela de Registo (`mobile/app/(auth)/registo.tsx`):
          - Zero placeholders: cada campo com etiqueta e ícone contextual claro.
          - @username dinâmico com prefixo `@` nativo e badge de disponibilidade em tempo real.
          - Telemóvel PT com pill de indicativo `+351` e validação imediata de 9 dígitos.
          - Palavra-passe com alternância de visibilidade (Eye/EyeOff) e barra de força de 4 níveis.
          - Campos opcionais de Código de Amigo (+10 pts) e NIF para fatura com contribuinte.
          - Mini-card de benefício de boas-vindas e checkbox interativo de consentimento RGPD.
          - Rota de registo no backend atualizada para persistir o username personalizado.
        - Correção do Fecho de Modais (`lojas.tsx`, `qrcode.tsx`, `voucher.tsx`):
          - Migração de `<View>` para `<SafeAreaView edges={['top', 'bottom']}>`, impedindo sobreposição pela barra de status, notch ou área de arrasto.
          - Implementação de `handleClose` resiliente (`router.dismiss()` com fallback para `router.back()` e `router.replace('/(tabs)')`).
          - Adicionado `hitSlop` generoso (16px) em torno do botão (X) para resposta ao toque imediata.
        - Compilação TypeScript validada: `Set-Location mobile; npx tsc --noEmit` com código 0.
     11. DDI Global de Todos os Países, Seletor de Idioma & Modais Legais (Termos e RGPD):
        - Constante de Indicativos Internacionais (`CountryCodes.ts`): Base de dados offline e imediata com todos os países (Portugal, Brasil, Espanha, França, Reino Unido, EUA, Angola, Moçambique, etc.) com bandeira, código ISO e DDI.
        - Seletor de DDI na Tela de Cadastro: Modal interativo com pesquisa em tempo real por nome ou prefixo e fecho no botão (X).
        - Botões de Idioma & Bandeiras: Alinhamento consistente com bandeiras canónicas (`🇵🇹 PT`, `🇺🇸 EN`, `🇪🇸 ES`) no `GlobalHeader` e na tela de registo.
        - Modais Jurídicos Independentes com Botão (X) e Aceite:
          - Termos de Utilização (`modal/termos.tsx`): 6 secções detalhadas sobre adesão, validade de pontos, vouchers 24h e regras do cashback.
          - Política de Privacidade (`modal/privacidade.tsx`): Conformidade estrita com o RGPD (Regulamento UE 2016/679) e Apple Guidelines.
          - Links ativos e clicáveis no checkbox de registo e na aba Perfil.
        - Compilação TypeScript validada: `Set-Location mobile; npx tsc --noEmit` com código 0 (zero erros).
     12. Centralização de Pontos no Card & Alinhamento Uniforme das Ações Rápidas:
         - PointsCard (`mobile/components/PointsCard.tsx`):
           - Centralizado o cabeçalho superior "Seus pontos atuais".
           - Centralizada a contagem monumental de saldo ("1.053 PONTOS") no centro geométrico do cartão.
         - Ações Rápidas (`mobile/app/(tabs)/index.tsx`):
           - Padronizada a altura dos 4 cards de ações rápidas (`height: 100`, `alignItems: 'stretch'`), garantindo que "Trocar Pontos", "Convidar", "Extrato" e "Ementa" fiquem rigorosamente nivelados mesmo com quebra de linhas.
         - Compilação TypeScript validada: `Set-Location mobile; npx tsc --noEmit` com código 0 (zero erros).
     13. Resolução Definitiva do Fecho dos Botões (X) nos Modais:
         - Causa Raiz: No Expo Router / React Native Web / Android, `(router as any).canDismiss()` retornava `true`, mas `router.dismiss()` falhava silenciosamente sem fechar a rota e sem disparar o bloco `catch`. Além disso, títulos sem `flex: 1` sobrepunham a área de clique dos botões de fecho em ecrãs menores.
         - Correção Aplicada:
           - Em todos os modais (`modal/lojas.tsx`, `modal/qrcode.tsx`, `modal/voucher.tsx`, `modal/termos.tsx`, `modal/privacidade.tsx`): migrado para pilha dupla `navigation.goBack()` e `router.back()` com fallback inteligente, eliminando `canDismiss()/dismiss()`.
           - Adicionado `zIndex: 10`, `elevation: 10`, `flex: 1` nos títulos e atributos de acessibilidade nos botões (X).
           - No modal de DDI (`registo.tsx`): adicionado fecho ao tocar fora do modal no overlay escuro e botão (X) ampliado e protegido contra sobreposição de texto.
         - Validação TypeScript: `Set-Location mobile; npx tsc --noEmit` código 0.
     14. Seletor de Idiomas Global & Suporte Completo à Bandeira da Espanha (ES):
         - Causa Raiz:
           1. O estado `lang` era puramente local e isolado em cada componente, de modo que clicar em 🇪🇸 ES não refletia em nenhuma tradução nos textos das telas (Home e Criar Conta).
           2. A área de clique do 3º botão no `langPill` sofria risco de corte em telas de menor largura por falta de `hitSlop` e gap balanceado.
         - Correção Aplicada:
           - Criado o store global `useLanguage` (`mobile/hooks/useLanguage.ts`) com Zustand e persistência no SecureStore (`rose_app_language`), cobrindo dicionários completos em Português (PT), Inglês (EN) e Espanhol (ES).
           - Conectados os textos dinâmicos em `GlobalHeader.tsx`, `PointsCard.tsx`, `index.tsx`, `registo.tsx` e `login.tsx`.
           - Adicionado `hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}` e `minWidth: 32` em todos os botões do `langPill`, garantindo toque imediato nas 3 bandeiras (`🇵🇹 PT`, `🇺🇸 EN`, `🇪🇸 ES`).
         - Validação TypeScript: `Set-Location mobile; npx tsc --noEmit` código 0.
     12. Centralização de Pontos no Card & Alinhamento Uniforme das Ações Rápidas:
         - PointsCard (`mobile/components/PointsCard.tsx`):
           - Centralizado o cabeçalho superior "Seus pontos atuais".
           - Centralizada a contagem monumental de saldo ("1.053 PONTOS") no centro geométrico do cartão.
         - Ações Rápidas (`mobile/app/(tabs)/index.tsx`):
           - Padronizada a altura dos 4 cards de ações rápidas (`height: 100`, `alignItems: 'stretch'`), garantindo que "Trocar Pontos", "Convidar", "Extrato" e "Ementa" fiquem rigorosamente nivelados mesmo com quebra de linhas.
         - Compilação TypeScript validada: `Set-Location mobile; npx tsc --noEmit` com código 0 (zero erros).
     13. Resolução Definitiva do Fecho dos Botões (X) nos Modais:
         - Causa Raiz: No Expo Router / React Native Web / Android, `(router as any).canDismiss()` retornava `true`, mas `router.dismiss()` falhava silenciosamente sem fechar a rota e sem disparar o bloco `catch`. Além disso, títulos sem `flex: 1` sobrepunham a área de clique dos botões de fecho em ecrãs menores.
         - Correção Aplicada:
           - Em todos os modais (`modal/lojas.tsx`, `modal/qrcode.tsx`, `modal/voucher.tsx`, `modal/termos.tsx`, `modal/privacidade.tsx`): migrado para pilha dupla `navigation.goBack()` e `router.back()` com fallback inteligente, eliminando `canDismiss()/dismiss()`.
           - Adicionado `zIndex: 10`, `elevation: 10`, `flex: 1` nos títulos e atributos de acessibilidade nos botões (X).
           - No modal de DDI (`registo.tsx`): adicionado fecho ao tocar fora do modal no overlay escuro e botão (X) ampliado e protegido contra sobreposição de texto.
         - Validação TypeScript: `Set-Location mobile; npx tsc --noEmit` código 0.
     14. Seletor de Idiomas Global & Suporte Completo à Bandeira da Espanha (ES):
         - Causa Raiz:
           1. O estado `lang` era puramente local e isolado em cada componente, de modo que clicar em 🇪🇸 ES não refletia em nenhuma tradução nos textos das telas (Home e Criar Conta).
           2. A área de clique do 3º botão no `langPill` sofria risco de corte em telas de menor largura por falta de `hitSlop` e gap balanceado.
         - Correção Aplicada:
           - Criado o store global `useLanguage` (`mobile/hooks/useLanguage.ts`) com Zustand e persistência no SecureStore (`rose_app_language`), cobrindo dicionários completos em Português (PT), Inglês (EN) e Espanhol (ES).
           - Conectados os textos dinâmicos em `GlobalHeader.tsx`, `PointsCard.tsx`, `index.tsx`, `registo.tsx` e `login.tsx`.
           - Adicionado `hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}` e `minWidth: 32` em todos os botões do `langPill`, garantindo toque imediato nas 3 bandeiras (`🇵🇹 PT`, `🇺🇸 EN`, `🇪🇸 ES`).
         - Validação TypeScript: `Set-Location mobile; npx tsc --noEmit` código 0.

      15. Auditoria Completa Multi-Ângulo, Correções Críticas & Evolução UI/UX do App Mobile:
          - Backend Loyalty & Segurança (`lib/services/loyaltyAuth.ts`, `lib/repositories/loyaltyRepository.ts`, `app/api/loyalty/...`):
            - Criado `POST /api/loyalty/auth/refresh` com rotação de `refreshToken` (hash SHA-256 e verificação HMAC `timingSafeEqual`).
            - Criado `GET /api/loyalty/auth/check-username` para validação real de disponibilidade de `@username` no registo.
            - Criado `GET/PATCH/DELETE /api/loyalty/profile` para consulta, edição de perfil/NIF/palavra-passe e eliminação/anonimização real no PostgreSQL (conformidade RGPD e Apple 5.1.1).
            - Criado `POST /api/loyalty/push-token` para registo do token de notificações do dispositivo.
            - `listCustomerTransactions` enriquecido com `LEFT JOIN tenants` (`tenant_name`, `tenant_city`).
          - Arquitetura, Sessão & Multi-Tenant Mobile (`mobile/services/`, `mobile/hooks/`):
            - `api.ts` e `useAuth.ts`: rotação silenciosa de token em `401` com mutex e sincronização de sessão expirada; desbloqueio biométrico real via `refreshToken`; registo não-bloqueante de Expo push token; deep linking `/convite/:code` no `_layout.tsx`.
            - `useStores.ts`: remoção total de lojas hardcoded (`CANONICAL_STORES`); resolução 100% dinâmica via `GET /api/tenants` + cálculo opcional de distância por GPS.
            - `useLanguage.ts`: hidratação automática do idioma guardado no arranque e cobertura integral de traduções PT/EN/ES em todas as abas e modais.
            - `useMenu.ts`: consumo em tempo real de `/api/products?loja=...` para a ementa da loja ativa.
          - Design System & Polimento UI/UX (`mobile/constants/Colors.ts`, `mobile/components/`, `mobile/app/`):
            - Paleta unificada em `Colors.ts`; criados `LanguageSwitcher.tsx`, `ModalHeader.tsx` e `Skeleton.tsx`.
            - Corrigidos bugs de login por telemóvel (removido `@` forçado), opt-in explícito de termos RGPD no registo, força da palavra-passe e validação real de NIF PT.
            - `StatusBar` adaptativa (`dark` no app, `light` na Splash), `TabBar` com `useSafeAreaInsets()`, Splash com redirecionamento automático de autenticados, botão "Entrar" e indicadores de página.
            - Home com vouchers ativos no topo, progresso discreto até ao próximo prémio no `PointsCard`, `CampaignCard` apenas com campanha real do banco, e estados de skeleton/erro em todas as listas.
            - Novas telas modais `modal/ementa.tsx` (com vídeos/imagens e regras canónicas) e `modal/editar-perfil.tsx`, além de contagem regressiva real em `modal/voucher.tsx` e QR rotativo 60s + brilho/anti-print em `modal/qrcode.tsx` e `modal/voucher.tsx`.
      16. Correção Definitiva dos Botões (X) dos Modais, Foto de Perfil, Limpeza de Pontos & Redesign do Perfil:
          - Fecho de Modais (`mobile/app/_layout.tsx`, `components/ModalHeader.tsx`, `app/(auth)/registo.tsx`, `modal/lojas.tsx`, `termos.tsx`, `privacidade.tsx`):
            - Apresentação migrada de `pageSheet` para `modal` com `gestureEnabled: true`.
            - `ModalHeader` com `Pressable` (44x44 + `hitSlop={16}`), `<View pointerEvents="none">` no ícone `<X />`, `router.dismiss(1)` / `back()` e fallback automático via `setTimeout` de 180ms (`router.replace`).
            - Modal DDI em `registo.tsx` reestruturado com backdrop irmão (`StyleSheet.absoluteFill`) sem roubar toques dos filhos.
          - Foto de Perfil (`app/api/loyalty/avatar/route.ts`, `profile/route.ts`, `loyaltyRepository.ts`, `mobile/utils/avatarPicker.ts`, `GlobalHeader.tsx`, `perfil.tsx`, `editar-perfil.tsx`):
            - Instalado `expo-image-picker` (SDK 58); upload via galeria/câmara em `POST /api/loyalty/avatar` gravando em `public/uploads/avatars/` e atualizando `avatar_url`.
            - Avatar do cabeçalho exibe a foto do cliente e navega diretamente para `/(tabs)/perfil`.
          - Pontos apenas na Home e Redesign do Perfil:
            - Removidas exibições redundantes de saldo de pontos em `premios.tsx`, `extrato.tsx` e `modal/qrcode.tsx`.
            - `perfil.tsx` redesenhado com Hero Card centrado (avatar editável com badge de câmara, dados, botão de edição), cartões agrupados por secção, seletor de idioma em bloco dedicado e separação clara entre `Terminar Sessão` e `Eliminar Minha Conta`.
