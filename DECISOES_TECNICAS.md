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

- **Data:** 30/10/2026 · **Status:** Aceita
- **Contexto:** Os layouts mostram 6 itens na barra inferior (incluindo "Ajustes"); o escopo pede 5 itens.
- **Decisão:** Barra inferior (mobile) e lateral (≥ 1024 px) com os 5 módulos; Ajustes acessível pelo avatar no cabeçalho e no rodapé da navegação lateral. Rótulos seguem o escopo (Visão Geral, Lançamentos, Categorias, Metas, Relatórios).
- **Alternativas:** manter 6 itens (contraria o escopo).
- **Vantagens:** cumpre o escopo e preserva o visual da barra.
- **Desvantagens:** Ajustes fica um nível abaixo.
- **Módulos afetados:** `components/layout`, `app/routes`.

## DT-008 — Aportes em metas não geram lançamento

- **Data:** 30/10/2026 · **Status:** Aceita
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

- **Data:** 30/10/2026 · **Status:** Aceita (substitui o comportamento da v1.0.0 de carregar dados de demonstração na primeira execução)
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
