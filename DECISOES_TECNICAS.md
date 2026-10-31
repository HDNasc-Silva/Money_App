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

## DT-010 — Roteamento com HashRouter

- **Data:** 30/10/2026 · **Status:** Aceita
- **Contexto:** O build deve funcionar em qualquer hospedagem estática (inclusive abrindo de uma pasta), sem configurar rewrites.
- **Decisão:** `HashRouter` do React Router (`/#/lancamentos`).
- **Alternativas:** `BrowserRouter` (URLs mais limpas, exige fallback no servidor).
- **Vantagens:** zero configuração de servidor.
- **Desvantagens:** URLs com `#`. Trocar para `BrowserRouter` quando houver hospedagem definida.
- **Módulos afetados:** `app/`.
