# Graph Report - Money_APP  (2026-10-31)

## Corpus Check
- 171 files · ~105,701 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 34 file(s) not represented in the graph (top: .css 32, (none) 1, .webmanifest 1)

## Summary
- 1122 nodes · 4140 edges · 49 communities (39 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Gráficos e Indicadores SVG
- Alertas e Orçamentos
- Botões e Controles de UI
- Navegação Inferior/Lateral
- App Shell e Roteamento
- Lógica de Assinaturas
- Modelos de Domínio e Toast
- Catálogo de Ícones e Money
- Mockup Lançamentos (dark)
- Seletor de Categoria e Toast UI
- Workflow de Deploy CI
- Botões e Variantes
- Onboarding e Regras de Assinatura
- Mockup Categorias/Orçamentos
- Providers e Repositórios
- Validação do Documento Financeiro
- Documentação e Decisões Técnicas
- Campos de Formulário
- Seletor de Ícones
- Ações do FinanceProvider
- Config TypeScript
- Config de Categorias em Ajustes
- Providers e Tipos de Domínio
- Dependências de Teste
- Dependências do Projeto
- Instalação do App (PWA)
- Armazenamento do Documento
- Exportação CSV e Storage
- Mockup Dashboard (claro)
- Mockup Lançamentos (claro)
- Mockup Categorias/Orçamentos 2
- Mockup Relatórios e Tendências
- Config ESLint
- Identidade Visual e Ícones do App
- Mockup Simulador de Metas
- Scripts npm
- Service Worker PWA
- Componente Toast
- Config Vite
- Bootstrap da Aplicação
- Repositório de Coleções
- Modal de Nova Categoria (claro)
- Modal de Nova Categoria (escuro)

## God Nodes (most connected - your core abstractions)
1. `Icon()` - 82 edges
2. `todayIso()` - 52 edges
3. `react` - 47 edges
4. `Button()` - 47 edges
5. `Money()` - 44 edges
6. `Card()` - 40 edges
7. `Cents` - 39 edges
8. `useFinanceData()` - 38 edges
9. `monthKeyOf()` - 38 edges
10. `Transaction` - 37 edges

## Surprising Connections (you probably didn't know these)
- `Probe()` --calls--> `useFinance()`  [EXTRACTED]
  tests/defaultCategories.test.tsx → src/store/FinanceProvider.tsx
- `CLAUDE.md Graphify Instructions` --conceptually_related_to--> `Developer Agent Definition`  [INFERRED]
  CLAUDE.md → .claude/agents/developer.md
- `names()` --calls--> `searchIcons()`  [EXTRACTED]
  tests/icons.test.ts → src/design-system/icons.ts
- `currentMonth()` --calls--> `todayIso()`  [EXTRACTED]
  tests/futureMonths.test.tsx → src/utils/dates.ts
- `setup()` --calls--> `todayIso()`  [EXTRACTED]
  tests/futureMonths.test.tsx → src/utils/dates.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Evolução do conceito de poupança (aportes em metas)** — decisoes_tecnicas_dt008, decisoes_tecnicas_dt014, decisoes_tecnicas_dt016 [INFERRED 0.85]
- **Documentação obrigatória mantida pelo agente developer** — claude_agents_developer_developer, changelog_changelog, decisoes_tecnicas_decisoes_tecnicas, escopo_projeto_escopo_projeto, readme_readme [EXTRACTED 1.00]
- **FinOrg screens rendered in Slate&Flow (light) and Obsidian Capital (dark) variants** — app_financas_layout_categorias_tetos_or_ament_rios_1_code_categorias_page, app_financas_layout_categorias_tetos_or_ament_rios_2_code_categorias_page, app_financas_layout_dashboard_vis_o_geral_1_code_dashboard_page, app_financas_layout_dashboard_vis_o_geral_2_code_dashboard_page, app_financas_layout_slate_flow_design_slate_and_flow, app_financas_layout_obsidian_capital_design_obsidian_capital [INFERRED 0.85]
- **Category budget ceiling (teto) tracking flow** — app_financas_layout_categorias_tetos_or_ament_rios_1_code_global_monthly_ceiling, app_financas_layout_categorias_tetos_or_ament_rios_1_code_category_budget_card, app_financas_layout_categorias_tetos_or_ament_rios_1_code_compensation_alert, app_financas_layout_categorias_tetos_or_ament_rios_1_code_new_category_modal, app_financas_layout_dashboard_vis_o_geral_1_code_expenses_by_category [INFERRED 0.85]
- **Variantes de tela FinOrg em tema claro e escuro (Obsidian)** — app_financas_layout_lan_amentos_hist_rico_e_filtros_1_code, app_financas_layout_lan_amentos_hist_rico_e_filtros_2_code, app_financas_layout_metas_financeiras_simulador_1_code, app_financas_layout_metas_financeiras_simulador_2_code, app_financas_layout_relat_rios_tend_ncias_1_code, app_financas_layout_relat_rios_tend_ncias_2_code [INFERRED 0.85]
- **Padrão de toast de feedback para microinterações** — app_financas_layout_lan_amentos_hist_rico_e_filtros_1_code_showtoast, app_financas_layout_lan_amentos_hist_rico_e_filtros_2_code_showtoast, app_financas_layout_metas_financeiras_simulador_1_code_mostrartoast, app_financas_layout_metas_financeiras_simulador_2_code_mostrartoast, app_financas_layout_relat_rios_tend_ncias_1_code_showtoast, app_financas_layout_relat_rios_tend_ncias_2_code_showtoast [INFERRED 0.85]
- **Fluxo do simulador de aportes** — app_financas_layout_metas_financeiras_simulador_1_code_metarestantes, app_financas_layout_metas_financeiras_simulador_1_code_atualizarcalculos, app_financas_layout_metas_financeiras_simulador_1_code_calcularprevisao, app_financas_layout_metas_financeiras_simulador_1_code_simulador_aportes [EXTRACTED 1.00]
- **Budget ceiling monitoring and compensation** — app_financas_layout_categorias_tetos_or_ament_rios_1_teto_mensal_global, app_financas_layout_categorias_tetos_or_ament_rios_1_category_budget_card, app_financas_layout_categorias_tetos_or_ament_rios_1_alerta_de_compensacao, app_financas_layout_categorias_tetos_or_ament_rios_1_budget_status_thresholds [INFERRED 0.85]
- **Visão Geral dashboard section stack** — app_financas_layout_dashboard_vis_o_geral_1_saldo_atual_card, app_financas_layout_dashboard_vis_o_geral_1_kpi_receitas_despesas_poupanca, app_financas_layout_dashboard_vis_o_geral_1_novo_lancamento_cta, app_financas_layout_dashboard_vis_o_geral_1_alertas_diagnostico, app_financas_layout_dashboard_vis_o_geral_1_receitas_vs_despesas_chart, app_financas_layout_dashboard_vis_o_geral_1_gastos_por_categoria, app_financas_layout_dashboard_vis_o_geral_1_consistencia_financeira [EXTRACTED 1.00]
- **Lançamentos filtering pipeline (search + period + type narrow the day-grouped list)** — app_financas_layout_lan_amentos_hist_rico_e_filtros_1_screen_search_bar, app_financas_layout_lan_amentos_hist_rico_e_filtros_1_screen_period_filter_chips, app_financas_layout_lan_amentos_hist_rico_e_filtros_1_screen_type_segmented_control, app_financas_layout_lan_amentos_hist_rico_e_filtros_1_screen_day_grouped_transaction_list [INFERRED 0.85]
- **Goal planning flow: summary, simulator, scenarios, goal cards** — app_financas_layout_metas_financeiras_simulador_1_screen_total_acumulado_card, app_financas_layout_metas_financeiras_simulador_1_screen_simulador_de_aportes, app_financas_layout_metas_financeiras_simulador_1_screen_cenarios_comparativos, app_financas_layout_metas_financeiras_simulador_1_screen_meta_card [INFERRED 0.85]
- **Reports Screen Section Stack** — app_financas_layout_relat_rios_tend_ncias_1_screen_diagnostico_mensal, app_financas_layout_relat_rios_tend_ncias_1_screen_evolucao_liquida, app_financas_layout_relat_rios_tend_ncias_1_screen_distribuicao_despesas, app_financas_layout_relat_rios_tend_ncias_1_screen_insights_ia, app_financas_layout_relat_rios_tend_ncias_1_screen_exportacao_dados [EXTRACTED 1.00]
- **PWA installable app icon set (manifest icons, maskable variants, apple-touch)** — public_icons_icon_192, public_icons_icon_512, public_icons_icon_maskable_192, public_icons_icon_maskable_512, public_icons_apple_touch_icon [INFERRED 0.85]

## Communities (49 total, 10 thin omitted)

### Community 0 - "Gráficos e Indicadores SVG"
Cohesion: 0.06
Nodes (97): BarChart(), BarChartProps, ChartDetails(), ChartDetailsProps, ChartLegend(), ChartDatum, ChartSeries, niceMax() (+89 more)

### Community 1 - "Alertas e Orçamentos"
Cohesion: 0.06
Nodes (100): AlertInput, buildAlerts(), comparableRanges(), FinanceAlert, BUDGET_WARNING_RATIO, budgetStatus, CategoryBudget, categoryBudgets() (+92 more)

### Community 2 - "Botões e Controles de UI"
Cohesion: 0.06
Nodes (46): IconButton(), SegmentedControl(), SegmentedControlProps, SegmentOption, ThemeToggle(), AppearanceSettings(), MODE_OPTIONS, PalettePreview() (+38 more)

### Community 3 - "Navegação Inferior/Lateral"
Cohesion: 0.07
Nodes (40): NAV_ITEMS, NavItem, SETTINGS_ITEM, lastDaysPeriod(), categoriesByUsage(), DescriptionSuggestion, descriptionSuggestions(), lastCategoryForDescription() (+32 more)

### Community 4 - "App Shell e Roteamento"
Cohesion: 0.10
Nodes (23): react-router-dom, @testing-library/react, @testing-library/user-event, vitest, LoadingScreen(), ONBOARDING_PATH, OnboardingGate(), DATA_KEY (+15 more)

### Community 5 - "Lógica de Assinaturas"
Cohesion: 0.11
Nodes (33): chargeDate(), chargeKey(), ChargesSummary, ChargeStatus, chargeTransaction(), chargeTransactionId(), isBilledInMonth(), isForecast() (+25 more)

### Community 6 - "Modelos de Domínio e Toast"
Cohesion: 0.14
Nodes (28): ToastProvider(), Category, DEFAULT_SETTINGS, EMPTY_DATA, GoalContribution, parseFinanceData(), buildDefaultCategories(), DEFINITIONS (+20 more)

### Community 7 - "Catálogo de Ícones e Money"
Cohesion: 0.09
Nodes (30): MoneyProps, CATALOG_BY_NAME, ICON_CATALOG, searchIcons(), buildImportPreview(), Column, columnFor(), detectSeparator() (+22 more)

### Community 8 - "Mockup Lançamentos (dark)"
Cohesion: 0.08
Nodes (35): Lançamentos Histórico e Filtros (light layout), Bottom Sheet de ações do lançamento (Editar/Duplicar/Excluir), Bottom Tab Nav FinOrg (Início/Extrato/Gastos/Metas/Gráficos/Ajustes), closeSheet() (Lançamentos light), Lista de lançamentos agrupada por data, filterTransactions() (Lançamentos light), Tokens de tema claro M3 (primary #000, secondary #006c49, Geist/Inter), showToast() (Lançamentos light) (+27 more)

### Community 9 - "Seletor de Categoria e Toast UI"
Cohesion: 0.16
Nodes (19): Button(), useToast(), CategoryPicker(), CategoryPickerProps, FormStack(), ContributionSheet(), GoalFormSheet(), GoalSimulator() (+11 more)

### Community 10 - "Workflow de Deploy CI"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 11 - "Botões e Variantes"
Cohesion: 0.12
Nodes (16): react, ButtonProps, IconButtonProps, Variant, ConfirmDialog(), ConfirmDialogProps, Sheet(), SheetProps (+8 more)

### Community 12 - "Onboarding e Regras de Assinatura"
Cohesion: 0.10
Nodes (27): BILLING_DAY_MAX, BILLING_DAY_MIN, SUBSCRIPTION_BACKFILL_MONTHS, CategoryGroup, CategoryField, CategoryFormValues, ContributionField, ContributionFormValues (+19 more)

### Community 13 - "Mockup Categorias/Orçamentos"
Cohesion: 0.09
Nodes (24): Bottom Tab Navigation (Início/Extrato/Gastos/Metas/Gráficos/Ajustes), Categorias & Orçamentos Screen (Light), Category Budget Card (consumo vs teto progress), Category Filter Tabs (all/essential/lifestyle), Alerta de Compensação, Teto Mensal Global Card, Categorias & Orçamentos Screen (Dark), Category Filter Tabs (dark) (+16 more)

### Community 14 - "Providers e Repositórios"
Cohesion: 0.28
Nodes (21): App(), AppProviders(), AppRoutes(), createRepositories(), serializeFinanceData(), MemoryStorageAdapter, renderSettings(), setup() (+13 more)

### Community 15 - "Validação do Documento Financeiro"
Cohesion: 0.14
Nodes (23): USER_NAME_MAX, allMatch(), CATEGORY_SHAPE, CORRUPTED_BACKUP_KEY, GOAL_SHAPE, hasValidSubscriptionLink(), isBoolean(), isIntegerCents() (+15 more)

### Community 16 - "Documentação e Decisões Técnicas"
Cohesion: 0.20
Nodes (8): Changelog Money_App, Developer Agent Definition, CLAUDE.md Graphify Instructions, Graphify Knowledge Graph Tool, Decisões Técnicas Money_App (ADR log), Escopo do Projeto Money_App, index.html App Shell + Theme Init Script, README Money_App

### Community 17 - "Campos de Formulário"
Cohesion: 0.19
Nodes (17): describedBy(), FieldShell(), FieldShellProps, FormRow(), MoneyField(), SelectField(), SelectFieldProps, TextField() (+9 more)

### Community 18 - "Seletor de Ícones"
Cohesion: 0.12
Nodes (12): IconPicker(), IconPickerProps, iconLabel(), IconOption, toValues(), Field, SubscriptionFormSheetProps, toValues() (+4 more)

### Community 19 - "Ações do FinanceProvider"
Cohesion: 0.10
Nodes (4): FinanceActions, CategoryDraft, ProfileDraft, SubscriptionDraft

### Community 20 - "Config TypeScript"
Cohesion: 0.10
Nodes (19): compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+11 more)

### Community 21 - "Config de Categorias em Ajustes"
Cohesion: 0.23
Nodes (13): GROUP_LABELS, byName(), CategoriesSettings(), CategoryRow(), SECTIONS, CsvImportSheet(), PendingAction, SettingsPage() (+5 more)

### Community 22 - "Providers e Tipos de Domínio"
Cohesion: 0.17
Nodes (10): AppProvidersProps, Goal, Settings, Subscription, CollectionKey, createCollectionRepository(), Repositories, SettingsRepository (+2 more)

### Community 23 - "Dependências de Teste"
Cohesion: 0.12
Nodes (16): devDependencies, eslint@^9.11.1, jsdom@^25.0.1, @testing-library/jest-dom@^6.5.0, @testing-library/react@^16.0.1, @testing-library/user-event@^14.5.2, @types/node@^22.20.5, @types/react@^18.3.10 (+8 more)

### Community 24 - "Dependências do Projeto"
Cohesion: 0.14
Nodes (14): dependencies, react@^18.3.1, react-dom@^18.3.1, react-router-dom@^6.26.2, description, @testing-library/dom@^10.4.0, typescript@^5.6.2, name (+6 more)

### Community 25 - "Instalação do App (PWA)"
Cohesion: 0.27
Nodes (11): InstallAppCard(), BeforeInstallPromptEvent, canPromptInstall(), InstallOutcome, isAppleMobile(), isRunningStandalone(), listeners, listenForInstallPrompt() (+3 more)

### Community 26 - "Armazenamento do Documento"
Cohesion: 0.29
Nodes (3): FinanceData, FinanceDocument, StorageAdapter

### Community 27 - "Exportação CSV e Storage"
Cohesion: 0.23
Nodes (5): backupToJson(), CSV_BOM, createDefaultAdapter(), LocalStorageAdapter, StorageError

### Community 28 - "Mockup Dashboard (claro)"
Cohesion: 0.29
Nodes (12): Alertas & Diagnóstico do Mês, Bottom Navigation (Início, Extrato, Gastos, Metas, Gráficos, Ajustes), Consistência Financeira Card, Gastos por Categoria Budget Progress, KPI Cards Receitas / Despesas / Poupança, Month Selector (Outubro 2024), Novo Lançamento CTA, Receitas vs Despesas Weekly Bar Chart (+4 more)

### Community 29 - "Mockup Lançamentos (claro)"
Cohesion: 0.27
Nodes (11): Lançamentos Screen (Light Theme Mockup), Bottom Navigation (Início, Extrato, Gastos, Metas, Gráficos, Ajustes), Day-Grouped Transaction List with Daily Net Totals, Monthly Summary Card (Entradas/Saídas + Balanço Positivo), Nova Movimentação Floating Action Button, Period Filter Chips (Este mês / Últimos 7 dias / Mês anterior / Todos), Search by Description or Category, Transaction Row (category icon, category + tag chip, signed amount, overflow menu) (+3 more)

### Community 30 - "Mockup Categorias/Orçamentos 2"
Cohesion: 0.33
Nodes (9): Alerta de Compensação, FinOrg Bottom Navigation, Category Budget Card, Category Type Filter (Essenciais / Estilo de Vida), Nova Categoria Personalizada Button, Categorias & Orçamentos Screen (Light Theme), Teto Mensal Global Card, Dark Theme Variant (+1 more)

### Community 31 - "Mockup Relatórios e Tendências"
Cohesion: 0.40
Nodes (10): Tendências & Relatórios Screen (Light Theme), Bottom Navigation (Início/Extrato/Gastos/Metas/Gráficos/Ajustes), Diagnóstico Mensal (Taxa de Poupança Card), Distribuição de Despesas (Donut + Category Bars), Evolução Líquida 6 Meses (Guardado vs Gastos Bar Chart), Exportação de Dados (PDF / CSV), Insights & Hábitos Financeiros (AI-detected), Period Selector Tabs & Month Picker (+2 more)

### Community 32 - "Config ESLint"
Cohesion: 0.22
Nodes (8): @eslint/js@^9.11.1, eslint-plugin-react-hooks@^5.1.0, globals@^15.9.0, typescript-eslint@^8.8.0, @eslint/js, eslint-plugin-react-hooks, globals, typescript-eslint

### Community 33 - "Identidade Visual e Ícones do App"
Cohesion: 0.22
Nodes (9): Brand palette: dark navy #131b2e + mint green #4edea3, Money APP 'M' logo mark, favicon.svg (M logo mark, navy #131b2e rounded square, green #4edea3 stroke M), apple-touch-icon.png (180px, full-bleed navy, iOS home screen), favicon-32.png (32px raster favicon fallback), icon-192.png (PWA icon, rounded square), icon-512.png (PWA icon, rounded square), icon-maskable-192.png (PWA maskable, full-bleed with safe-zone padding) (+1 more)

### Community 34 - "Mockup Simulador de Metas"
Cohesion: 0.39
Nodes (8): Metas Financeiras com Simulador - Light Theme Mockup, FinOrg Bottom Navigation, Cenarios Comparativos (Conservador/Moderado/Foco Total), Meta em Andamento Card, Simulador de Aportes, Total Acumulado Summary Card, Metas Financeiras com Simulador - Dark Theme Mockup, Dark Theme with Mint Accent

### Community 35 - "Scripts npm"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:watch, typecheck

### Community 36 - "Service Worker PWA"
Cohesion: 0.36
Nodes (6): cacheFirst(), networkFirstNavigation(), PRECACHE, putInCache(), SHELL_URL, staleWhileRevalidate()

### Community 37 - "Componente Toast"
Cohesion: 0.29
Nodes (5): ICONS, ToastContext, ToastContextValue, ToastMessage, ToastTone

### Community 38 - "Config Vite"
Cohesion: 0.33
Nodes (4): vite@^5.4.8, @vitejs/plugin-react@^4.3.2, vite, @vitejs/plugin-react

## Knowledge Gaps
- **45 isolated node(s):** `Graphify Knowledge Graph Tool`, `index.html App Shell + Theme Init Script`, `Emerald/Sky/Rose Semantic Accents (Obsidian)`, `Mobile-first PWA Layout with Safe Areas`, `Category Filter Tabs (all/essential/lifestyle)` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 282 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Botões e Variantes` to `Gráficos e Indicadores SVG`, `Alertas e Orçamentos`, `Botões e Controles de UI`, `Navegação Inferior/Lateral`, `Componente Toast`, `Modelos de Domínio e Toast`, `Bootstrap da Aplicação`, `Seletor de Categoria e Toast UI`, `Onboarding e Regras de Assinatura`, `Campos de Formulário`, `Seletor de Ícones`, `Config de Categorias em Ajustes`, `Providers e Tipos de Domínio`, `Dependências do Projeto`, `Instalação do App (PWA)`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `Graphify Knowledge Graph Tool`, `index.html App Shell + Theme Init Script`, `Emerald/Sky/Rose Semantic Accents (Obsidian)` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Gráficos e Indicadores SVG` be split into smaller, more focused modules?**
  _Cohesion score 0.05829003306565895 - nodes in this community are weakly interconnected._
- **Why does `Icon()` connect `Gráficos e Indicadores SVG` to `Botões e Controles de UI`, `Navegação Inferior/Lateral`, `Componente Toast`, `Modelos de Domínio e Toast`, `Lógica de Assinaturas`, `Seletor de Categoria e Toast UI`, `Botões e Variantes`, `Campos de Formulário`, `Seletor de Ícones`, `Config de Categorias em Ajustes`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `Alertas e Orçamentos` be split into smaller, more focused modules?**
  _Cohesion score 0.0583804143126177 - nodes in this community are weakly interconnected._
- **Why does `react-router-dom` connect `App Shell e Roteamento` to `Gráficos e Indicadores SVG`, `Navegação Inferior/Lateral`, `Modelos de Domínio e Toast`, `Seletor de Categoria e Toast UI`, `Botões e Variantes`, `Onboarding e Regras de Assinatura`, `Providers e Repositórios`, `Dependências do Projeto`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `Botões e Controles de UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05712050078247261 - nodes in this community are weakly interconnected._