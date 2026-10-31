# Decisões Técnicas — Money_App

Registro no estilo ADR (Architecture Decision Records). Decisões substituídas não são apagadas: uma nova decisão indica qual substitui.

Status possíveis: **Aceita** · **Substituída por DT-XXX** · **Obsoleta**

---

## DT-001 — Stack: React + TypeScript + Vite

- **Data:** 30/10/2026 · **Status:** Aceita
- **Contexto:** Os layouts são HTML estático com Tailwind via CDN. O app precisa de estado compartilhado entre cinco telas, tipagem forte, testes e build.
- **Decisão:** SPA com React 18, TypeScript em modo `strict` e Vite.
- **Alternativas:** HTML + JS puro com módulos ES (sem tipagem e testes fracos); Next.js (SSR desnecessário sem backend); Vue/Svelte (válidos, mas o prompt sugere estrutura React/TSX).
- **Vantagens:** componentização, ecossistema de testes (Vitest/Testing Library), build rápido, CSS Modules nativo.
- **Desvantagens:** exige Node.js no ambiente (instalado em 30/10/2026).
- **Módulos afetados:** todos.

## DT-002 — Estilos: tokens CSS + CSS Modules (sem Tailwind)

- **Data:** 30/10/2026 · **Status:** Aceita
- **Contexto:** Os protótipos usam Tailwind CDN com configuração de cores diferente por arquivo, o que impede troca de tema em tempo real sem duplicar classes.
- **Decisão:** Cada Design System vira um conjunto de variáveis CSS com **nomes semânticos idênticos** (`--color-surface`, `--color-income`, `--font-money`…), aplicado por `[data-theme="light"|"dark"]` no `<html>`. Componentes usam CSS Modules que só referenciam tokens.
- **Alternativas:** Tailwind compilado com `dark:` (duplicaria cada cor em cada classe e espalharia regras de tema pelos componentes); CSS-in-JS (dependência e custo em runtime).
- **Vantagens:** troca de tema instantânea e global, zero dependência extra, tema isolado das regras financeiras.
- **Desvantagens:** os tokens precisam ser mantidos manualmente a partir dos `DESIGN.md`.
- **Módulos afetados:** `design-system/`, `theme/`, `components/`, `modules/`.

## DT-003 — Gráficos em SVG próprio

- **Data:** 30/10/2026 · **Status:** Aceita
- **Contexto:** Os layouts usam gráficos SVG simples (colunas, barras empilhadas, rosca).
- **Decisão:** Componentes React próprios (`BarChart`, `StackedBarChart`, `DonutChart`, `LineChart`) com tooltip/seleção por toque e teclado, cores vindas dos tokens.
- **Alternativas:** Recharts/Chart.js (≈100 KB+, estilo diferente do layout, theming mais trabalhoso).
- **Vantagens:** fidelidade visual, bundle pequeno, tema automático.
- **Desvantagens:** recursos avançados (zoom, animações complexas) exigiriam implementação própria.
- **Módulos afetados:** `components/charts`, Visão Geral, Relatórios.

## DT-004 — Estado global com Context + useReducer

- **Data:** 30/10/2026 · **Status:** Aceita
- **Contexto:** Uma alteração (ex.: nova despesa) precisa refletir em todos os módulos, sem duplicar dados.
- **Decisão:** `FinanceProvider` com `useReducer` como fonte única de verdade; dados derivados calculados por funções puras de `domain/` (memoizados nos hooks).
- **Alternativas:** Redux Toolkit / Zustand (dependência extra para um volume de estado pequeno).
- **Vantagens:** sem dependências, previsível, fácil de testar o reducer isoladamente.
- **Desvantagens:** re-renderizações do provider inteiro; aceitável no volume de dados de uso pessoal. Revisar se ultrapassar ~10 mil lançamentos.
- **Módulos afetados:** `store/`, `hooks/`, todos os módulos de tela.

## DT-005 — Persistência via repositórios assíncronos sobre StorageAdapter

- **Data:** 30/10/2026 · **Status:** Aceita
- **Contexto:** Não há backend; o prompt exige preparar a arquitetura para um backend futuro e não acessar `localStorage` na UI.
- **Decisão:** Interface `StorageAdapter` (implementações `LocalStorageAdapter` e `MemoryStorageAdapter`) e repositórios por entidade com métodos `async`. Documento único versionado (`money-app:data:v1`, `schemaVersion`) para permitir migrações.
- **Alternativas:** IndexedDB (mais capacidade, mais complexidade; desnecessário agora); chamadas diretas ao `localStorage` (acoplamento).
- **Vantagens:** trocar para HTTP exige só novos repositórios; testes usam storage em memória.
- **Desvantagens:** limite de ~5 MB do `localStorage`.
- **Módulos afetados:** `services/`, `store/`.

## DT-006 — Dinheiro em centavos inteiros

- **Data:** 30/10/2026 · **Status:** Aceita
- **Contexto:** Somas em ponto flutuante geram erros (0,1 + 0,2).
- **Decisão:** Todos os valores são `number` inteiros em centavos (tipo `Cents`); conversão apenas na entrada (parse) e na exibição (formatação `pt-BR`/BRL).
- **Alternativas:** biblioteca decimal (dependência extra).
- **Vantagens:** cálculos exatos, sem dependência.
- **Desvantagens:** atenção obrigatória nas fronteiras de entrada/saída (centralizadas em `utils/money.ts`).
- **Módulos afetados:** `models/`, `domain/`, `utils/`, formulários.

## DT-007 — Navegação: 5 módulos + Ajustes no cabeçalho

- **Data:** 30/10/2026 · **Status:** Aceita, **parcialmente substituída por DT-018** (v1.6.0): a navegação passou a ter 6 módulos (inclui Assinaturas); Ajustes continua no cabeçalho e no rodapé da lateral.
- **Contexto:** Os layouts mostram 6 itens na barra inferior (incluindo "Ajustes"); o escopo pede 5 itens.
- **Decisão:** Barra inferior (mobile) e lateral (≥ 1024 px) com os 5 módulos; Ajustes acessível pelo avatar no cabeçalho e no rodapé da navegação lateral. Rótulos seguem o escopo (Visão Geral, Lançamentos, Categorias, Metas, Relatórios).
- **Alternativas:** manter 6 itens (contraria o escopo).
- **Vantagens:** cumpre o escopo e preserva o visual da barra.
- **Desvantagens:** Ajustes fica um nível abaixo.
- **Módulos afetados:** `components/layout`, `app/routes`.

## DT-008 — Aportes em metas não geram lançamento

- **Data:** 30/10/2026 · **Status:** Aceita, **parcialmente substituída por DT-016** (v1.5.0): aportes continuam sem gerar lançamento e sem contar como despesa, mas passaram a ser a "poupança" do mês e a reduzir o saldo disponível.
- **Contexto:** No layout, "Poupança" do mês = receitas − despesas. Se cada aporte virasse uma despesa, a poupança seria contada como gasto.
- **Decisão:** Aportes ficam no histórico da meta e alimentam progresso/alertas; não alteram saldo nem despesas.
- **Alternativas:** criar transferência entre "contas" (exige modelo de contas — possível evolução futura).
- **Vantagens:** indicadores coerentes com os layouts.
- **Desvantagens:** o usuário não vê o aporte no extrato. Registrado como melhoria futura.
- **Módulos afetados:** `domain/goals`, Metas, Visão Geral.

## DT-009 — Testes com Vitest + Testing Library; lint com ESLint flat config

- **Data:** 30/10/2026 · **Status:** Aceita
- **Contexto:** Necessidade de testar regras financeiras, persistência, tema e fluxos.
- **Decisão:** Vitest (ambiente jsdom), `@testing-library/react` e `user-event`; ESLint 9 com `typescript-eslint` e `eslint-plugin-react-hooks`; `tsc --noEmit` para tipos.
- **Alternativas:** Jest (configuração extra com Vite); Playwright E2E (pode ser adicionado depois).
- **Vantagens:** mesma configuração do Vite, rápido.
- **Desvantagens:** sem testes E2E em navegador real nesta versão (verificação manual).
- **Módulos afetados:** `tests/`.

## DT-011 — Modelo de metas: valor inicial + aportes + aporte planejado

- **Data:** 30/10/2026 · **Status:** Aceita
- **Contexto:** Usuários começam metas com dinheiro já guardado, e o simulador precisa de um aporte mensal de referência para previsões.
- **Decisão:** `Goal` tem `initialAmount` (já guardado antes do app), `contributions[]` (aportes registrados) e `monthlyContribution` (plano). O acumulado é sempre derivado (`initialAmount + Σ aportes`), nunca armazenado.
- **Alternativas:** campo único "valor acumulado" editável (perde o histórico de aportes).
- **Vantagens:** histórico preservado, previsões e simulador consistentes; o simulador pode adotar o valor simulado como plano.
- **Desvantagens:** editar o "já guardado" não altera aportes registrados (comportamento explicado no formulário).
- **Módulos afetados:** `models`, `domain/goals`, Metas, Visão Geral (alertas).

## DT-012 — Meses futuros para planejamento, com limite de 60 meses

- **Data:** 30/10/2026 · **Status:** Aceita (substitui a regra de negócio 20 da v1.0.0, "o seletor de mês não avança para meses futuros")
- **Contexto:** O usuário quer navegar para meses à frente (ex.: Dezembro de 2026) e planejar lançamentos. Até a v1.2.0 o `SelectedMonthProvider` e o `MonthSwitcher` bloqueavam qualquer mês posterior ao atual. A validação de lançamentos já aceitava qualquer data futura, sem limite.
- **Decisão:** Permitir navegar e lançar até `MAX_FUTURE_MONTHS = 60` meses (5 anos) à frente do mês atual. Constante e helpers puros em `domain/periods.ts` (`maxPlanningMonth`, `maxPlanningDate`, `isFutureMonth`), usados pelo provider (clamp em `next`/`setMonth`), pelo seletor (botão "Próximo mês" desabilitado no limite) e por `validateTransaction`, que passa a receber `today` e rejeita datas após o fim do mês limite. Navegação para trás continua sem limite. Num mês futuro, a Visão Geral mostra o **saldo previsto ao fim do mês** (inclui lançamentos planejados até lá) e o seletor exibe a indicação "Mês futuro".
- **Alternativas:** sem limite (risco de datas digitadas por engano, como ano 20266, e navegação sem fim); limite curto até dezembro do ano seguinte (insuficiente para planejar metas e compras maiores); limite diferente para navegação e para datas (inconsistente: lançamentos ficariam em meses inalcançáveis pelo seletor).
- **Vantagens:** um único limite para navegação e validação; regras testáveis sem React; nenhuma alteração no modelo de dados.
- **Desvantagens:** `validateTransaction` ganhou o parâmetro obrigatório `today`. Lançamentos antigos (ex.: importados por backup) com data além do limite continuam salvos e visíveis, mas precisam ter a data ajustada para serem editados.
- **Módulos afetados:** `domain/periods`, `store/SelectedMonth`, `components/common/MonthSwitcher`, `validations`, `modules/transactions`, `modules/dashboard`, `modules/reports`.

## DT-013 — Data sugerida do novo lançamento segue o mês selecionado

- **Data:** 30/10/2026 · **Status:** Aceita (complementa DT-012)
- **Contexto:** Com meses futuros liberados (v1.3.0), o formulário de novo lançamento continuava sugerindo a data de hoje mesmo com outro mês selecionado, obrigando o usuário a trocar a data manualmente ao planejar.
- **Decisão:** Função pura `defaultDateForMonth(month, today)` em `domain/periods.ts`: no mês de hoje → hoje; em qualquer outro mês (passado ou futuro) → o **mesmo dia do mês de hoje, limitado ao último dia do mês selecionado** (31/10 → 30/11; 30/10 → 28/02/2027 ou 29/02/2028). O cálculo é feito num único ponto, `TransactionEditorProvider.openNew`, que lê o mês de `useSelectedMonth()` e passa a data em `TransactionPreset.date`; assim todos os pontos que abrem o formulário (Visão Geral, Lançamentos/Extrato, navegação lateral, botão flutuante) seguem a regra sem alterações. Um `preset.date` explícito tem prioridade. Edição mantém a data do lançamento.
- **Alternativas:** dia 1 do mês selecionado (mais simples, porém concentraria lançamentos planejados no dia 1 e se distanciaria do dia "natural" do usuário, ex.: salário no dia 5); calcular a data dentro de cada tela (duplicação e risco de divergência).
- **Aporte em metas:** mantém a data de hoje. A tela de Metas não tem seletor de mês e um aporte representa dinheiro efetivamente guardado; usar o mês selecionado, que não é visível ali, seria surpreendente.
- **Vantagens:** regra pura e testável; um só ponto de integração; nenhuma mudança no modelo de dados.
- **Desvantagens:** na tela de Lançamentos (que tem filtro de período próprio e não exibe o seletor de mês), a data sugerida segue o mês escolhido nas outras telas, o que pode não ser óbvio; a data continua editável.
- **Módulos afetados:** `domain/periods`, `modules/transactions` (`TransactionEditor`, `TransactionForm`).

## DT-010 — Roteamento com HashRouter

- **Data:** 30/10/2026 · **Status:** Aceita
- **Contexto:** O build deve funcionar em qualquer hospedagem estática (inclusive abrindo de uma pasta), sem configurar rewrites.
- **Decisão:** `HashRouter` do React Router (`/#/lancamentos`).
- **Alternativas:** `BrowserRouter` (URLs mais limpas, exige fallback no servidor).
- **Vantagens:** zero configuração de servidor.
- **Desvantagens:** URLs com `#`. Trocar para `BrowserRouter` quando houver hospedagem definida.
- **Módulos afetados:** `app/`.

## DT-014 — Primeiro acesso vazio, onboarding por flag em Settings e migração aditiva

- **Data:** 30/10/2026 · **Status:** Aceita (substitui o comportamento da v1.0.0 de carregar dados de demonstração na primeira execução). Os itens sobre a meta de poupança (`savingsTarget`, `savingsTargetAmount`, validação 0–100) foram **substituídos por DT-016** (v1.5.0).
- **Contexto:** O usuário quer começar com os dados zerados e ver a demonstração só se pedir; e quer que todo primeiro acesso passe por "Como prefere ser chamado?" antes do Início. Quem já usa o app (dados salvos sem os novos campos) não pode perder dados nem ser interrompido.
- **Decisão:**
  - Primeiro acesso (storage vazio ou corrompido) grava `buildInitialData()` (`store/initialData.ts`): sem lançamentos/metas, com as categorias padrão e `onboardingCompleted: false`. A demonstração vira a ação `loadDemoData()`, chamada só por Ajustes, que **mantém o perfil e as preferências** do usuário (os dados de demonstração não têm mais nome fixo).
  - Novos campos em `Settings`: `onboardingCompleted: boolean` e `monthlyIncome: Cents`. Em `DEFAULT_SETTINGS`, `onboardingCompleted` é **`true`**, porque esses padrões também completam documentos antigos: documento sem o campo = usuário existente = onboarding concluído. O único caminho que grava `false` é `buildInitialData`.
  - `parseFinanceData` passa a sanear `settings` campo a campo (`sanitizeSettings`): tipo errado ou fora da faixa → padrão. `schemaVersion` continua 1, pois a mudança é aditiva e compatível; backups da v1.4.0 importados numa versão antiga apenas ignoram os campos novos.
  - Roteamento: rota de layout `OnboardingGate` (`modules/onboarding`) envolve todas as rotas; mostra o carregamento (`LoadingScreen`, extraído do `AppShell`), redireciona para `/boas-vindas` enquanto o onboarding estiver pendente e de volta para `/` depois. A tela de boas-vindas fica **fora** do `AppShell` (sem cabeçalho/navegação).
  - Validação do perfil em `validations` (`validateOnboarding`: nome obrigatório; `validateProfileSettings`: nome opcional, renda opcional, meta 0–100), com o limite `USER_NAME_MAX = 40` compartilhado em `models`.
  - Renda mensal: só referência. Ajustes mostra `savingsTargetAmount(renda, meta%)` (função pura em `domain/summary.ts`); a Visão Geral continua calculando a taxa de poupança sobre as receitas lançadas, para não misturar valor informado com valor realizado.
- **Alternativas:** incrementar `schemaVersion` com uma função de migração dedicada (desnecessário para campos opcionais com padrão); flag de onboarding em chave separada do `localStorage` (dois pontos de verdade, perderia o vínculo com backup/“apagar dados”); `DEFAULT_SETTINGS.onboardingCompleted = false` com migração explícita (todos os documentos e testes existentes que usam os padrões passariam a cair no onboarding); exibir o onboarding como modal sobre o Início (mantém navegação acessível por trás e complica o foco).
- **Vantagens:** nenhum dado existente é alterado; o fluxo é testável com o `MemoryStorageAdapter`; preferências corrompidas não quebram o app.
- **Desvantagens:** o significado de `DEFAULT_SETTINGS.onboardingCompleted = true` não é óbvio (documentado no código). Dados ilegíveis também reiniciam o onboarding (o nome se perdeu junto).
- **Módulos afetados:** `models`, `services/storage`, `store` (`FinanceProvider`, `initialData`, `demoData`), `validations`, `domain/summary`, `app/routes`, `components/layout` (`AppShell`, `LoadingScreen`), `modules/onboarding`, `modules/settings`.

## DT-015 — PWA manual (manifest + service worker próprio), sem plugin

- **Data:** 30/10/2026 · **Status:** Aceita
- **Contexto:** No celular não era possível instalar o app. O build é publicado no GitHub Pages num subcaminho (`/Money_App/`, `base: './'`) e a política do projeto é não adicionar dependências sem necessidade.
- **Decisão:**
  - `public/manifest.webmanifest` com `start_url`/`scope`/`id` relativos (`./`), `display: standalone`, `lang: pt-BR`, cores `#f8f9ff` (fundo do Slate & Flow) e ícones PNG 192/512 em versões `any` (cantos arredondados) e `maskable` (fundo sangrado, símbolo na zona segura de 80%), mais `apple-touch-icon` 180 e `favicon-32`. Os PNGs foram gerados a partir do mesmo desenho do `favicon.svg` (script PowerShell/System.Drawing, fora do repositório).
  - `index.html`: link do manifest, ícones, metas `apple-mobile-web-app-*`/`mobile-web-app-capable` e duas metas `theme-color` (claro/escuro por `prefers-color-scheme`), sincronizadas com o tema escolhido no app pelo script inline e por `applyTheme` (`THEME_COLORS`).
  - `public/sw.js` escrito à mão: precache do app shell; navegação **network-first** (sempre a versão mais nova online; cópia do `index.html` para offline); `assets/` com hash **cache-first**; demais arquivos do site stale-while-revalidate; outras origens (Google Fonts) não são interceptadas. Cache nomeado por `CACHE_VERSION`; o `activate` apaga caches antigos com o prefixo `money-app-`; `skipWaiting` + `clients.claim` para a nova versão assumir sem passos extras. Todos os caminhos são relativos ao `registration.scope`.
  - Registro em `services/pwa/serviceWorker.ts`, chamado por `main.tsx` **apenas em produção** (`import.meta.env.PROD`), com `./sw.js` e escopo `./`.
  - Instalação: `services/pwa/installPrompt.ts` captura `beforeinstallprompt` desde a inicialização (store de módulo + `useSyncExternalStore`); `InstallAppCard` em Ajustes mostra o botão nativo, instruções para iPhone/iPad ou para o menu do navegador, ou "já instalado" em modo standalone.
- **Alternativas:** `vite-plugin-pwa`/Workbox (gera precache automático com hashes e aviso de atualização, mas adiciona dependências e configuração; proibido instalar pacotes neste momento); manifest sem service worker (o Chrome no Android exige service worker com `fetch` para oferecer a instalação completa).
- **Vantagens:** zero dependência; funciona no subcaminho do GitHub Pages e em qualquer hospedagem estática; comportamento simples de entender e testar.
- **Desvantagens:** `CACHE_VERSION` precisa ser atualizado manualmente a cada release; o precache não conhece os nomes com hash (são guardados na primeira visita); sem aviso de "nova versão" (a navegação network-first já entrega a versão nova quando online); fontes/ícones do Google Fonts não ficam garantidos offline; o service worker em si não tem testes automatizados (o store de instalação tem).
- **Módulos afetados:** `public/`, `index.html`, `main.tsx`, `services/pwa`, `theme/theme.ts`, `modules/settings`.

## DT-016 — Poupança = aportes em metas; saldo disponível desconta aportes; Gráficos centrados nas metas

- **Data:** 30/10/2026 · **Status:** Aceita (substitui parcialmente DT-008 e os itens de meta de poupança da DT-014)
- **Contexto:** Até a v1.4.0, "poupança" era a sobra do mês (`max(receitas − despesas, 0)`), com taxa de poupança (% das receitas) e uma meta de poupança em % configurável em Ajustes, usada no diagnóstico dos Relatórios e no texto "Planejamento equilibrado com X% guardado". O usuário informou que guarda dinheiro de fato nas **metas** e que a taxa de poupança não faz sentido para ele; quer que a tela de Gráficos mostre a relação com as metas. Pela DT-008, os aportes não afetavam nem o saldo nem os indicadores do mês.
- **Decisão:**
  - **Remover o conceito de taxa/meta de poupança (%)**: `Settings.savingsTarget`, `PeriodSummary.savings/savingsRate`, `savingsTargetAmount`, o card "Perfil e meta de poupança"/`SavingsTargetSummary`, o diagnóstico de taxa de poupança dos Relatórios e textos derivados. Ajustes fica com o card **"Perfil"** (nome e renda mensal; a renda segue apenas como referência no perfil).
  - **Poupança do período = Σ aportes de metas com data no período** (`contributionsInPeriod`). O valor inicial da meta não entra (foi guardado antes do app). No Início, o KPI "Poupança" mostra esse valor e a variação em relação ao mês anterior; o alerta "Ótima Notícia" compara os aportes com o mesmo intervalo de dias do mês anterior (só quando houve aportes no mês anterior).
  - **Saldo disponível desconta os aportes**: `saldo disponível = Σ receitas − Σ despesas − Σ aportes`, tudo até a mesma data de referência já usada (hoje no mês atual; fim do mês em meses passados e futuros) — `cumulativeBalance(...) − contributionsUntil(goals, data)`. Racional: o dinheiro movido para uma meta não está mais disponível para gastar; mostrar o mesmo saldo antes e depois de aportar daria a falsa impressão de que o dinheiro ainda está livre. Aportes **continuam sem gerar lançamento** e sem entrar em "Despesas", no gráfico semanal, nos limites de categoria e na exportação CSV (DT-008 mantida nesses pontos). O texto "Mês negativo" continua olhando apenas receitas − despesas do mês; quando o mês é positivo, o cartão informa "R$ X guardado em metas neste mês".
  - **Gráficos (Relatórios) centrados nas metas**: resumo (total guardado, aportado no período com variação, falta para concluir, metas concluídas), aportes por mês empilhados por meta (até 5 metas + "Outras metas"), evolução acumulada do total guardado (linha), distribuição do dinheiro guardado por meta (rosca) e progresso de cada meta com previsão (`goalForecast`). Estado vazio com "Ir para Metas". Receitas × despesas virou seção secundária (barras mensais, comparação com uma linha "Aportes em metas", distribuição de despesas, hábitos de gastos, exportação). O "Evolução do saldo" e o "Guardado × gastos" foram removidos (dependiam da poupança antiga).
  - **Estoque × fluxo**: total guardado, falta para concluir, concluídas, distribuição e progresso são a situação **atual** das metas; o período selecionado (mês/6 meses/ano e o seletor de mês) define os **fluxos**: aportado no período, comparação com o período anterior e a janela dos gráficos (6 meses até o mês selecionado, ou o ano). A evolução histórica fica na linha acumulada.
  - **Evolução acumulada** (`goalSavedAt`/`savedEvolution`): valor inicial conta a partir do mês de criação da meta (`createdAt`); sem `createdAt` reconhecível, conta sempre. Aportes contam pela data. Totais usam o valor realmente guardado (sem limitar ao alvo), enquanto o "falta para concluir" e a barra geral usam `goalsSummary` (limitado ao alvo por meta).
  - **Migração**: `sanitizeSettings` monta as preferências campo a campo, então `savingsTarget` de documentos/backups antigos é simplesmente descartado na leitura e some do storage no próximo salvamento. `schemaVersion` continua 1. Backups da v1.5.0 importados numa versão antiga recebem a meta padrão (20%) por saneamento.
- **Alternativas consideradas:**
  - *Manter o saldo sem descontar aportes* (DT-008 integral): menos mudança, mas o saldo "disponível" incluiria dinheiro já reservado em metas, contradizendo o novo significado de poupança. Rejeitada.
  - *Gerar um lançamento de despesa a cada aporte*: o saldo cairia automaticamente, mas inflaria "Despesas", distorceria limites de categoria e o CSV, e exigiria uma categoria artificial. Rejeitada (mesmo motivo da DT-008).
  - *Modelo de contas/transferências*: o mais correto contabilmente, porém grande demais para esta versão; continua como evolução futura.
  - *Descontar também o valor inicial das metas*: rejeitada, pois esse dinheiro não veio de lançamentos registrados e deixaria o saldo negativo para quem acabou de cadastrar uma meta.
  - *Estoque "na data do fim do período"* (total guardado em um mês passado): mais fiel ao período, mas misturaria na mesma tela previsões atuais com valores históricos; a linha acumulada já cobre o histórico.
- **Vantagens:** os números refletem onde o dinheiro está; um único conceito de poupança no app; nenhuma mudança de modelo de dados (aportes já tinham data); funções puras testadas.
- **Desvantagens e consequências:** o saldo exibido muda para quem já tinha aportes registrados (fica menor). Quem registrava manualmente um "lançamento de despesa" para cada aporte passa a ter o valor descontado duas vezes e deve remover esses lançamentos. Aportes com data futura reduzem o saldo previsto do mês correspondente. Sem lançamentos e com aportes, o saldo disponível pode ficar negativo. A renda mensal do perfil deixou de ter uso nos cálculos (é só referência).
- **Módulos afetados:** `models`, `domain/summary`, `domain/goals`, `domain/reports`, `domain/alerts`, `validations`, `services/storage/FinanceDocument`, `store/demoData`, `modules/dashboard`, `modules/reports`, `modules/settings`, `modules/onboarding` (texto de ajuda).

## DT-017 — Assinaturas: lançamentos reais gerados quando a cobrança vence; meses futuros só como previsão

- **Data:** 31/10/2026 · **Status:** Aceita
- **Contexto:** O usuário quer cadastrar as assinaturas mensais (Netflix, Claude, Amazon...) e vê-las na aba Gastos. Todas as regras existentes (limites de categoria, alertas, Gastos, Extrato, Gráficos, CSV, saldo) são calculadas a partir de `transactions`. Era preciso decidir se a cobrança mensal vira um lançamento de verdade ou se é só calculada (virtual).
- **Decisão:**
  - **Materializar**: cada assinatura ativa gera uma `Transaction` de despesa por mês, com `subscriptionId` e `subscriptionMonth`, na data de cobrança (`billingDay`, limitado ao último dia do mês: 31 → 28/29 em fevereiro, 30 em abril).
  - **Quando**: só cobranças com **data ≤ hoje**, do `startMonth` até o mês atual (respeitando `endMonth`). A geração (`syncSubscriptionCharges`, função pura em `domain/subscriptions.ts`) roda ao abrir o app, ao voltar para ele (`visibilitychange`), ao salvar/pausar/retomar uma assinatura e ao importar um backup. Escolhemos "data já chegou" em vez de "todo o mês atual" para manter o Extrato e o saldo atual fiéis ao que já foi cobrado (o saldo do mês atual considera lançamentos até hoje).
  - **Idempotência**: um mês é gerado no máximo uma vez — já existe lançamento com o mesmo `subscriptionId` + `subscriptionMonth` (mesmo que o usuário tenha editado data ou valor) ou o mês está em `skippedMonths`. O id do lançamento é determinístico (`sub-<id>-<AAAA-MM>`), proteção extra contra duplicação.
  - **Exclusão manual**: excluir um lançamento gerado adiciona o mês a `skippedMonths` da assinatura; ele não volta.
  - **Pausa**: assinatura pausada não gera; um mês cuja data de cobrança chega durante a pausa é registrado em `skippedMonths`, para que retomar não lance cobranças retroativas. Antes de pausar, as cobranças já vencidas são lançadas.
  - **Edição**: valor, dia, categoria e nome novos valem para os meses ainda não lançados; lançamentos existentes não mudam. Editar um lançamento gerado mantém o vínculo; duplicá-lo cria um lançamento manual.
  - **Meses futuros**: não são materializados. `monthSubscriptionCharges` lista as cobranças do mês como "Lançada" ou "Prevista" (ativa, não lançada, data > hoje). `projectedSubscriptionExpenses` soma as previstas entre hoje e a data do saldo e é descontada do **saldo previsto ao fim do mês** em meses futuros (no mês atual e em meses passados vale zero). Previsões não entram em "Despesas", limites, gráficos nem CSV — esses continuam refletindo só lançamentos.
  - **Primeiro mês**: até `SUBSCRIPTION_BACKFILL_MONTHS = 12` meses atrás (os meses passados são lançados ao salvar) e até o mês limite de planejamento (DT-012). Na edição, o primeiro mês já salvo é sempre aceito.
  - **Excluir assinatura**: por padrão os lançamentos gerados são mantidos (continuam no Extrato com o selo "Assinatura" e no bloco do mês); opcionalmente são removidos juntos.
  - **Categoria**: nova categoria padrão "Assinaturas" (`cat-subscriptions`, despesa, Estilo de Vida, teto R$ 250). Para quem já tem dados, o formulário oferece "Assinaturas (nova categoria)", criada ao salvar com as regras de `missingDefaultCategories` (regra 23). Categorias usadas por assinaturas não podem ser excluídas nem mudar de tipo.
  - **Persistência**: novo array `subscriptions` no documento, sem mudar `schemaVersion` (aditivo): ausente → `[]`; validação estrutural (centavos, dia 1–31, `AAAA-MM`) e saneamento dos campos opcionais.
- **Alternativas consideradas:**
  - *Virtual (calcular as cobranças sem gravar lançamentos)*: nada a sincronizar e sem risco de duplicação, mas cada regra existente (resumos, limites, alertas, semanas, relatórios, CSV, extrato, busca) precisaria conhecer as assinaturas, e o usuário não poderia ajustar ou excluir uma cobrança específica (ex.: um mês com desconto). Rejeitada pelo acoplamento e pela perda de controle.
  - *Materializar todo o mês atual (inclusive cobranças após hoje)*: o Extrato mostraria cobranças que ainda não aconteceram e o saldo atual cairia antes da hora. Rejeitada.
  - *Materializar meses futuros*: poluiria o Extrato e exigiria apagar/atualizar lançamentos a cada edição da assinatura. Rejeitada.
  - *Marca d'água `generatedThrough`*: mais simples, porém impede gerar meses anteriores quando o usuário antecipa o primeiro mês e não distingue exclusão de pausa. Rejeitada em favor de `subscriptionMonth` + `skippedMonths`.
- **Vantagens:** todas as telas e regras enxergam as cobranças sem mudanças; cada cobrança pode ser editada ou excluída; geração pura, determinística e testável; meses futuros previstos sem gravar dados especulativos.
- **Desvantagens e consequências:** a geração depende de o app ser aberto (não há servidor) — ao abrir, todos os meses pendentes são lançados de uma vez. Quem já registrava a assinatura manualmente terá o valor em dobro a partir do primeiro mês escolhido (deve excluir um dos dois; o formulário explica que cobranças até hoje são lançadas). Pausar no dia da cobrança (antes de abrir o app) ignora aquele mês. Em meses futuros, "Despesas" do mês não inclui as previsões, apenas o saldo previsto. Excluir uma assinatura mantendo os lançamentos deixa `subscriptionId` órfão (exibido com o nome do lançamento).
- **Módulos afetados:** `models`, `domain/subscriptions`, `services/storage/FinanceDocument`, `services/repositories`, `store` (`FinanceProvider`, `financeReducer`, `defaultCategories`, `demoData`), `validations`, `modules/subscriptions`, `modules/categories`, `modules/transactions`, `modules/dashboard`, `modules/settings`, `components/common/ConfirmDialog`, `design-system/icons`.

## DT-018 — Navegação com 6 itens: Assinaturas na barra inferior com rótulo inteiro

- **Data:** 31/10/2026 · **Status:** Aceita (substitui parcialmente DT-007)
- **Contexto:** O usuário pediu uma **nova aba** Assinaturas. A barra inferior tinha 5 itens (Início, Extrato, Gastos, Metas, Gráficos) com `min-width: 3.25rem` por item. Em 320 px, 6 itens deixam ≈ 52 px por item; "Assinaturas" é o rótulo mais longo (≈ 55 px em Geist 11 px).
- **Decisão:** 6 itens na barra inferior e na lateral, nesta ordem: Início, Extrato, Gastos, **Assinaturas**, Metas, Gráficos (Assinaturas ao lado de Gastos, por afinidade). Na barra inferior: itens sem largura mínima fixa (`min-width: 0`, `flex: 1`), rótulos sem quebra de linha (`nowrap`, cortados só como último recurso) e, abaixo de 360 px, fonte de 10 px com espaçamento levemente reduzido (≈ 49 px para "Assinaturas"). A partir de 360 px a fonte continua 11 px. Ajustes permanece no cabeçalho e no rodapé da lateral.
- **Alternativas consideradas:** rótulo abreviado ("Assinat.", "Planos") — menos legível ou ambíguo; tirar Gráficos ou Metas da barra e movê-los para um menu — esconderia telas que o usuário usa e pediu recentemente (v1.5.0); acesso só por atalho em Gastos — não seria uma aba, contrariando o pedido; barra rolável — esconde itens e gera scroll horizontal.
- **Vantagens:** todas as telas a um toque; rótulo completo e legível; nenhuma mudança na lateral (desktop) além do novo item.
- **Desvantagens e consequências:** em 320–359 px os rótulos ficam com 10 px (abaixo dos 11 px do design); alvo de toque de cada item ≈ 52 px de largura (acima dos 44 px mínimos). Não foi conferido visualmente em navegador real nesta versão (só jsdom); se o rótulo cortar em alguma fonte de fallback, a alternativa é um rótulo curto apenas abaixo de 360 px.
- **Módulos afetados:** `components/layout` (`navItems`, `Navigation.module.css`), `app/routes`.