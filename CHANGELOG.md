# Changelog — Money_App

Todas as alterações relevantes do projeto são registradas aqui, em ordem cronológica (mais recente no topo).
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e [Versionamento Semântico](https://semver.org/lang/pt-BR/).

Categorias: **Adicionado** · **Modificado** · **Corrigido** · **Removido** · **Segurança** · **Refatorado** · **Documentação** · **Técnico**

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
