# ESCOPO DO PROJETO — Money_App

> Documento oficial de referência. Representa o **estado atual real** do aplicativo e deve ser atualizado a cada alteração do sistema (ver `CHANGELOG.md` e `DECISOES_TECNICAS.md`).

**Versão atual:** 1.0.0 (primeira versão funcional)
**Última atualização:** 30/10/2026

---

## 1. Identificação

| Item | Valor |
|---|---|
| Nome | Money_App |
| Tipo | Aplicativo web (SPA/PWA-ready) de finanças pessoais, mobile-first |
| Referência visual | Pasta `App_Financas_Layout/` (somente leitura) |

## 2. Objetivo

Permitir que uma pessoa registre receitas e despesas, controle limites de orçamento por categoria, acompanhe metas financeiras e analise sua evolução em relatórios, tudo em uma interface moderna, responsiva e com tema claro/escuro.

## 3. Problema que resolve

Falta de visão consolidada das finanças pessoais: gastos acima do planejado só são percebidos no fechamento do mês, metas não têm prazo realista e não há histórico comparativo. O Money_App centraliza os lançamentos e transforma-os em indicadores, alertas e projeções.

## 4. Descrição geral

SPA executada no navegador, sem backend nesta fase. Os dados ficam no `localStorage` por meio de uma camada de repositórios preparada para troca futura por uma API. Cinco módulos principais (Visão Geral, Lançamentos, Categorias, Metas, Relatórios) compartilham um único estado financeiro; qualquer alteração é refletida imediatamente em todos eles.

## 5. Auditoria da pasta `App_Financas_Layout`

### 5.1 Conteúdo

| Pasta | Tela | Tema |
|---|---|---|
| `dashboard_vis_o_geral_1` / `_2` | Visão Geral | claro / escuro |
| `lan_amentos_hist_rico_e_filtros_1` / `_2` | Lançamentos | claro / escuro |
| `categorias_tetos_or_ament_rios_1` / `_2` | Categorias & Orçamentos | claro / escuro |
| `metas_financeiras_simulador_1` / `_2` | Metas Financeiras | claro / escuro |
| `relat_rios_tend_ncias_1` / `_2` | Tendências & Relatórios | claro / escuro |
| `slate_flow/DESIGN.md` | Design System claro | — |
| `obsidian_capital/DESIGN.md` | Design System escuro | — |

Cada tela tem `code.html` (protótipo estático) e `screen.png` (captura mobile, 390 px).

### 5.2 Tecnologias dos protótipos

- HTML estático com Tailwind CSS via CDN e configuração inline de cores.
- Fontes Google: Geist, Inter, JetBrains Mono (escuro) e Material Symbols Outlined (ícones).
- JavaScript inline apenas para micro-interações (ocultar saldo, trocar mês em lista fixa, filtros sobre itens estáticos, slider do simulador, toasts).
- Imagens de logo e avatar hospedadas em `lh3.googleusercontent.com` (não serão usadas: substituídas por ícone e iniciais).

### 5.3 Componentes identificados

Cabeçalho fixo translúcido (logo, título da tela, notificações, avatar) · navegação inferior com indicador ativo · seletor de período em pílula · cartão de saldo em destaque com ocultação · grade de 3 métricas (Receitas, Despesas, Poupança) · botões primário/secundário · cartões de alerta semânticos (âmbar, coral, índigo, esmeralda) · gráfico de colunas semanal · barras de progresso de orçamento · busca com limpar · chips de período · controle segmentado (Todos/Receitas/Despesas) · lista de lançamentos agrupada por dia · bottom sheet de ações (editar, duplicar, excluir) · FAB "Nova Movimentação" · toast · abas de filtro de categorias · modal de nova categoria com seletor de ícone · simulador com select, slider, atalhos e cenários · gráfico de barras empilhadas de 6 meses · gráfico de rosca · cartões de insights · exportação PDF/CSV · estado vazio.

### 5.4 Lacunas dos protótipos (a desenvolver)

- Todos os números são estáticos; não há modelo de dados, cálculo ou persistência.
- Não há formulário de lançamento, edição de meta, ajuste de limite nem aporte reais.
- Não há alternância de tema (cada tema é um arquivo separado).
- Navegação inferior tem 6 itens (inclui "Ajustes"); o escopo pede 5 módulos — ver DT-007.
- Layout desktop não existe; precisa ser derivado (navegação lateral).

## 6. Tecnologias

| Camada | Tecnologia | Motivo |
|---|---|---|
| Linguagem | TypeScript (strict) | Tipagem forte |
| UI | React 18 | Componentização, ecossistema |
| Build/dev | Vite | Rápido, simples, suporte nativo a TS e CSS Modules |
| Roteamento | React Router | Navegação entre os 5 módulos |
| Estilos | CSS Modules + variáveis CSS (tokens) | Tema global por variáveis, sem dependência de Tailwind em runtime |
| Gráficos | SVG próprio em componentes React | Fidelidade aos layouts, sem dependência pesada |
| Testes | Vitest + Testing Library + jsdom | Integração nativa com Vite |
| Qualidade | ESLint (typescript-eslint) + `tsc --noEmit` | Lint e verificação de tipos |
| Persistência | `localStorage` via repositórios | Sem backend nesta fase |

Detalhes e alternativas em `DECISOES_TECNICAS.md`.

## 7. Arquitetura

Arquitetura em camadas, com dependências apontando sempre para dentro:

```
UI (modules/, components/)  →  estado (store/, hooks/)  →  regras de negócio (domain/)
                                     ↓
                            serviços (services/repositories → services/storage)
models/, utils/, validations/  → usados por todas as camadas, sem depender delas
design-system/ + theme/       → apresentação apenas; nunca importam regras financeiras
```

- **domain/**: funções puras (sem React, sem storage) — totais, orçamentos, metas, relatórios, alertas. 100% testáveis.
- **services/**: `StorageAdapter` (interface) → `LocalStorageAdapter` / `MemoryStorageAdapter`; repositórios assíncronos por entidade (prontos para virar chamadas HTTP).
- **store/**: `FinanceProvider` com `useReducer`; carrega os repositórios na inicialização e persiste cada mutação. Única fonte de verdade.
- **modules/**: uma pasta por tela; componentes da tela consomem hooks e funções de `domain/`, sem acessar storage.
- Valores monetários armazenados em **centavos inteiros** (evita erros de ponto flutuante).

## 8. Estrutura de pastas

```
Money_APP/
├── App_Financas_Layout/      # referência visual (não alterar)
├── public/                   # favicon e estáticos
├── src/
│   ├── main.tsx / App.tsx
│   ├── app/                  # rotas e providers
│   ├── components/
│   │   ├── common/           # Button, Card, Icon, Sheet, Toast, ProgressBar, Segmented...
│   │   ├── layout/           # AppShell, Header, BottomNav, SideNav, ThemeToggle
│   │   ├── charts/           # BarChart (agrupado/empilhado), DonutChart, LineChart
│   │   └── forms/            # campos reutilizáveis (MoneyField, Field, Select)
│   ├── modules/
│   │   ├── dashboard/  transactions/  categories/  goals/  reports/  settings/
│   ├── domain/               # regras de negócio puras
│   ├── services/             # storage, repositórios, exportação
│   ├── store/                # estado global financeiro + dados de demonstração
│   ├── hooks/                # hooks de leitura derivada
│   ├── theme/                # contexto e persistência do tema
│   ├── design-system/        # tokens slate-flow (claro) e obsidian-capital (escuro)
│   ├── models/               # tipos e contratos
│   ├── utils/                # formatação, datas, ids
│   ├── validations/          # validação de formulários
│   └── styles/               # reset e estilos globais
├── tests/                    # testes Vitest
├── ESCOPO_PROJETO.md  CHANGELOG.md  DECISOES_TECNICAS.md  README.md
└── package.json, vite.config.ts, tsconfig.json, eslint.config.js
```

## 9. Módulos

| Módulo | Responsabilidade |
|---|---|
| **Visão Geral** (`modules/dashboard`) | Saldo do período, receitas, despesas, poupança, alertas do mês, gráfico semanal, gastos por categoria vs. limite, seletor de mês, atalho para novo lançamento |
| **Lançamentos** (`modules/transactions`) | CRUD de receitas/despesas, histórico agrupado por dia, busca, filtros (período, tipo, categoria), duplicar |
| **Categorias** (`modules/categories`) | CRUD de categorias, limite mensal, gasto atual, % consumido, alertas de limite, teto global, filtro por grupo |
| **Metas** (`modules/goals`) | CRUD de metas, valor alvo/acumulado, prazo, progresso, aportes, simulador de aporte mensal e cenários |
| **Relatórios** (`modules/reports`) | Receitas × despesas, evolução do saldo, tendência de 6 meses/ano, distribuição por categoria, comparação com período anterior, indicadores, exportação CSV/PDF |
| **Ajustes** (`modules/settings`) | Nome do usuário, tema, restaurar dados de demonstração, apagar dados, exportar/importar backup JSON |
| Design System (`design-system`, `theme`) | Tokens dos dois temas, alternância e persistência |
| Persistência (`services`) | Leitura/gravação segura e versionada dos dados |

## 10. Funcionalidades previstas (detalhe)

### 10.1 Visão Geral
- Saldo do mês (receitas − despesas do período) e saldo acumulado total; botão para ocultar valores (preferência persistida).
- Cartões Receitas, Despesas, Poupança com variação em relação ao mês anterior.
- Alertas automáticos: categoria acima do limite, categoria acima de 80%, gastos maiores que o mês anterior, meta ≥ 80%, economia maior que o mês anterior.
- Gráfico Receitas vs Despesas por semana do mês (interativo).
- Gastos por categoria com barra de limite; "Editar tetos" leva a Categorias.
- Seletor de mês (anterior/próximo) compartilhado com Categorias e Relatórios.
- Indicador de consistência (dias com registro no mês).

### 10.2 Lançamentos
- Criar, editar, duplicar e excluir (com confirmação) receitas e despesas.
- Campos: tipo, descrição, valor, data, categoria, observação opcional.
- Histórico agrupado por dia com total diário; resumo de entradas/saídas do período.
- Busca por descrição/categoria; filtros de período (este mês, 7 dias, mês anterior, todos), tipo e categoria; estado vazio com "limpar filtros".

### 10.3 Categorias
- Criar, editar e excluir categorias (despesa ou receita), com ícone, descrição e grupo (Essencial / Estilo de Vida).
- Limite mensal por categoria de despesa; gasto atual, % consumido, restante/excedido.
- Status: dentro do planejado (< 80%), atenção (80–100%), ultrapassado (> 100%).
- Teto global (soma dos limites) e disponível até o fechamento; alerta de compensação.
- Exclusão bloqueada se houver lançamentos vinculados (mensagem orienta a reatribuir).

### 10.4 Metas
- Criar, editar, excluir metas: nome, ícone, descrição, valor alvo, valor já guardado (inicial), aporte mensal planejado, prazo opcional.
- Aportes (somam ao acumulado; histórico por meta); progresso e valor restante.
- Previsão de conclusão com base no aporte mensal planejado da meta; status Em ritmo / Quase lá! / Atrasada / Sem aporte / Concluída.
- Simulador: selecionar meta, aporte mensal (slider + atalhos), meses necessários, data prevista, cenários conservador (60%) / moderado (100%) / foco total (150%), aviso se não cumprir o prazo e aporte mensal necessário para cumpri-lo; botão para adotar o valor simulado como aporte planejado.
- Resumo geral: total acumulado, total pretendido, % geral.

### 10.5 Relatórios
- Intervalos: mês atual, últimos 6 meses, ano.
- Diagnóstico: taxa de poupança, variação vs. período anterior, meta de poupança (configurável, padrão 20%).
- Evolução mensal guardado × gastos (barras empilhadas) e evolução do saldo acumulado (linha), com tooltip.
- Distribuição de despesas por categoria (rosca + barras).
- Comparação entre períodos (receitas, despesas, saldo, variação %).
- Indicadores: dias sem gastos, maior despesa, média diária de gastos, economia vs. média.
- Exportação CSV (lançamentos do intervalo) e PDF (via impressão do navegador).

## 11. Regras de negócio

1. Valores são positivos e armazenados em centavos; o tipo (receita/despesa) define o sinal.
2. Valor mínimo de lançamento: R$ 0,01; máximo: R$ 999.999.999,99.
3. Descrição obrigatória (1–80 caracteres). Data obrigatória e válida.
4. Lançamento de despesa só aceita categoria de despesa; receita só categoria de receita.
5. Saldo do período = Σ receitas − Σ despesas do período. Saldo acumulado = mesma soma até o fim do período.
6. Poupança do período = max(saldo do período, 0); taxa de poupança = poupança ÷ receitas (0 se não houver receitas).
7. Consumo de categoria = Σ despesas da categoria no mês ÷ limite mensal. Sem limite → sem alerta.
8. Status do limite: `< 80%` ok · `80% a 100%` atenção · `> 100%` excedido.
9. Teto global = Σ limites das categorias de despesa; disponível = teto global − despesas do mês em categorias com limite.
10. Meta: acumulado = valor inicial + Σ aportes; progresso = acumulado ÷ alvo (limitado a 100%); concluída quando acumulado ≥ alvo.
11. Meses para atingir meta = ⌈restante ÷ aporte mensal⌉; aporte ≤ 0 → "não atinge".
12. Aporte mensal necessário para o prazo = ⌈restante ÷ meses até o prazo⌉ (mínimo 1 mês).
13. Aportes em metas **não** geram lançamento automático nesta versão (ver DT-008).
14. Semanas do mês: dias 1–7, 8–14, 15–21, 22–28, 29–fim (a 5ª semana só aparece se existir).
15. Categoria com lançamentos vinculados não pode ser excluída.
16. Nomes de categoria únicos (sem diferenciar maiúsculas/minúsculas) por tipo.
17. Dados de demonstração são identificados por um aviso na interface e podem ser apagados em Ajustes.
18. Alertas do mês corrente comparam com o **mesmo intervalo de dias** do mês anterior (ex.: 1–10 vs 1–10); aumento de gastos gera alerta a partir de 10%.
19. Uma categoria com lançamentos não pode mudar de tipo (despesa ↔ receita).
20. O seletor de mês não avança para meses futuros.

## 12. Fluxos de navegação

```
Abrir app → (primeira vez) carregar dados de demonstração → Visão Geral
Navegação: Visão Geral ⇄ Lançamentos ⇄ Categorias ⇄ Metas ⇄ Relatórios (barra inferior / lateral)
Cabeçalho: alternar tema · notificações (lista de alertas) · Ajustes
Visão Geral → "Novo Lançamento" → formulário (sheet) → salvar → todos os módulos recalculam
Visão Geral → "Editar tetos" → Categorias
Visão Geral → "Ver todas as transações" / "Histórico" → Lançamentos
Lançamentos → item → ações (editar / duplicar / excluir)
Categorias → "Ajustar limite" → formulário · "Ver histórico" → Lançamentos filtrado pela categoria
Metas → "Aportar" → formulário de aporte · simulador → resultado em tempo real
Relatórios → exportar CSV / PDF
```

## 13. Design Systems

| Tema | Design System | Fundamentos |
|---|---|---|
| Claro | **Slate & Flow** | Fundo `#f8f9ff`, cartões `#ffffff`, texto `#0b1c30`, primário sólido escuro (`#000`/`#131b2e`), esmeralda `#006c49` para receitas/progresso, terracota/rosa (`#ba1a1a`, `#ffdad6`) para despesas, âmbar para avisos; Geist (títulos, valores, rótulos) + Inter (texto); números tabulares |
| Escuro | **Obsidian Capital** | Fundo `#0f131c`, containers `#181c24`–`#31353e`, texto `#dfe2ee`, primário esmeralda `#4edea3`/`#10b981`, azul-céu `#7bd0ff`/`#38bdf8` para análises, rosa `#ffb2b7`/`#f43f5e` para despesas; **JetBrains Mono** para valores financeiros |

Comum aos dois: raios 8/12/16/24 px, grade de 4/8 px, margem 16 px no mobile e 24 px a partir de 768 px, cartões com borda de 1 px, cabeçalho e barra inferior translúcidos com `backdrop-filter: blur(12px)`, alvos de toque ≥ 44 px.

Os tokens ficam em `src/design-system/` como variáveis CSS com **nomes semânticos idênticos** nos dois temas (ex.: `--color-surface`, `--color-income`, `--font-money`); componentes só usam os tokens.

## 14. Regras de alternância de tema

1. Botão no cabeçalho: ícone **sol** no tema claro, **lua** no escuro; `aria-label` descritivo.
2. Troca global e imediata via atributo `data-theme` no `<html>`; transição suave de cores (200 ms), desativada com `prefers-reduced-motion`.
3. Preferência salva em `localStorage` (`money-app:theme`).
4. Sem preferência salva → segue `prefers-color-scheme` do sistema.
5. Tema aplicado antes da renderização (script inline no `index.html`) para evitar flash.
6. Gráficos, formulários, menus, cartões e sheets usam os mesmos tokens → acompanham a troca.
7. Uma única aplicação; nenhum componente duplicado por tema.

## 15. Armazenamento e persistência

- `StorageAdapter` (get/set/remove de JSON) com implementações `LocalStorageAdapter` (produção) e `MemoryStorageAdapter` (testes/fallback quando o storage estiver indisponível).
- Chave única versionada `money-app:data:v1` com `{ schemaVersion, transactions, categories, goals, settings }`.
- Repositórios assíncronos (`TransactionRepository`, `CategoryRepository`, `GoalRepository`, `SettingsRepository`) — a UI nunca acessa o storage diretamente.
- Erros de leitura (JSON corrompido) → dados preservados em chave de backup e app inicia vazio com aviso; erros de gravação (cota) → toast de erro, estado não é perdido em memória.
- Nenhum dado sensível (senhas, documentos) é armazenado.

## 16. Integração entre módulos

Única fonte de verdade (`FinanceProvider`). Os módulos não guardam cópias dos dados: cada tela deriva seus números de `domain/` a partir do estado. Ex.: cadastrar uma despesa → reducer atualiza `transactions` → repositório persiste → Visão Geral (saldo, despesas, alertas), Categorias (gasto, %, teto global) e Relatórios (gráficos, indicadores) recalculam automaticamente na próxima renderização.

## 17. Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-01 | Cadastrar, editar, duplicar e excluir lançamentos |
| RF-02 | Buscar e filtrar lançamentos por texto, período, tipo e categoria |
| RF-03 | Cadastrar, editar e excluir categorias com limite mensal |
| RF-04 | Calcular gasto, % consumido e status de cada categoria no mês |
| RF-05 | Exibir saldo, receitas, despesas e poupança do mês selecionado |
| RF-06 | Gerar alertas mensais automáticos |
| RF-07 | Cadastrar, editar e excluir metas; registrar aportes |
| RF-08 | Simular aporte mensal e calcular prazo/data de conclusão |
| RF-09 | Exibir relatórios por intervalo com gráficos interativos e comparação de períodos |
| RF-10 | Exportar lançamentos em CSV e relatório em PDF (impressão) |
| RF-11 | Alternar tema claro/escuro com persistência e respeito ao tema do sistema |
| RF-12 | Persistir todos os dados localmente entre sessões |
| RF-13 | Restaurar dados de demonstração, apagar dados, exportar/importar backup JSON |

## 18. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | Mobile-first; funcional de 320 px a desktop; navegação lateral ≥ 1024 px |
| RNF-02 | Acessibilidade: contraste AA, foco visível, `aria-label` em botões de ícone, navegação por teclado, `prefers-reduced-motion` |
| RNF-03 | TypeScript strict, sem `any` injustificado |
| RNF-04 | Nenhum arquivo de componente com responsabilidades misturadas; regras em `domain/` |
| RNF-05 | Build de produção sem erros; lint e typecheck limpos |
| RNF-06 | Testes automatizados para regras financeiras, persistência, tema e fluxos principais |
| RNF-07 | Carregamento inicial rápido (sem bibliotecas de gráfico pesadas) |
| RNF-08 | Dados não saem do dispositivo |

## 19. Etapas de desenvolvimento

| # | Etapa | Status |
|---|---|---|
| 1 | Auditoria dos layouts e Design Systems | ✅ Concluído |
| 2 | Documentação inicial (escopo, changelog, decisões, README) | ✅ Concluído |
| 3 | Fundação: projeto Vite/TS, estrutura, tokens, tema, navegação, persistência | ✅ Concluído |
| 4 | Módulos: Visão Geral, Lançamentos, Categorias, Metas, Relatórios, Ajustes | ✅ Concluído |
| 5 | Integração de dados e cálculos | ✅ Concluído |
| 6 | Testes, responsividade, build | ✅ Concluído |
| 7 | Documentação final | ✅ Concluído |

## 20. Critérios de conclusão e testes

- `npm run typecheck`, `npm run lint`, `npm test` e `npm run build` sem erros.
- Testes unitários de `domain/` (totais, orçamentos, metas, relatórios, alertas, datas), de validações e de formatação.
- Testes de persistência (adapters e repositórios, inclusive dados corrompidos).
- Testes de tema (preferência salva, tema do sistema, alternância).
- Teste de integração: cadastrar despesa reflete em saldo, categoria e relatório.
- Verificação manual no navegador: 5 telas nos 2 temas, mobile (375 px) e desktop.
- Nenhum botão sem ação.

---

## 21. Acompanhamento

Legenda: ✅ Concluído · 🔄 Em desenvolvimento · ⏳ Pendente · ⛔ Bloqueado

### Concluído (v1.0.0 — implementado, testado e verificado no navegador)
- ✅ Visão Geral (10.1): saldo com ocultação, métricas, alertas, gráfico semanal interativo, gastos por categoria, seletor de mês, consistência.
- ✅ Lançamentos (10.2): criar, editar, duplicar, excluir com confirmação, busca sem acentos, filtros de período/tipo/categoria, agrupamento por dia, estado vazio.
- ✅ Categorias (10.3): CRUD, limites, consumo, status, teto global, alerta de compensação, filtro por grupo e receitas, "Ver histórico" filtrado.
- ✅ Metas (10.4): CRUD, aportes, previsão, simulador com cenários e cálculo para o prazo.
- ✅ Relatórios (10.5): intervalos mês/6 meses/ano, diagnóstico, barras empilhadas, linha do saldo, rosca, comparação de períodos, insights, CSV e PDF (impressão).
- ✅ Ajustes: nome, meta de poupança, tema, ocultar valores, backup JSON (exportar/importar), restaurar demonstração, apagar dados.
- ✅ Alternância global de tema (seção 14) com persistência e respeito ao tema do sistema.
- ✅ Persistência local via repositórios, com tratamento de dados corrompidos e storage indisponível.
- ✅ Navegação inferior (mobile) e lateral (≥ 1024 px).
- ✅ 67 testes automatizados (Vitest): utilitários, regras de negócio, validações, persistência, CSV, tema e integração entre módulos.

### Em desenvolvimento
- Nenhum.

### Pendente
- Nenhuma funcionalidade do escopo inicial pendente.

### Bloqueado
- Nenhum.

### Problemas conhecidos / limitações
- Fontes e ícones vêm do Google Fonts: sem internet, o app funciona, mas os ícones aparecem como texto.
- Aportes em metas não aparecem no extrato (DT-008).
- Sem testes E2E em navegador real automatizados; a verificação visual foi manual (375 px e 1366 px, temas claro e escuro).
- O projeto não está sob controle de versão (Git não instalado no ambiente).
- Dados ficam apenas no navegador atual (sem sincronização entre dispositivos).

### Próximas etapas (sugestões)
1. Inicializar repositório Git.
2. PWA instalável (manifest + service worker) com fontes/ícones locais para uso offline.
3. Lançamentos recorrentes e parcelados.
4. Testes E2E com Playwright.
5. Backend e sincronização (trocar os repositórios por implementações HTTP).
