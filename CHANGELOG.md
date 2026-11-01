# Changelog — Money_App

Todas as alterações relevantes do projeto são registradas aqui, em ordem cronológica (mais recente no topo).
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e [Versionamento Semântico](https://semver.org/lang/pt-BR/).

Categorias: **Adicionado** · **Modificado** · **Corrigido** · **Removido** · **Segurança** · **Refatorado** · **Documentação** · **Técnico**

---

## [1.12.2] - 01/11/2026 — Transição de página; reordenar categorias volta à alça

### Modificado
- **Transição suave ao trocar de aba**: `AppShell` (`src/components/layout/AppShell.tsx`) aplica um fade + leve deslocamento (`pageTransition`, `AppShell.module.css`) ao conteúdo da página a cada navegação, respeitando `prefers-reduced-motion`.

### Corrigido
- **Reordenar categorias**: a v1.12.1 tentou arrastar pelo cartão inteiro (sem alça separada), mas não funcionou bem na prática — revertido para a alça de arrastar dedicada (`drag_indicator`) como na v1.12.0.

## [1.12.0] - 01/11/2026 — Sininho de alertas por categoria e reordenar categorias arrastando

### Adicionado
- **Sininho de alertas por categoria** (DT-025): cada categoria ganha `alertsEnabled` (padrão `true`). No cartão da categoria (`CategoryCard`, `src/modules/categories/CategoryCard.tsx`) um ícone de sino liga/desliga os alertas de "limite próximo" e "limite ultrapassado" dessa categoria (`toggleCategoryAlerts`, `src/store/FinanceProvider.tsx`), com feedback visual (sino tocando vs. cortado). No formulário de categoria (`CategoryFormSheet`), um `switch` "Alertas de orçamento" faz o mesmo, visível só para despesas. `buildAlerts` (`src/domain/alerts.ts`) passa a ignorar os dois alertas de orçamento das categorias com `alertsEnabled: false`; os demais alertas (gastos em alta, metas, lembretes de assinatura) não são afetados.
- **Reordenar categorias arrastando** (DT-025): cada categoria ganha `order`, mantido sempre consistente com a posição no array `categories`. Em Categorias, cada cartão tem uma alça de arrastar (`drag_indicator`) que reordena a lista por **Pointer Events nativos** (`useDragReorder`, `src/components/common/useDragReorder.ts`), funcionando com mouse e toque, sem biblioteca nova. A nova ordem é persistida por `reorderCategories` (`FinanceProvider`), que mescla a fatia arrastada na ordem global (`src/domain/categories.ts`). A mesma ordem passa a ser usada em qualquer lugar que liste categorias: cartões de Categorias, Ajustes → Categorias (antes ordenava por nome) e o seletor de categoria do lançamento rápido (categorias nunca usadas, que antes ficavam na ordem de cadastro, agora seguem a ordem escolhida pelo usuário).

### Modificado
- `Category` (`src/models/index.ts`): novos campos `alertsEnabled: boolean` e `order: number`. Documentos salvos antes desta versão migram de forma aditiva em `FinanceDocument.parseFinanceData` (`src/services/storage/FinanceDocument.ts`): `alertsEnabled` ausente ou inválido vira `true`; `order` ausente ou inválido usa a posição em que a categoria já estava salva (ninguém perde a ordem que já tinha).
- `src/modules/settings/CategoriesSettings.tsx`: a lista de categorias de Ajustes deixa de ordenar por nome (`localeCompare`) e passa a seguir a ordem salva (`Category.order`), igual às demais telas.

### Técnico
- `CACHE_VERSION` do service worker: `v1.12.0`. Versão do pacote: 1.11.0 → 1.12.0 (MINOR).
- 238 testes automatizados (7 novos: `buildAlerts` ignorando categoria com `alertsEnabled: false`, `sortCategories`/`reorderCategories` em `tests/domain.test.ts`, migração de categorias legadas em `tests/persistence.test.ts`, sino e switch do formulário em `tests/categoryAlerts.test.tsx`); fixture `tests/helpers.ts` (`categories`) ganhou `alertsEnabled`/`order`; `tests/validations.test.ts` ajustado para o novo campo obrigatório de `CategoryFormValues`.

### Documentação
- `DECISOES_TECNICAS.md`: DT-025 (sininho de alertas por categoria e ordem persistida por arrastar e soltar, com Pointer Events nativos em vez de biblioteca nova). `ESCOPO_PROJETO.md`: acompanhamento v1.12.0.

---

## [1.11.0] - 31/10/2026 — Alertas no topo do Início e categoria "Assinaturas" protegida

### Modificado
- **Início** (`src/modules/dashboard/DashboardPage.tsx`): a seção de Alertas (`AlertsSummary`) passa a ser a primeira coisa exibida na tela, logo após o cabeçalho (saudação e seletor de mês) e antes do saldo, dos cards de resumo e das metas. Antes aparecia mais abaixo, na segunda coluna, depois de Metas.

### Corrigido
- **Categoria "Assinaturas" não pode mais ser excluída** mesmo quando nenhuma assinatura está vinculada no momento: `deleteCategory` (`src/store/FinanceProvider.tsx`) agora identifica essa categoria por nome (reaproveitando `findSubscriptionsCategory`, de `src/store/defaultCategories.ts`) e bloqueia a exclusão com uma mensagem explicando que ela agrega as assinaturas recorrentes vinculadas. A regra que já impedia excluir categorias com assinaturas ativas vinculadas continua valendo para qualquer outra categoria usada por assinaturas.

### Técnico
- `CACHE_VERSION` do service worker: `v1.11.0`. Versão do pacote: 1.10.0 → 1.11.0 (MINOR).

### Documentação
- `DECISOES_TECNICAS.md`: DT-024 (categoria "Assinaturas" é protegida contra exclusão por identidade, não só por uso). `ESCOPO_PROJETO.md`: acompanhamento v1.11.0.

---

## [1.10.0] - 31/10/2026 — Seletor de mês no Extrato

### Adicionado
- **Seletor de mês no Extrato** (`src/modules/transactions/TransactionsPage.tsx`): reaproveita o mesmo `MonthSwitcher` (`src/components/common/MonthSwitcher.tsx`) já usado na Visão Geral, Categorias e Relatórios, exibido como ação do cabeçalho da página. O filtro "Mês selecionado" (antes "Este mês") e "Mês anterior ao selecionado" (antes "Mês anterior") passam a usar o mês escolhido no seletor compartilhado (`useSelectedMonth`), em vez do mês do calendário real.

### Modificado
- `resolvePeriodFilter` e `filterTransactions` (`src/domain/transactions.ts`) recebem um `selectedMonth` opcional (padrão: mês de `today`, mantendo compatibilidade com os testes e usos existentes) para resolver os filtros `this-month`/`previous-month` a partir do mês navegável, e não mais do dia real do sistema.
- `tests/newTransactionDate.test.tsx`: ajustado para voltar ao mês de outubro antes de editar um lançamento lançado em outubro, já que o Extrato agora filtra pelo mês selecionado.

### Técnico
- `CACHE_VERSION` do service worker: `v1.10.0`. Versão do pacote: 1.9.0 → 1.10.0 (MINOR).

### Documentação
- `DECISOES_TECNICAS.md`: DT-023 (reaproveitar `MonthSwitcher` e o mês compartilhado em vez de um seletor de período próprio no Extrato). `ESCOPO_PROJETO.md`: seção de Extrato e acompanhamento v1.10.0.

---

## [1.9.0] - 31/10/2026 — Lembretes de assinatura, saldo projetado e sugestão de lançamento fixo

### Adicionado
- **Lembrete de assinatura no Início**: novo alerta ("Cobrança chegando") quando uma assinatura ativa vai descontar nos próximos 3 dias (ex.: "Netflix desconta em 2 dias (R$ 44,90)."), levando a "Assinaturas". `subscriptionsChargingSoon` em `src/domain/subscriptions.ts`; integrado em `buildAlerts` (`src/domain/alerts.ts`, parâmetro opcional `subscriptions`) e exibido tanto no Início (`AlertsSummary`) quanto nas Notificações do cabeçalho.
- **Saldo projetado até o fim do mês** (`src/modules/dashboard/ProjectedBalanceCard.tsx`): novo cartão no Início, visível apenas no mês atual, com `receitas do mês − despesas já lançadas − assinaturas que ainda vão descontar até o fim do mês` (`projectedMonthEndBalance` em `useDashboard`, reaproveitando `projectedSubscriptionExpenses`).
- **Sugestão de lançamento fixo/recorrente** no formulário de novo gasto (`TransactionForm`): quando valor e descrição são parecidos (±10%) com um gasto da mesma categoria no mês anterior, aparece "Marcar como fixo" — ao confirmar, cria uma assinatura (`saveSubscription`) com os dados do lançamento, para que os próximos meses sejam gerados automaticamente. Função pura `findRecurringCandidate` em `src/domain/quickEntry.ts`.
- Testes: `tests/subscriptions.test.ts` (lembretes), `tests/domain.test.ts` (alerta de cobrança chegando) e `tests/quickEntry.test.ts` (`findRecurringCandidate`). Total: 231 testes.

### Técnico
- `CACHE_VERSION` do service worker: `v1.9.0`. Versão do pacote: 1.8.0 → 1.9.0 (MINOR).

### Documentação
- `DECISOES_TECNICAS.md`: DT-022 (lembretes, projeção de saldo e sugestão de fixo reaproveitam o modelo de Assinaturas e os alertas existentes). `ESCOPO_PROJETO.md`: seções 10.1, 10.2, 11 (regras 57–59) e acompanhamento v1.9.0.

---

## [1.8.0] - 31/10/2026 — Navegação em 2 níveis: barra inferior simplificada e hub "Mais"

### Adicionado
- **Hub "Mais"** (`/mais`, `src/modules/more/MorePage.tsx`): tela que agrupa os destinos que saíram da barra inferior, com ícone, nome e descrição curta de cada um — **Dinheiro saindo** (Gastos, Assinaturas), **Acompanhar** (Gráficos) e **Conta** (Ajustes).
- `PRIMARY_NAV_ITEMS`, `MORE_ITEM` e `MORE_NAV_GROUPS` em `src/components/layout/navItems.ts`.
- Testes: `tests/navigation.test.tsx` (5 testes: barra inferior com 4 itens, chegar a cada destino inclusive pelo "Mais", hub "Mais" com os 4 destinos agrupados, navegação lateral com os 7 itens originais, barra inferior nunca com 6–7 itens). Total: 223 testes.

### Modificado
- **Barra inferior (mobile/tablet)**: passou de 6 itens (Início, Extrato, Gastos, Assinaturas, Metas, Gráficos) para **4** (Início, Extrato, Metas, Mais), eliminando a fonte reduzida e o risco de transbordo em 320 px das versões anteriores (DT-018).
- Navegação lateral (desktop, ≥ 1024 px) **sem alteração**: continua com todos os 6 destinos mais Ajustes no rodapé.
- Cabeçalho reconhece a rota `/mais` (título "Mais").

### Técnico
- Nenhuma rota mudou: `/lancamentos`, `/categorias`, `/assinaturas`, `/metas`, `/relatorios`, `/ajustes` continuam os mesmos caminhos.
- `CACHE_VERSION` do service worker: `v1.8.0`. Versão do pacote: 1.7.0 → 1.8.0 (MINOR).

### Documentação
- `DECISOES_TECNICAS.md`: DT-021 (navegação em 2 níveis, revisa parcialmente DT-007/DT-018). `ESCOPO_PROJETO.md`: seção de navegação/fluxos, módulo "Mais" e acompanhamento v1.8.0.

---

## [1.7.0] - 31/10/2026 — Temas escolhíveis e "substituir a planilha"

### Adicionado
- **Temas de cores** (DT-019): 5 paletas — **Esmeralda** (visual original), **Oceano**, **Ametista**, **Pôr do sol** e **Grafite** —, cada uma com variantes clara e escura (primária, cartão de saldo, gráficos, fundo e `theme-color`). Receitas continuam verdes e despesas vermelhas em todas.
- **Ajustes → Aparência**: cartões de prévia de cada tema (mini cartão de saldo + botão + barras), modo **Claro / Escuro / Automático** (segue o sistema) e tamanho do texto **Normal / Grande**. "Ocultar valores" foi para este cartão.
- **Lançamento rápido**: valor com foco automático (teclado numérico), **categorias em chips com ícone, mais usadas primeiro** (`CategoryPicker`, com "Mais N" quando há muitas), **sugestões de descrição** a partir do histórico que também aplicam a categoria usada da última vez (digitar uma descrição já usada também seleciona a categoria, sem sobrescrever uma escolha manual) e botão **"Salvar e adicionar outro"** (mantém tipo e data, limpa o resto e volta ao valor). Funções puras em `src/domain/quickEntry.ts`.
- **Início**: blocos **Próximas cobranças** (assinaturas previstas até o fim do mês, com total), **Últimos lançamentos** (5 do mês, tocar abre a edição, link "Ver extrato"), **Suas metas** (até 3, progresso compacto) e **Alertas do mês** compactos (2 visíveis, "Ver todos (+N)"). Estados vazios com convite e ação.
- **Importação de planilha (CSV) com prévia** (DT-020): Ajustes → "Importar de planilha" (colunas Data, Descrição, Valor, Categoria; Tipo/Observação opcionais), validação linha a linha com as regras do formulário, categorias desconhecidas em "Outros", lançamentos já existentes ignorados. Ação `importTransactions` no `FinanceProvider`.
- **Exportação CSV acessível**: Ajustes → "Seus dados" → **Planilha (CSV)** ("Leve seus dados para a planilha quando quiser") e botão "Exportar CSV" no Extrato (exporta o que está filtrado).
- Carregamento com **esqueleto** no formato do Início; classes globais `.enter` (entrada sutil) e `.skeleton`, ambas desligadas com `prefers-reduced-motion`.
- Escala tipográfica `--text-2xs … --text-2xl` e `--duration-enter` em `foundation.css`.
- Testes: `tests/theme.test.tsx` reescrito (13: modo automático, migração da chave antiga, campos inválidos, sincronia com o `index.html` e o CSS, provider, botão sol/lua, Aparência com paleta/modo/tamanho e `theme-color`, prévias), `tests/quickEntry.test.ts` (7), `tests/quickEntryFlow.test.tsx` (5), `tests/dashboardHome.test.tsx` (4), `tests/csvImport.test.ts` (6) e `tests/csvImportFlow.test.tsx` (2). Total: 218 testes.

### Modificado
- **Início reorganizado** por importância: saudação e mês → saldo → resumo do mês → "Novo Lançamento" → próximas cobranças → últimos lançamentos; na segunda coluna (ou abaixo, no celular) metas, alertas, gráfico semanal, gastos por categoria e consistência.
- **KPIs mais limpos**: um único cartão com Receitas, Despesas e Poupança; variação discreta (seta colorida pelo significado — subir despesa é vermelho — e percentual neutro) e a legenda "Variação vs mês anterior". Despesas passou a mostrar a variação vs mês anterior (antes: % das receitas).
- **Aviso de demonstração** compacto (uma linha) com o botão **"Sair da demonstração"**, que pede confirmação e apaga os dados de demonstração ali mesmo (antes: link "Começar do zero" para Ajustes).
- **Extrato**: resumo do filtro com **Entradas, Saídas e Saldo** do que está filtrado (antes ignorava tipo e busca), filtros de tipo e categoria em **chips** (antes: select), "Limpar filtros", contagem de itens e total por dia, colunas Descrição | Categoria | Valor no desktop (≥ 1024 px), estado vazio convidativo ("Seu extrato começa aqui").
- **Metas**: a lista vem antes do **Simulador de Aportes** (simulador na segunda coluna/no fim).
- **Barra inferior** (revisão da DT-018): item ativo sem negrito (cor, ícone preenchido e ponto) e rótulo com fonte `min(11px, 3vw)` e reticências de último recurso — "Assinaturas" não transborda mais em 320 px.
- Acabamento: alvos de toque maiores (chips de filtro 44 px, segmentos 40 px, botões pequenos 40 px, menu de ações do lançamento 44 px), foco visível nos botões, links de cartão na cor primária do tema, botão "Ocultar valores" e item ativo da lateral seguindo a paleta.

### Corrigido
- Rótulo "Assinaturas" ativo transbordava ≈ 2 px na barra inferior em 320 px.
- Cores fixas (`#4edea3`, `#1a2130`) no cartão de saldo, logo, sheet e relatórios substituídas por tokens.

### Técnico
- Tema: `ThemeName` agora é o modo efetivo; novos `ThemeMode`, `TextSize`, `ThemePreferences`, `parseThemePreferences`, `loadThemePreferences`, `saveThemePreferences`, `resolveMode`, `themeColorFor`; `applyTheme` recebe `{ theme, palette, textSize }`. Removidos `resolveInitialTheme`, `loadThemePreference`, `saveThemePreference`, `THEME_LABELS` e `THEME_COLORS`.
- Preferência de tema em `money-app:theme:v2` (JSON); migração automática de `money-app:theme` (`'light'`/`'dark'`).
- `Blob.text()` com alternativa via `FileReader` (`services/import/readTextFile.ts`), usada também na importação de backup.
- `CACHE_VERSION` do service worker: `v1.7.0`. Versão do pacote: 1.6.0 → 1.7.0 (MINOR). Nenhuma dependência nova.
- Testes ajustados ao novo formulário (categoria por chips em vez de select), ao aviso de demonstração e ao estado vazio do Extrato.

### Documentação
- `DECISOES_TECNICAS.md`: DT-019 (sistema de temas), DT-020 (importação CSV) e revisão da DT-018. `ESCOPO_PROJETO.md`: módulos, funcionalidades 10.1/10.2/10.4/10.7, regras 48–56, seção 14 (temas), fluxos, RF-19 a RF-22, acompanhamento v1.7.0 e limitações. `README.md`: descrição, módulos, estrutura e notas sobre temas e planilha.

---

## [1.6.0] - 31/10/2026 — Assinaturas mensais

### Adicionado
- **Aba Assinaturas** (`src/modules/subscriptions`, rota `/assinaturas`): lista com ícone, nome, valor mensal, dia de cobrança, próxima cobrança e status (Ativa / Pausada / Encerrada); resumo com **total mensal** das ativas, quantidade e **estimativa anual**; botões Pausar/Retomar e Editar; estado vazio com "Adicionar assinatura".
- Formulário (sheet) de criar/editar assinatura: nome, valor mensal (`MoneyField` com máscara), dia de cobrança (1–31), categoria, primeira cobrança e última cobrança opcional (mês), "Assinatura ativa", observação e ícone (`IconPicker` com busca). **Sugestões rápidas** (Netflix, Spotify, Amazon Prime, Claude, ChatGPT, YouTube Premium, Disney+, iCloud+, Google One, Xbox Game Pass) que preenchem só nome e ícone, sem preços.
- Excluir assinatura com confirmação, perguntando se os lançamentos já gerados devem ser excluídos também (padrão: manter). `ConfirmDialog` aceita conteúdo extra (`children`).
- **Geração automática dos lançamentos** (DT-017): cada assinatura ativa gera uma despesa real no dia de cobrança quando a data chega — ao abrir o app, ao voltar para ele (`visibilitychange`), ao salvar/pausar/retomar uma assinatura e ao importar um backup. Idempotente (`subscriptionId` + `subscriptionMonth` e id determinístico `sub-<id>-<mês>`); dia 31 vira o último dia em meses curtos.
- Gastos (Categorias): bloco **"Assinaturas do mês"** com as cobranças do mês selecionado (lançadas e previstas), data, selo "Lançada"/"Prevista", total do mês e link **"Gerenciar"** para a aba Assinaturas.
- Extrato: lançamentos gerados por assinatura exibem o selo discreto **"Assinatura"**.
- Início: em meses futuros, o saldo previsto ao fim do mês desconta as cobranças de assinaturas previstas e o cartão informa "Inclui R$ X em assinaturas previstas".
- Categoria padrão **"Assinaturas"** (`cat-subscriptions`, despesa, Estilo de Vida, teto R$ 250,00). Quem já usa o app recebe a categoria ao salvar a primeira assinatura com a opção "Assinaturas (nova categoria)" ou por "Restaurar categorias padrão".
- Modelo `Subscription` e campos opcionais `Transaction.subscriptionId`/`subscriptionMonth`; repositório `subscriptions`; ações `saveSubscription`, `setSubscriptionActive`, `deleteSubscription` e `syncSubscriptions` no `FinanceProvider`; funções puras em `src/domain/subscriptions.ts`; `validateSubscription`.
- Ícones no catálogo: `live_tv`, `play_circle`, `library_music`, `podcasts`, `cloud`, `smart_toy`, `auto_awesome`, `local_shipping`, `newspaper`, `apps`, `vpn_key` (150 ícones).
- Dados de demonstração: Netflix, Spotify, Amazon Prime, Claude Pro, iCloud+ e YouTube Premium (pausado há 2 meses), com as cobranças dos últimos 6 meses geradas pela mesma regra.
- Testes: `tests/subscriptions.test.ts` (28 unitários: data de cobrança, geração idempotente, dia 31 em fevereiro, pausa, edição de valor, exclusão não regenera, último mês, previsões, saldo previsto, status/próxima cobrança/totais, migração e validação estrutural, categoria padrão, `validateSubscription`, demonstração) e `tests/subscriptionsFlow.test.tsx` (6 de integração: criar → Assinaturas, Gastos e Extrato com totais; geração ao abrir sem duplicar e exclusão sem regenerar; pausar/retomar; saldo previsto de mês futuro; excluir mantendo/removendo lançamentos; navegação e bloqueio de exclusão de categoria usada). Total: 185 testes.

### Modificado
- **Navegação com 6 itens** (DT-018): Início, Extrato, Gastos, **Assinaturas**, Metas, Gráficos na barra inferior e na lateral. Na barra inferior os itens não têm mais largura mínima fixa, os rótulos não quebram linha e, abaixo de 360 px, usam fonte de 10 px.
- Editar um lançamento gerado mantém o vínculo com a assinatura; duplicar cria um lançamento manual (sem vínculo); excluir registra o mês em `skippedMonths` para que não seja gerado de novo (o diálogo avisa).
- Categorias usadas por assinaturas não podem ser excluídas nem mudar de tipo.
- Ajustes: textos de "Apagar todos os dados" e "Carregar dados de demonstração" mencionam as assinaturas.
- Demonstração: o lançamento manual "Assinatura Streaming" (Lazer) foi substituído pelas assinaturas.

### Técnico
- Migração sem mudar `schemaVersion`: documentos e backups sem `subscriptions` carregam com lista vazia; assinaturas são validadas (valor em centavos, dia 1–31, mês `AAAA-MM`) e saneadas (`active`, `endMonth`, `skippedMonths`, `notes`); vínculos de lançamentos inválidos tornam o documento inválido. Backup JSON inclui as assinaturas.
- `CACHE_VERSION` do service worker: `v1.6.0`. Versão do pacote: 1.5.0 → 1.6.0 (MINOR).

### Documentação
- `DECISOES_TECNICAS.md`: DT-017 (geração materializada dos lançamentos) e DT-018 (navegação com 6 itens; DT-007 parcialmente substituída). `ESCOPO_PROJETO.md`: módulo Assinaturas, funcionalidades 10.3/10.6, regras 21, 39–47, fluxos, persistência, RF-17/RF-18, acompanhamento v1.6.0 e limitações. `README.md`: módulos, estrutura e notas.

---

## [1.5.0] - 30/10/2026 — Gráficos centrados nas metas; poupança = aportes em metas

### Adicionado
- **Gráficos (Relatórios) centrados nas metas** (`src/modules/reports/GoalReportCards.tsx`): resumo "Metas" (total guardado em todas as metas, aportado no período com variação vs período anterior, falta para concluir, metas concluídas e barra de progresso geral); **Aportes por mês** (barras empilhadas por meta, até 5 metas + "Outras metas", com legenda e média mensal); **Evolução do total guardado** (linha acumulada, com o crescimento no intervalo); **Onde está o dinheiro guardado** (rosca por meta + detalhamento); **Progresso das metas** (barra, %, guardado/alvo e previsão de conclusão via `goalForecast`, com aviso "após o prazo"). Estado vazio "Você ainda não tem metas" com botão **"Ir para Metas"**.
- Seção secundária **"Receitas × despesas"**: barras mensais de receitas e despesas (com o saldo do mês no detalhe), comparação entre períodos (nova linha **"Aportes em metas"**), distribuição de despesas, hábitos de gastos e exportação.
- Funções puras em `src/domain/goals.ts`: `contributionsInPeriod`, `contributionsUntil`, `monthlyContributions`, `goalSavedAt`, `savedEvolution`, `totalSaved`, `savedDistribution`.
- Componente `ShareBreakdown` (rosca + legenda + barras) reutilizado pelas distribuições de despesas e de metas; `chartSlices.ts` (paleta e agrupamento "Outras").
- Testes: `tests/goalSavings.test.ts` (9 unitários: aportes por período/até a data/por mês, valor guardado na data, evolução, total e distribuição, alerta de aportes, demonstração) e `tests/goalReports.test.tsx` (3 de integração: tela de Gráficos com metas, estado vazio levando a Metas, KPI "Poupança" e saldo disponível no Início antes/depois de um aporte). Total: 151 testes.

### Modificado
- **"Poupança" do mês = total aportado em metas no mês** (soma dos aportes com data no mês). No Início, o KPI "Poupança" mostra esse valor com a variação em relação ao mês anterior.
- **Saldo disponível desconta os aportes em metas** (até a mesma data de referência do saldo: hoje, fim do mês passado ou fim do mês futuro). Aportes continuam sem gerar lançamento e sem contar como despesa (DT-016).
- Cartão de saldo: "Planejamento equilibrado com X% guardado" passou a "R$ X guardado em metas neste mês" (ou "Nenhum aporte em metas neste mês").
- Alerta "Ótima Notícia": compara os aportes em metas com o mesmo intervalo de dias do mês anterior (antes: sobra de receitas − despesas).
- Ajustes: card "Perfil e meta de poupança" passou a **"Perfil"** (nome e renda mensal). Texto de ajuda da renda na tela de boas-vindas atualizado.
- Título da tela de Relatórios: "Tendências & Relatórios" → **"Relatórios das Metas"**.
- `monthlySeries` passou a retornar `{ month, income, expense, balance }`.
- Dados de demonstração: aportes distribuídos pelos últimos 6 meses (ids únicos por meta; o aporte do mês atual só entra após o dia 6), para os gráficos de metas terem conteúdo.

### Removido
- Conceito de **taxa e meta de poupança (%)**: `Settings.savingsTarget`, `PeriodSummary.savings` e `savingsRate`, `savingsTargetAmount`, `SavingsTargetSummary`, campo "Meta de poupança (%)" e sua validação, diagnóstico de taxa de poupança, "Média de poupança no intervalo", insight "Ritmo de poupança".
- Gráficos "Evolução líquida" (guardado × gastos) e "Evolução do saldo" dos Relatórios (dependiam da poupança antiga).

### Técnico
- Migração sem mudar `schemaVersion`: `savingsTarget` de documentos e backups antigos é descartado na leitura (`sanitizeSettings`) e some do storage no próximo salvamento.
- `CACHE_VERSION` do service worker: `v1.5.0`. Versão do pacote: 1.4.0 → 1.5.0 (MINOR).

### Documentação
- `DECISOES_TECNICAS.md`: DT-016 (com o racional do saldo disponível); DT-008 e DT-014 marcadas como parcialmente substituídas. `ESCOPO_PROJETO.md`: módulos, funcionalidades 10.1/10.5, regras 6, 13, 33 e novas 35–38, fluxos, RF-05/RF-09/RF-15, acompanhamento v1.5.0 e limitações. `README.md`: módulos e notas para desenvolvedores.

---

## [1.4.0] - 30/10/2026 — Primeiro acesso vazio, boas-vindas, renda mensal e app instalável (PWA)

### Adicionado
- **Tela de boas-vindas** (`src/modules/onboarding`): no primeiro acesso, "Como prefere ser chamado?" com nome obrigatório (até 40 caracteres, espaços extras removidos) e renda mensal opcional (`MoneyField` com máscara); botão "Começar" leva ao Início com "Olá, <nome>". Mobile-first, sem cabeçalho nem navegação, com alternância de tema, nos dois temas.
- `OnboardingGate` (rota de layout): exibe o carregamento e redireciona para `/boas-vindas` enquanto o onboarding estiver pendente (e de volta ao Início depois).
- `Settings.onboardingCompleted` e `Settings.monthlyIncome` (centavos; 0 = não informada); constante `USER_NAME_MAX` em `models`.
- `buildInitialData()` (`src/store/initialData.ts`): dados do primeiro acesso — vazios, com as categorias padrão.
- Ações `completeOnboarding(profile)` e `loadDemoData()` no `FinanceProvider`.
- Validações `validateOnboarding` e `validateProfileSettings`; função pura `savingsTargetAmount(renda, meta%)` em `domain/summary.ts`.
- Ajustes → card "Perfil e meta de poupança": campo **Renda mensal** e resumo "Meta de 20% de R$ 5.000,00 = R$ 1.000,00 por mês." que acompanha a digitação (`SavingsTargetSummary`).
- Ajustes → **"Carregar dados de demonstração"**, com confirmação de que substitui lançamentos, categorias e metas atuais.
- **PWA**: `public/manifest.webmanifest` (nome "Money App", `start_url`/`scope` `./`, `standalone`, `pt-BR`), ícones PNG `icon-192`, `icon-512`, `icon-maskable-192`, `icon-maskable-512`, `apple-touch-icon` (180) e `favicon-32` em `public/icons/`; `public/sw.js` (app shell network-first, `assets/` cache-first, caches versionados); registro em `src/services/pwa/serviceWorker.ts` apenas em produção.
- Ajustes → card **"Instalar app"**: botão nativo via `beforeinstallprompt` (`src/services/pwa/installPrompt.ts`), instruções para iPhone/iPad (Compartilhar → Adicionar à Tela de Início) e para outros navegadores, ou aviso de app já instalado.
- `index.html`: link do manifest, `apple-touch-icon`, favicon PNG, `theme-color` claro/escuro e metas `apple-mobile-web-app-*`.
- Testes: `tests/onboarding.test.tsx` (12 de integração: primeiro acesso vazio com categorias padrão, redirecionamento, validação do nome, conclusão com saudação e lançamento em seguida, renda opcional, documento antigo sem onboarding, redirecionamento após concluído, saudação sem nome, carregar/cancelar demonstração e sair dela, salvar renda com resumo da meta, validar meta) e `tests/profile.test.ts` (9 unitários: validações, `savingsTargetAmount`, dados iniciais, migração/saneamento de preferências, store de instalação). Total: 141 testes.

### Modificado
- **Primeiro acesso começa vazio** (com as categorias padrão) em vez de carregar dados de demonstração. Dados ilegíveis também reiniciam assim (aviso atualizado).
- "Restaurar demonstração" passou a "Carregar dados de demonstração" e **mantém o perfil e as preferências** do usuário.
- "Apagar todos os dados" mantém também a renda mensal (além do nome).
- Importar backup nunca reabre a tela de boas-vindas.
- Ajustes: card "Perfil e metas" renomeado para "Perfil e meta de poupança"; meta vazia agora é rejeitada ("Informe um percentual entre 0 e 100.").
- `applyTheme` atualiza todas as metas `theme-color` (cores centralizadas em `THEME_COLORS`).

### Removido
- Nome padrão fixo "Gabriel" dos dados de demonstração (a saudação sem nome é "Olá").
- Carregamento automático de dados de demonstração na primeira execução.

### Corrigido
- No celular não era possível instalar o app (faltavam manifest, ícones e service worker).

### Segurança
- Preferências lidas do storage ou de backups são saneadas campo a campo (tipos e faixas); valores inválidos voltam ao padrão.

### Refatorado
- `LoadingScreen` extraído do `AppShell` (o carregamento passou ao `OnboardingGate`).
- Validação do perfil movida da tela de Ajustes para `src/validations`.

### Técnico
- Migração aditiva sem mudar `schemaVersion` (continua 1): documentos sem `onboardingCompleted` são tratados como onboarding concluído; `monthlyIncome` ausente vale 0 (DT-014).
- PWA manual, sem plugin nem novas dependências (DT-015). `CACHE_VERSION` do service worker: `v1.4.0`.
- Versão do pacote: 1.3.1 → 1.4.0 (MINOR).

### Documentação
- `DECISOES_TECNICAS.md`: DT-014 e DT-015. `ESCOPO_PROJETO.md`: módulos, regras 17, 22 e 29–34, fluxos, persistência, RF-13 a RF-16, acompanhamento v1.4.0 e limitações. `README.md`: instalação no celular, primeiro acesso e estrutura.

---

## [1.3.1] - 30/10/2026 — Data sugerida do novo lançamento no mês selecionado

### Adicionado
- Função pura `defaultDateForMonth(month, today)` em `src/domain/periods.ts`: hoje, se o mês selecionado for o atual; caso contrário, o mesmo dia de hoje limitado ao último dia do mês selecionado (ex.: 31/10 → 30/11; fevereiro respeita anos bissextos).
- `TransactionPreset.date` (opcional) no formulário de lançamento.
- Testes: 4 unitários de `defaultDateForMonth` (mês atual, meses passados/futuros, meses curtos, fevereiro comum e bissexto) e 4 de integração (`tests/newTransactionDate.test.tsx`, com relógio fixo em 30/10/2026 e 31/10/2026: mês atual, Dezembro de 2026 → 2026-12-30, mês passado pela navegação lateral e pela tela de Lançamentos, edição preservando a data, 31/10 → 2026-11-30). Total: 120 testes.

### Modificado
- Novo lançamento sugere uma data dentro do mês selecionado no seletor de mês, em todos os pontos de abertura (Visão Geral, Lançamentos, navegação lateral, botão flutuante), via `TransactionEditorProvider.openNew`. Edição mantém a data do lançamento. O aporte em metas continua sugerindo hoje (ver DT-013).

### Corrigido
- Limitação da v1.3.0: o formulário sugeria sempre a data de hoje mesmo com um mês futuro selecionado.

### Técnico
- Versão do pacote: 1.3.0 → 1.3.1 (PATCH: melhoria de comportamento sem mudança de modelo ou API pública).

### Documentação
- `DECISOES_TECNICAS.md`: DT-013. `ESCOPO_PROJETO.md`: regra 28, fluxo de navegação, acompanhamento v1.3.1 e limitação removida.

---

## [1.3.0] - 30/10/2026 — Navegação e planejamento em meses futuros

### Adicionado
- Seletor de mês (`MonthSwitcher`, compartilhado por Visão Geral, Categorias e Relatórios) avança para meses futuros (ex.: Dezembro de 2026) até **60 meses à frente** do mês atual; o botão "Próximo mês" só fica desabilitado no último mês permitido. A navegação para trás continua livre.
- Indicação discreta "Mês futuro" abaixo do nome do mês no seletor (token `--color-info`, funciona nos dois temas).
- Helpers puros em `src/domain/periods.ts`: `MAX_FUTURE_MONTHS` (60), `maxPlanningMonth(today)`, `maxPlanningDate(today)` e `isFutureMonth(month, today)`.
- `SelectedMonth` expõe `maxMonth` e `isFuture`; `next()` e `setMonth()` limitam ao mês máximo.
- Visão Geral num mês futuro: cartão de saldo passa a "Saldo previsto ao fim do mês" (saldo acumulado até o último dia do mês, incluindo lançamentos planejados) e o texto sem receitas vira "Nenhuma receita planejada para este mês".
- Testes: 2 de domínio (limite e mês futuro sem dados, sem divisão por zero/alertas incoerentes), 2 de validação (datas futuras até o limite, datas passadas) e 4 de integração (`tests/futureMonths.test.tsx`: navegar até +2 meses e até o limite, Categorias/Relatórios em mês futuro, criar lançamento com data futura refletindo no saldo previsto, rejeitar data além do limite). Total: 112 testes.

### Modificado
- `validateTransaction(values, categories, today)` recebe a data de hoje e rejeita datas após o fim do mês limite ("A data deve ser até DD/MM/AAAA."). Datas futuras dentro do limite já eram aceitas e continuam aceitas; antes não havia limite superior.
- Relatórios: o insight "Média diária de gastos" mostra "Período ainda não iniciado." quando o período ainda não começou (antes: "Considerando 0 dia(s)…").

### Removido
- Bloqueio de meses futuros no seletor de mês (regra de negócio 20 da v1.0.0, substituída — ver DT-012).

### Técnico
- Versão do pacote: 1.2.0 → 1.3.0 (MINOR).

### Documentação
- `DECISOES_TECNICAS.md`: DT-012. `ESCOPO_PROJETO.md`: regras 3, 20 (substituída) e 27, seção 10.1 e acompanhamento v1.3.0.

---

## [1.2.0] - 30/10/2026 — Categorias em Ajustes e catálogo de ícones com busca

### Adicionado
- **Ajustes → Categorias** (`src/modules/settings/CategoriesSettings.tsx`): lista compacta de todas as categorias, agrupadas em Despesas e Receitas (ícone, nome, grupo e teto das despesas); "Nova categoria" e toque na categoria para editar/excluir reutilizando o `CategoryFormSheet` (mesmas regras de validação, exclusão e mudança de tipo); "Restaurar categorias padrão" via `ensureDefaultCategories()` com toast de quantas foram restauradas ou de que nada faltava. As categorias existentes são mantidas.
- **Catálogo de ícones** (`src/design-system/icons.ts`): 139 ícones do Material Symbols Outlined com rótulo em português e palavras-chave (alimentação, casa e contas, transporte, viagens, saúde, esportes e beleza, lazer, educação e trabalho, tecnologia, compras e presentes, família/crianças/pets, dinheiro e investimentos, outros). Funções puras `searchIcons(query, catalog?)` e `iconLabel(name)`.
- **`IconPicker`** reescrito em componente próprio (`src/components/forms/IconPicker.tsx` + `IconPicker.module.css`): busca sem acento e sem diferenciar maiúsculas por rótulo, palavras-chave e nome; grade rolável com altura máxima (cabe no bottom sheet); indicação "Selecionado: <rótulo>" sempre visível, mesmo fora do resultado da busca; estado vazio; `aria-label` em português; Enter na busca não envia o formulário.
- Testes: 10 unitários (`tests/icons.test.ts`: tamanho e unicidade do catálogo, cobertura dos ícones em uso, busca com acentos, palavras-chave, múltiplos termos, vazio, subconjunto, rótulo) e 2 de integração (`tests/categoriesSettings.test.tsx`: criar categoria com ícone escolhido pela busca e usá-la no lançamento; restaurar categoria padrão excluída sem duplicar). Total: 104 testes.

### Modificado
- Categorias e metas passam a usar o mesmo catálogo de ícones (antes: listas fixas de 30 e 12 ícones nos formulários).

### Refatorado
- `IconPicker` saiu de `Fields.tsx`; listas `CATEGORY_ICONS` e `GOAL_ICONS` removidas.
- Estilo inline da mensagem de erro do formulário de categoria movido para `Categories.module.css` (`.formError`).

### Técnico
- Versão do pacote: 1.1.0 → 1.2.0 (MINOR).

### Documentação
- `ESCOPO_PROJETO.md`: módulo Ajustes, seção 10.3, regras de negócio 25–26 e acompanhamento v1.2.0. `README.md`: tabela de módulos.

---

## [1.1.0] - 30/10/2026 — Máscara automática nos campos de valor

### Adicionado
- Máscara monetária automática "pelos centavos" (estilo app de banco) em todos os campos de valor (`MoneyField`: lançamento, teto de categoria, metas e aporte). Digitar 1, 5, 0, 0, 0 mostra "0,01" → "0,15" → "1,50" → "15,00" → "150,00"; acima de mil aparecem os separadores de milhar ("1.500,00", "12.345,67").
- Função pura `formatMoneyInput(raw)` em `src/utils/money.ts`: considera só dígitos (letras, vírgulas e pontos são ignorados), remove zeros à esquerda, limita aos dígitos de `MAX_AMOUNT` (descarta os excedentes) e devolve vazio quando não há dígitos significativos.
- Testes: 19 unitários (sequência de digitação, backspace até vazio, colar "1.234,56"/"R$ 1234,56", ignorar letras, limite, vazio e round-trip `centsToInput` → `parseMoney`) e 1 de integração que digita no campo Valor e confere o texto exibido. Total: 92 testes.

### Modificado
- `centsToInput` passa a gerar o formato da máscara, com milhar ("1.234,56" em vez de "1234,56"); valores pré-preenchidos (edição de lançamento, teto, metas, aporte) já aparecem formatados. `parseMoney` continua convertendo de volta (coberto por teste).
- `MoneyField` usa `inputMode="numeric"` (teclado numérico no celular) e mantém o cursor no fim do campo após cada digitação.
- Testes de integração existentes passam a digitar na nova semântica (ex.: "150000" para R$ 1.500,00).

### Técnico
- Versão do pacote: 1.0.1 → 1.1.0 (MINOR: melhoria de usabilidade compatível).

### Documentação
- `ESCOPO_PROJETO.md`: regra de negócio 24 (formato de entrada de valores) e acompanhamento v1.1.0.

---

## [1.0.1] - 30/10/2026 — Lançamentos sem categoria após apagar os dados

### Corrigido
- Depois de "Apagar todos os dados" (ou "Começar do zero"), não era possível adicionar movimentações: as categorias também eram apagadas e o formulário falhava com "Selecione uma categoria." sem oferecer saída. Agora `clearAllData` apaga lançamentos e metas, mantém o nome do usuário e **recria as categorias padrão**.

### Adicionado
- Conjunto único de categorias padrão (`src/store/defaultCategories.ts`: 7 de despesa com limites + 3 de receita), reutilizado pela demonstração e pelo "começar do zero".
- Ação `ensureDefaultCategories()` no `FinanceProvider` (e ação `categories/added` no reducer): adiciona apenas as categorias padrão que faltam, sem duplicar nomes do mesmo tipo (comparação sem acento e sem diferenciar maiúsculas) e sem reutilizar ids já ocupados; persiste via repositório.
- Formulário de lançamento: quando não há categoria do tipo selecionado, mostra aviso com o botão **"Criar categorias padrão"** e o link **"Criar categoria personalizada"** (fecha o formulário e abre Categorias) — recupera quem já tinha dados salvos com `categories: []`.
- 5 testes (`tests/defaultCategories.test.tsx`): regra de categorias faltantes, não duplicação em `ensureDefaultCategories`, apagar dados mantendo categorias padrão, fluxo de recuperação no formulário e link para Categorias. Total: 72 testes.

### Modificado
- Texto da confirmação de "Apagar todos os dados" e do aviso de conclusão informam que as categorias padrão serão recriadas.

### Refatorado
- `demoData.ts` deixa de definir as categorias próprias e passa a usar `buildDefaultCategories` (mesmos ids, nomes e limites de antes).

### Técnico
- Versão do pacote: 1.0.0 → 1.0.1 (`package.json` e `package-lock.json`).
- `tsc --noEmit`, `eslint .`, `vitest run` (72 testes) e `npm run build` sem erros.

### Documentação
- `ESCOPO_PROJETO.md`: regras de negócio 21–23 (categorias padrão, apagar dados, recuperação), fluxo do formulário sem categorias e acompanhamento v1.0.1.
- `README.md`: nota sobre categorias padrão mantidas ao apagar os dados.

---

## [1.0.0] - 30/10/2026 — Primeira versão funcional

### Adicionado
- Projeto React 18 + TypeScript (strict) + Vite, com arquitetura modular (`app`, `components`, `modules`, `domain`, `services`, `store`, `theme`, `design-system`, `models`, `utils`, `validations`).
- Design Systems **Slate & Flow** (claro) e **Obsidian Capital** (escuro) como tokens CSS semânticos.
- Alternância global de tema no cabeçalho (sol/lua), com transição suave, persistência em `localStorage`, respeito ao tema do sistema e aplicação antes da renderização.
- **Visão Geral**: saldo com ocultação de valores, receitas/despesas/poupança com variações, alertas automáticos, gráfico semanal interativo, gastos por categoria, seletor de mês, indicador de consistência.
- **Lançamentos**: criar, editar, duplicar e excluir; busca sem acentos; filtros por período, tipo e categoria; agrupamento por dia; botão flutuante.
- **Categorias**: CRUD com ícones e grupos, limite mensal, consumo, status, teto global, alerta de compensação, histórico filtrado.
- **Metas**: CRUD, aportes, previsão de conclusão, simulador com slider, atalhos e cenários, cálculo do aporte necessário para o prazo.
- **Relatórios**: intervalos mês/6 meses/ano, diagnóstico de poupança, barras empilhadas, linha do saldo acumulado, rosca de distribuição, comparação entre períodos, insights, exportação CSV e PDF.
- **Ajustes**: nome, meta de poupança, tema, ocultar valores, backup JSON, restaurar demonstração, apagar dados.
- Notificações no cabeçalho com os alertas do mês.
- Navegação inferior no mobile e lateral a partir de 1024 px.
- Dados de demonstração determinísticos (últimos 6 meses), sinalizados na interface.

### Segurança
- Validação de todos os formulários e validação estrutural de dados lidos do storage ou importados.
- Proteção contra injeção de fórmulas no CSV exportado.
- Dados corrompidos são preservados em chave de backup em vez de descartados.

### Técnico
- Dependências: `react`, `react-dom`, `react-router-dom`; desenvolvimento: `vite`, `typescript`, `vitest`, `jsdom`, Testing Library, ESLint 9 + `typescript-eslint`, `@types/node`.
- Valores monetários em centavos inteiros (DT-006); repositórios assíncronos sobre `StorageAdapter` (DT-005).
- 67 testes automatizados; `typecheck`, `lint` e `build` sem erros.

### Corrigido
- Cartões de Categorias causavam rolagem horizontal no mobile (grid sem `minmax(0, 1fr)`), encontrado na verificação no navegador.
- Selo de variação do diagnóstico ficava verde mesmo com queda na taxa de poupança.

### Documentação
- `ESCOPO_PROJETO.md` atualizado com o estado real (v1.0.0), regras de negócio 18–20 e limitações conhecidas.
- `DECISOES_TECNICAS.md`: adicionada DT-011.
- `README.md` revisado.

---

## [0.1.0] - 30/10/2026 — Auditoria e documentação inicial

### Documentação
- Auditoria completa da pasta `App_Financas_Layout` (2 Design Systems, 10 telas `code.html` + `screen.png`).
- Criado `ESCOPO_PROJETO.md` com objetivo, arquitetura, módulos, regras de negócio, fluxos, requisitos e acompanhamento.
- Criado `DECISOES_TECNICAS.md` com as decisões DT-001 a DT-010.
- Criado `README.md` com instruções de instalação e execução.
- Criado este `CHANGELOG.md`.

### Técnico
- Node.js LTS (v26.13.0) e npm (11.20.0) instalados no ambiente de desenvolvimento via `winget`.
