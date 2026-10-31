# ESCOPO DO PROJETO — Money_App

> Documento oficial de referência. Representa o **estado atual real** do aplicativo e deve ser atualizado a cada alteração do sistema (ver `CHANGELOG.md` e `DECISOES_TECNICAS.md`).

**Versão atual:** 1.9.0 (Lembretes de assinatura, saldo projetado e sugestão de lançamento fixo)
**Última atualização:** 31/10/2026 (v1.9.0)

---

## 1. Identificação

| Item | Valor |
|---|---|
| Nome | Money_App |
| Tipo | Aplicativo web (SPA/PWA-ready) de finanças pessoais, mobile-first |
| Referência visual | Pasta `App_Financas_Layout/` (somente leitura) |

## 2. Objetivo

Permitir que uma pessoa registre receitas e despesas, controle limites de orçamento por categoria, acompanhe metas financeiras e analise sua evolução em relatórios, tudo em uma interface moderna, responsiva e personalizável (5 temas de cores, modo claro/escuro/automático). Desde a v1.7.0, o objetivo explícito é que o app **substitua a planilha de controle** do usuário: lançar em poucos toques, ver o extrato como numa planilha e levar/trazer os dados por CSV.

## 3. Problema que resolve

Falta de visão consolidada das finanças pessoais: gastos acima do planejado só são percebidos no fechamento do mês, metas não têm prazo realista e não há histórico comparativo. O Money_App centraliza os lançamentos e transforma-os em indicadores, alertas e projeções.

## 4. Descrição geral

SPA executada no navegador, sem backend nesta fase. Os dados ficam no `localStorage` por meio de uma camada de repositórios preparada para troca futura por uma API. Seis módulos principais (Visão Geral, Lançamentos, Categorias/Gastos, Assinaturas, Metas, Relatórios) compartilham um único estado financeiro; qualquer alteração é refletida imediatamente em todos eles.

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
├── public/                   # favicon, manifest.webmanifest, sw.js (service worker), icons/ (PWA)
├── src/
│   ├── main.tsx / App.tsx
│   ├── app/                  # rotas e providers
│   ├── components/
│   │   ├── common/           # Button, Card, Icon, Sheet, Toast, ProgressBar, Segmented...
│   │   ├── layout/           # AppShell, Header, BottomNav, SideNav, ThemeToggle
│   │   ├── charts/           # BarChart (agrupado/empilhado), DonutChart, LineChart
│   │   └── forms/            # campos reutilizáveis (MoneyField, Field, Select)
│   ├── modules/
│   │   ├── dashboard/  transactions/  categories/  subscriptions/  goals/  reports/  settings/  onboarding/
│   ├── domain/               # regras de negócio puras
│   ├── services/             # storage, repositórios, exportação, importação de planilha (CSV), pwa (service worker, instalação)
│   ├── store/                # estado global financeiro, dados iniciais e de demonstração
│   ├── hooks/                # hooks de leitura derivada
│   ├── theme/                # modo, paletas, tamanho do texto: contexto e persistência (DT-019)
│   ├── design-system/        # foundation (escalas), tokens slate-flow (claro), obsidian-capital (escuro), palettes.css (temas de cores)
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
| **Visão Geral** (`modules/dashboard`) | Saldo disponível (descontados os aportes em metas), resumo do mês (receitas, despesas, poupança com variação vs mês anterior), atalho para novo lançamento, próximas cobranças, últimos lançamentos, metas em destaque, alertas compactos, gráfico semanal, gastos por categoria vs. limite, seletor de mês |
| **Lançamentos** (`modules/transactions`) | Lançamento rápido (chips de categoria por uso, sugestões de descrição, "Salvar e adicionar outro"), CRUD de receitas/despesas, extrato agrupado por dia com total do dia, resumo do filtro, busca, filtros em chips (período, tipo, categoria), colunas no desktop, exportação CSV do filtro, duplicar, selo "Assinatura" nos lançamentos gerados |
| **Categorias / Gastos** (`modules/categories`) | CRUD de categorias, limite mensal, gasto atual, % consumido, alertas de limite, teto global, filtro por grupo, bloco "Assinaturas do mês" |
| **Assinaturas** (`modules/subscriptions`) | CRUD de assinaturas mensais (nome, ícone, valor, dia de cobrança, categoria, primeiro/último mês, ativa/pausada, observação), sugestões rápidas, total mensal e estimativa anual, próxima cobrança, pausar/retomar, excluir mantendo ou não os lançamentos; componente do bloco "Assinaturas do mês" usado em Gastos |
| **Metas** (`modules/goals`) | CRUD de metas, valor alvo/acumulado, prazo, progresso, aportes; lista primeiro e, depois, simulador de aporte mensal e cenários |
| **Relatórios / Gráficos** (`modules/reports`) | Centrado nas metas: total guardado, aportes no período, aportes por mês por meta, evolução acumulada do total guardado, distribuição por meta, progresso e previsão de cada meta, estado vazio com atalho para Metas. Secundário: receitas × despesas por mês, distribuição por categoria, comparação com período anterior (inclui aportes), hábitos de gastos, exportação CSV/PDF |
| **Boas-vindas** (`modules/onboarding`) | Tela do primeiro acesso ("Como prefere ser chamado?": nome obrigatório e renda mensal opcional) e `OnboardingGate`, que mostra o carregamento e redireciona entre boas-vindas e app conforme `settings.onboardingCompleted` |
| **Ajustes** (`modules/settings`) | Perfil (nome e renda mensal), Aparência (tema de cores com prévia, modo claro/escuro/automático, tamanho do texto, ocultar valores), gerenciamento de categorias (lista, criar, editar, excluir, restaurar padrão), instalar app (PWA), planilha (exportar CSV e importar CSV com prévia), carregar dados de demonstração, apagar dados (recriando as categorias padrão), exportar/importar backup JSON |
| **Mais** (`modules/more`, v1.8.0, DT-021) | Hub da navegação (`/mais`), acessível só pela barra inferior do mobile: agrupa Gastos/Categorias e Assinaturas ("Dinheiro saindo"), Gráficos/Relatórios ("Acompanhar") e Ajustes ("Conta"), cada um com ícone, nome e descrição curta |
| Design System (`design-system`, `theme`) | Tokens dos modos claro/escuro, paletas (`palettes.css`), escala tipográfica; modo, paleta e tamanho do texto com persistência (DT-019) |
| Persistência (`services`) | Leitura/gravação segura e versionada dos dados; importação de planilha CSV (`services/import`, DT-020) |

## 10. Funcionalidades previstas (detalhe)

### 10.1 Visão Geral
- Saldo disponível (receitas − despesas − aportes em metas, acumulados até a data de referência; regra 36); botão para ocultar valores (preferência persistida). O cartão informa quanto foi guardado em metas no mês (ou "Mês negativo" quando as despesas superam as receitas).
- Resumo do mês (um cartão com três colunas): Receitas, Despesas e Poupança = aportes em metas no mês (regra 35), cada um com a variação vs mês anterior em formato discreto (regra 50). Até a v1.6.0, Despesas mostrava o % das receitas.
- Ordem da tela (v1.7.0, regra 49; v1.9.0 adiciona o saldo projetado): saudação e mês → saldo → resumo → **saldo projetado até o fim do mês** (só no mês atual) → "Novo Lançamento" → **Próximas cobranças** → **Últimos lançamentos** → **Suas metas** → **Alertas do mês** (inclui lembretes de assinatura) → gráfico semanal → gastos por categoria → consistência. No desktop (≥ 1280 px), metas, alertas e análises ficam na segunda coluna.
- **Saldo projetado até o fim do mês** (v1.9.0, regra 57): só no mês corrente, `receitas do mês − despesas já lançadas − assinaturas que ainda vão descontar até o fim do mês`; não substitui o saldo disponível do cartão principal (que desconta aportes em metas).
- **Próximas cobranças**: assinaturas previstas do mês selecionado (no mês atual, as que ainda vão acontecer; regra 45) com data, valor e "Total previsto"; sem assinaturas cadastradas, convite "Cadastre suas assinaturas"; oculto em meses passados.
- **Últimos lançamentos**: os 5 mais recentes do mês selecionado; tocar abre a edição; link "Ver extrato"; vazio → "Registrar lançamento".
- **Suas metas**: até 3 metas (em andamento mais próximas de concluir primeiro, depois concluídas) com barra e "R$ X de R$ Y"; sem metas → "Crie sua primeira meta".
- Alertas automáticos: **cobrança de assinatura chegando (próximos 3 dias, v1.9.0, regra 58)**, categoria acima do limite, categoria acima de 80%, gastos maiores que o mês anterior, meta ≥ 80%, aportes em metas maiores que no mesmo período do mês anterior. No Início aparecem compactos: no máximo 2 e o restante em "Ver todos (+N)" (regra 51); a lista completa continua nas Notificações do cabeçalho.
- Gráfico Receitas vs Despesas por semana do mês (interativo).
- Gastos por categoria com barra de limite; "Editar tetos" leva a Categorias.
- Seletor de mês (anterior/próximo) compartilhado com Categorias e Relatórios; permite meses futuros até 60 meses à frente, com indicação "Mês futuro" e saldo previsto (regras 20 e 27).
- Indicador de consistência (dias com registro no mês).

### 10.2 Lançamentos
- Criar, editar, duplicar e excluir (com confirmação) receitas e despesas.
- Campos: tipo, valor, categoria, descrição, data, observação opcional (nesta ordem desde a v1.7.0).
- **Lançamento rápido** (v1.7.0, regras 52–54): o valor recebe o foco ao abrir (teclado numérico); categorias em **chips com ícone**, das mais usadas para as menos usadas (até 8 visíveis + "Mais N"); a descrição mostra até 4 **sugestões** de descrições anteriores com a categoria usada da última vez; **"Salvar e adicionar outro"** grava, mantém tipo e data, limpa os demais campos e volta ao valor. As validações são as mesmas (regras 2–4, 27).
- **Sugestão de fixo/recorrente** (v1.9.0, regra 59): ao criar uma despesa, se valor (±10%) e descrição (sem acento/maiúsculas) forem parecidos com uma despesa da mesma categoria no mês anterior, aparece "Marcar como fixo", que cria uma assinatura com os dados do lançamento (os meses seguintes passam a ser gerados automaticamente, como em Assinaturas). Só em lançamentos novos (não na edição); ignora lançamentos já vinculados a uma assinatura.
- Extrato agrupado por dia com a contagem de itens e o total do dia; **resumo do filtro** com entradas, saídas e saldo do que está filtrado (regra 55).
- Busca por descrição/categoria/observação; filtros em **chips**: período (este mês, 7 dias, mês anterior, todos), tipo e categoria (ao escolher um tipo, só aparecem as categorias desse tipo); "Limpar filtros"; estado vazio com "limpar filtros" ou, sem filtros, o convite "Seu extrato começa aqui" com "Novo lançamento".
- Desktop (≥ 1024 px): linhas em colunas Descrição | Categoria | Valor, com cabeçalho, como numa planilha.
- "Exportar CSV" exporta exatamente os lançamentos filtrados.
- Sem categoria do tipo selecionado, o formulário mostra um aviso com "Criar categorias padrão" (adiciona só as que faltam) e "Criar categoria personalizada" (fecha o formulário e abre Categorias).

### 10.3 Categorias
- Criar, editar e excluir categorias (despesa ou receita), com ícone, descrição e grupo (Essencial / Estilo de Vida).
- Limite mensal por categoria de despesa; gasto atual, % consumido, restante/excedido.
- Status: dentro do planejado (< 80%), atenção (80–100%), ultrapassado (> 100%).
- Teto global (soma dos limites) e disponível até o fechamento; alerta de compensação.
- Exclusão bloqueada se houver lançamentos vinculados (mensagem orienta a reatribuir).
- Ícone escolhido num catálogo único (`design-system/icons.ts`, 150 ícones desde a v1.6.0, compartilhado com Metas e Assinaturas) com busca em português.
- Bloco **"Assinaturas do mês"** (v1.6.0): cobranças de assinaturas do mês selecionado — lançadas e previstas —, com data, selo "Lançada"/"Prevista", valor, total do mês e link "Gerenciar" para a aba Assinaturas (seção 10.6).
- Também gerenciáveis em **Ajustes → Categorias** (lista compacta por Despesas/Receitas, criar, editar, excluir e "Restaurar categorias padrão"), com o mesmo formulário e as mesmas regras.

### 10.4 Metas
- Criar, editar, excluir metas: nome, ícone, descrição, valor alvo, valor já guardado (inicial), aporte mensal planejado, prazo opcional.
- Aportes (somam ao acumulado; histórico por meta); progresso e valor restante.
- Previsão de conclusão com base no aporte mensal planejado da meta; status Em ritmo / Quase lá! / Atrasada / Sem aporte / Concluída.
- Simulador: selecionar meta, aporte mensal (slider + atalhos), meses necessários, data prevista, cenários conservador (60%) / moderado (100%) / foco total (150%), aviso se não cumprir o prazo e aporte mensal necessário para cumpri-lo; botão para adotar o valor simulado como aporte planejado.
- Resumo geral: total acumulado, total pretendido, % geral.
- Ordem da tela (v1.7.0): resumo → lista de metas → "Criar Nova Meta" → simulador (no desktop, o simulador fica na segunda coluna).

### 10.5 Relatórios (aba "Gráficos") — centrados nas metas (v1.5.0, DT-016)
- Intervalos: mês selecionado, 6 meses até o mês selecionado, ano até o mês selecionado.
- Resumo das metas: total guardado em todas as metas, aportado no período (com variação vs. período anterior), quanto falta para concluir todas, nº de metas concluídas, barra de progresso geral.
- Aportes por mês (barras empilhadas por meta; até 5 metas + "Outras metas"; janela de 6 meses ou o ano), com média mensal.
- Evolução acumulada do total guardado (linha) e crescimento no intervalo.
- Distribuição do dinheiro guardado por meta (rosca + barras).
- Progresso de cada meta: barra, %, guardado/alvo e previsão de conclusão (aporte mensal planejado), indicando quando passa do prazo.
- Sem metas: estado vazio com botão "Ir para Metas".
- Seção secundária "Receitas × despesas": barras mensais de receitas e despesas, comparação entre períodos (receitas, despesas, saldo, aportes em metas, variação %), distribuição de despesas por categoria, hábitos (dias sem gastos, maior despesa, média diária).
- Exportação CSV (lançamentos do intervalo) e PDF (via impressão do navegador).

### 10.6 Assinaturas (v1.6.0, DT-017)
- Aba própria (`/assinaturas`) na barra inferior e na lateral (DT-018).
- Resumo: total mensal das assinaturas ativas, quantidade de ativas e estimativa anual (mensal × 12).
- Lista (ativas, depois pausadas e encerradas, por nome): ícone, nome, valor/mês, dia de cobrança, próxima cobrança, status (Ativa / Pausada / Encerrada), botões Pausar/Retomar e Editar.
- Formulário: sugestões rápidas (só nome e ícone), nome, valor mensal (máscara da regra 24), dia de cobrança, categoria de despesa (padrão "Assinaturas", criada ao salvar se ainda não existir), primeira cobrança (mês), última cobrança opcional (mês, ao cancelar), ativa, observação e ícone com busca.
- Excluir com confirmação; opção de excluir também os lançamentos já gerados (padrão: manter).
- Cobranças lançadas automaticamente como despesas reais no dia de cobrança (regras 39–47); meses futuros aparecem como previstos.
- Estado vazio com "Adicionar assinatura".

### 10.7 Aparência e planilha (v1.7.0, DT-019 e DT-020)
- **Ajustes → Aparência**: 5 temas de cores com prévia (Esmeralda, Oceano, Ametista, Pôr do sol, Grafite), modo Claro / Escuro / Automático, tamanho do texto Normal / Grande, "Ocultar valores".
- O botão sol/lua do cabeçalho continua alternando claro/escuro, mantendo a paleta.
- **Ajustes → Seus dados → Planilha (CSV)**: "Exportar para planilha" (todos os lançamentos, do mais recente ao mais antigo) e "Importar de planilha" (instruções, escolha do arquivo, prévia com contadores, linhas inválidas com motivo, "Importar N lançamentos"). Backup completo (JSON) em grupo próprio.

## 11. Regras de negócio

1. Valores são positivos e armazenados em centavos; o tipo (receita/despesa) define o sinal.
2. Valor mínimo de lançamento: R$ 0,01; máximo: R$ 999.999.999,99.
3. Descrição obrigatória (1–80 caracteres). Data obrigatória e válida (futuras permitidas até o limite da regra 27).
4. Lançamento de despesa só aceita categoria de despesa; receita só categoria de receita.
5. Saldo do período = Σ receitas − Σ despesas do período. Saldo acumulado = mesma soma até o fim do período.
6. ~~Poupança do período = max(saldo do período, 0); taxa de poupança = poupança ÷ receitas.~~ Substituída na v1.5.0 (DT-016): não existe mais taxa nem meta de poupança em %; a poupança é definida pela regra 35.
7. Consumo de categoria = Σ despesas da categoria no mês ÷ limite mensal. Sem limite → sem alerta.
8. Status do limite: `< 80%` ok · `80% a 100%` atenção · `> 100%` excedido.
9. Teto global = Σ limites das categorias de despesa; disponível = teto global − despesas do mês em categorias com limite.
10. Meta: acumulado = valor inicial + Σ aportes; progresso = acumulado ÷ alvo (limitado a 100%); concluída quando acumulado ≥ alvo.
11. Meses para atingir meta = ⌈restante ÷ aporte mensal⌉; aporte ≤ 0 → "não atinge".
12. Aporte mensal necessário para o prazo = ⌈restante ÷ meses até o prazo⌉ (mínimo 1 mês).
13. Aportes em metas **não** geram lançamento automático e não contam como despesa (ver DT-008); desde a v1.5.0 eles são a poupança do mês e reduzem o saldo disponível (regras 35–36, DT-016).
14. Semanas do mês: dias 1–7, 8–14, 15–21, 22–28, 29–fim (a 5ª semana só aparece se existir).
15. Categoria com lançamentos vinculados não pode ser excluída.
16. Nomes de categoria únicos (sem diferenciar maiúsculas/minúsculas) por tipo.
17. Dados de demonstração são identificados por um aviso na interface e podem ser apagados em Ajustes. Desde a v1.4.0 eles **só são carregados a pedido** (Ajustes → "Carregar dados de demonstração", com confirmação de que substituem lançamentos, categorias e metas atuais); o perfil e as preferências do usuário são mantidos e não há nome fixo. O aviso com "Começar do zero" aparece apenas enquanto `isDemoData` for verdadeiro.
18. Alertas do mês corrente comparam com o **mesmo intervalo de dias** do mês anterior (ex.: 1–10 vs 1–10); aumento de gastos gera alerta a partir de 10%.
19. Uma categoria com lançamentos não pode mudar de tipo (despesa ↔ receita).
20. ~~O seletor de mês não avança para meses futuros.~~ Substituída na v1.3.0 (DT-012): o seletor de mês avança até **60 meses à frente** do mês atual (`MAX_FUTURE_MONTHS`; em 30/10/2026 o limite é Outubro de 2031) e volta sem limite. Meses posteriores ao atual exibem "Mês futuro" no seletor; na Visão Geral o saldo vira "Saldo previsto ao fim do mês" (saldo acumulado até o último dia do mês, incluindo lançamentos planejados). No mês atual, o saldo continua considerando apenas lançamentos até hoje.
21. **Categorias padrão** (`store/defaultCategories.ts`): Alimentação, Moradia, Transporte, Lazer, Saúde, Educação, Assinaturas (desde a v1.6.0, teto R$ 250) e Outros (despesa, com limites mensais) e Salário, Freelance e Rendimentos (receita, sem limite). São as mesmas usadas na demonstração.
22. "Apagar todos os dados" (Ajustes, também acessado por "Começar do zero") remove lançamentos, metas e categorias personalizadas, mantém o nome e a renda mensal do usuário, volta as demais preferências ao padrão e **recria as categorias padrão**, para que seja sempre possível lançar em seguida.
23. "Criar categorias padrão" adiciona apenas as categorias padrão ausentes: uma categoria é considerada existente quando há outra do mesmo tipo com o mesmo nome (sem acento e sem diferenciar maiúsculas, como na regra 16); ids padrão já ocupados recebem um id novo, nunca sobrescrevendo dados do usuário.
24. **Entrada de valores monetários** (máscara pelos centavos, `formatMoneyInput`): só dígitos são considerados e os dois últimos são os centavos ("15000" → "150,00"; "1234567" → "12.345,67"); letras, vírgulas e pontos digitados são ignorados; colar "1.234,56" ou "R$ 1234,56" resulta em "1.234,56"; backspace remove o último dígito; sem dígitos significativos o campo fica vazio (a validação de obrigatório continua valendo); no máximo os dígitos de `MAX_AMOUNT` (R$ 999.999.999,99). Valores pré-preenchidos aparecem no mesmo formato ("1.234,56").
25. **Ícones**: categorias e metas escolhem ícones do catálogo `ICON_CATALOG` (nomes do Material Symbols Outlined, sem duplicatas). A busca considera rótulo, palavras-chave e nome, sem acento e sem diferenciar maiúsculas; todos os termos digitados precisam corresponder. Um ícone já salvo fora do catálogo continua válido e exibido.
26. "Restaurar categorias padrão" (Ajustes) segue a regra 23: só adiciona as categorias padrão ausentes e nunca altera ou remove as existentes.
27. **Datas futuras em lançamentos** são permitidas (planejamento) até o último dia do mês limite da regra 20 (mensagem: "A data deve ser até DD/MM/AAAA."). Datas passadas continuam sem limite. Num mês futuro sem lançamentos, indicadores mostram "Período ainda não iniciado." e as comparações com o mês anterior usam os meses completos.
28. **Data sugerida de novo lançamento** (`defaultDateForMonth`, DT-013): se o mês selecionado no seletor de mês for o mês atual, sugere hoje; em qualquer outro mês (passado ou futuro), sugere o mesmo dia de hoje limitado ao último dia daquele mês (ex.: hoje 30/10/2026 com Dezembro 2026 selecionado → 30/12/2026; hoje 31/10 com Novembro → 30/11; fevereiro → 28 ou 29). Vale para todos os pontos que abrem o formulário (Visão Geral, Lançamentos, navegação lateral, botão flutuante). Edição mantém a data do lançamento. A data continua editável. O aporte em metas continua sugerindo hoje (a tela de Metas não tem seletor de mês).
29. **Primeiro acesso** (sem dados salvos, ou dados ilegíveis): o app começa **vazio** — nenhum lançamento ou meta —, com as **categorias padrão** (regra 21) para que seja possível lançar de imediato, e abre a tela de boas-vindas (DT-014).
30. **Boas-vindas (onboarding)**: aparece enquanto `settings.onboardingCompleted` for `false`; qualquer rota leva a ela e não há cabeçalho nem navegação. Nome obrigatório (espaços extras removidos, 1–40 caracteres); renda mensal opcional (máscara da regra 24; vazio = não informada). "Começar" salva o perfil, marca o onboarding como concluído e abre o Início com "Olá, <nome>". Depois de concluído, a rota de boas-vindas redireciona para o Início.
31. **Migração (v1.4.0)**: documentos salvos por versões anteriores não têm `onboardingCompleted` e são tratados como onboarding concluído (quem já usava o app não é interrompido); `monthlyIncome` ausente vale 0. Campos de preferências inválidos voltam ao padrão. Importar um backup nunca reabre as boas-vindas.
32. **Nome do usuário**: não há nome padrão. Sem nome (possível apagando-o em Ajustes), a saudação é apenas "Olá".
33. **Renda mensal** (`settings.monthlyIncome`, centavos, 0 = não informada): editável no onboarding e em Ajustes → card "Perfil". É apenas referência no perfil e não entra em nenhum cálculo. (Até a v1.4.0 o card também tinha a meta de poupança em % e o valor dela em R$; removidos na v1.5.0.)
34. **Instalação (PWA)**: o app é instalável (manifest + service worker, DT-015). Em Ajustes → "Instalar app": botão nativo quando o navegador oferece a instalação (Chrome/Edge/Android); no iPhone/iPad, instruções (Safari → Compartilhar → Adicionar à Tela de Início); nos demais, instrução pelo menu do navegador; já instalado, informa que está aberto como aplicativo.
35. **Poupança = aportes em metas** (v1.5.0, DT-016): poupança de um período = Σ aportes de todas as metas com data no período (o valor inicial da meta não entra). No Início, o KPI "Poupança" mostra a do mês selecionado, com variação vs. mês anterior. O alerta "Ótima Notícia" aparece quando os aportes do mês superam os do mesmo intervalo de dias do mês anterior (e este teve aportes).
36. **Saldo disponível** = Σ receitas − Σ despesas − Σ aportes em metas, todos com data até a data de referência (mês atual: hoje; mês passado/futuro: último dia do mês). O dinheiro aportado sai do saldo disponível, mas não aparece como despesa, no extrato, nos limites de categoria nem no CSV. Valores iniciais das metas não são descontados.
37. **Gráficos das metas**: total guardado, falta para concluir, concluídas, distribuição e progresso refletem a situação atual; o período escolhido define os aportes do período, a comparação com o período anterior e a janela dos gráficos. Na evolução acumulada, o valor inicial de cada meta conta a partir do mês de criação; os aportes, pela data. O total guardado usa o valor real (sem limitar ao alvo).
38. **Migração (v1.5.0)**: documentos e backups com `settings.savingsTarget` carregam normalmente; o campo é descartado na leitura e removido do storage no próximo salvamento.
39. **Assinatura** (v1.6.0, DT-017): nome obrigatório (até 40 caracteres), valor mensal > 0 (regra 2), dia de cobrança 1–31, categoria de despesa, ícone, ativa/pausada, primeiro mês (no máximo 12 meses atrás e até o mês limite da regra 20; na edição, o primeiro mês já salvo é sempre aceito), último mês opcional (≥ primeiro mês), observação opcional (até 200 caracteres).
40. **Data de cobrança** = dia de cobrança no mês, limitado ao último dia do mês (31 → 28/29 em fevereiro, 30 em abril).
41. **Lançamento automático**: cada assinatura ativa gera uma despesa (descrição = nome da assinatura, valor, categoria e data de cobrança) para cada mês entre o primeiro e o último mês cujo dia de cobrança **já chegou (≤ hoje)**. Acontece ao abrir o app, ao voltar para ele, ao salvar/pausar/retomar uma assinatura e ao importar um backup. Um mês nunca é lançado duas vezes, mesmo que o lançamento tenha sido editado. Os lançamentos gerados contam em tudo (saldo, despesas, limites, alertas, gráficos, CSV) como qualquer despesa e trazem o selo "Assinatura" no Extrato.
42. **Excluir uma cobrança gerada** (no Extrato): o mês fica marcado como ignorado e não é lançado de novo. Editar mantém o vínculo; duplicar cria um lançamento manual.
43. **Pausar**: assinatura pausada não gera lançamentos nem previsões; meses cujo dia de cobrança chega durante a pausa ficam ignorados, e retomar não lança cobranças retroativas. Antes de pausar, as cobranças já vencidas são lançadas.
44. **Editar assinatura**: valor, dia, categoria e nome novos valem só para os meses ainda não lançados.
45. **Previsões**: cobrança prevista = assinatura ativa, mês entre o primeiro e o último, não lançada, não ignorada e data depois de hoje. Meses futuros não têm lançamentos gerados, só previsões. No Início, o **saldo previsto ao fim do mês** de um mês futuro desconta as cobranças previstas entre hoje e o fim daquele mês ("Inclui R$ X em assinaturas previstas"); no mês atual e em meses passados o saldo usa só lançamentos. Previsões não entram em "Despesas", limites, gráficos nem CSV.
46. **Status e totais**: Encerrada quando o último mês já passou (ou a última cobrança já aconteceu); Pausada quando inativa; senão Ativa. Total mensal = Σ valores das ativas; estimativa anual = total mensal × 12. Próxima cobrança = primeira data de cobrança depois de hoje (nenhuma se pausada ou encerrada).
47. **Excluir assinatura**: deixa de gerar cobranças; os lançamentos já gerados são mantidos por padrão (podem ser excluídos juntos marcando a opção). Categorias usadas por assinaturas não podem ser excluídas nem mudar de tipo. Sem a categoria "Assinaturas", o formulário oferece "Assinaturas (nova categoria)", criada ao salvar conforme a regra 23.

48. **Temas** (v1.7.0, DT-019): a aparência tem três preferências independentes — modo (Claro, Escuro, Automático = segue o sistema; padrão Automático), tema de cores (Esmeralda, Oceano, Ametista, Pôr do sol, Grafite; padrão Esmeralda) e tamanho do texto (Normal, Grande = 112,5%). Ficam em `localStorage` (`money-app:theme:v2`), valem só neste dispositivo e não entram no backup. A preferência antiga (`money-app:theme` = claro/escuro) vira o modo correspondente com o tema Esmeralda. Receitas são sempre verdes e despesas sempre vermelhas, em qualquer tema.
49. **Ordem do Início** (v1.7.0): da informação mais importante para a de análise (seção 10.1). O aviso de demonstração ocupa uma linha.
50. **Variação dos KPIs**: percentual vs o mês anterior completo (como antes); seta para cima/baixo colorida pelo significado (receitas e poupança: subir é verde; despesas: subir é vermelho); sem valor no mês anterior, mostra "—".
51. **Alertas compactos**: no Início, no máximo 2 alertas visíveis (na ordem de `buildAlerts`: orçamento, gastos, metas, aportes); "Ver todos (+N)" mostra o restante e "Mostrar menos" recolhe.
52. **Ordem das categorias no formulário**: por quantidade de lançamentos do mesmo tipo (desc.), desempate pelo uso mais recente e depois pela ordem do cadastro; categorias nunca usadas ficam no fim. Até 8 chips visíveis; com 2 ou mais a mais, "Mais N" mostra todas (a selecionada sempre aparece).
53. **Sugestões de descrição**: até 4 descrições já usadas no mesmo tipo que contêm o texto digitado (sem acento/maiúsculas), sem repetição — primeiro as que começam com o texto, das mais recentes para as mais antigas. Escolher uma sugestão preenche a descrição e a categoria do lançamento mais recente com essa descrição; digitar exatamente uma descrição já usada também seleciona essa categoria. Nenhuma das duas substitui uma categoria escolhida manualmente. Na edição não há sugestões.
54. **"Salvar e adicionar outro"** (só em novos lançamentos): valida como o botão principal; ao salvar, mantém tipo e data, limpa valor, categoria, descrição e observação e volta o foco ao valor; o subtítulo conta os lançamentos adicionados na sequência.
55. **Resumo do Extrato**: entradas, saídas e saldo (entradas − saídas) dos lançamentos que passam por todos os filtros (período, tipo, categoria e busca). Até a v1.6.0 o resumo ignorava tipo e busca.
56. **Importação de planilha (CSV)** (DT-020): cabeçalho obrigatório com Data, Descrição e Valor (Categoria, Tipo e Observação opcionais); datas `DD/MM/AAAA`, `DD/MM/AA` ou `AAAA-MM-DD`; sem coluna Tipo, valor negativo = despesa e positivo = receita (valor zero é inválido); categoria pelo nome no mesmo tipo, senão "Outros" (ou a primeira do tipo), indicada na prévia; cada linha segue as regras 2–4 e 27; linhas inválidas são ignoradas com o motivo; uma linha igual (data, descrição sem acento/maiúsculas, valor e tipo) a um lançamento já existente é ignorada, mas repetições dentro do arquivo são importadas; máximo 2 MB e 5.000 linhas. Nada é gravado antes de "Importar N lançamentos". A exportação usa o mesmo formato (ida e volta sem perdas).
57. **Saldo projetado até o fim do mês** (v1.9.0, DT-022): só no mês corrente; `Σ receitas do mês − Σ despesas já lançadas no mês − Σ cobranças de assinaturas previstas entre hoje e o fim do mês`. Independe do saldo disponível do cartão principal (regra 36, que desconta aportes em metas).
58. **Lembrete de assinatura chegando** (v1.9.0, DT-022): para cada cobrança prevista (ativa, ainda não lançada, não ignorada) com data entre hoje e os próximos 3 dias (inclusive), um alerta "`<nome>` desconta hoje/amanhã/em N dias (`<valor>`)", com link para Assinaturas. Entra em `buildAlerts` antes dos demais alertas (regra 51).
59. **Sugestão de fixo/recorrente no lançamento rápido** (v1.9.0, DT-022): ao criar uma despesa, se existir uma despesa da mesma categoria no mês anterior com a mesma descrição (sem acento/maiúsculas) e valor dentro de ±10%, mostra "Marcar como fixo". Confirmar cria uma assinatura (nome = descrição, valor, categoria, dia de cobrança = dia da data informada, primeiro mês = mês da data informada); os meses seguintes são gerados automaticamente (regras 39–47). Não sugere na edição nem quando o lançamento comparado já é gerado por uma assinatura.

## 12. Fluxos de navegação

```
Abrir app → (primeira vez) dados vazios + categorias padrão → Boas-vindas ("Como prefere ser chamado?": nome, renda opcional) → "Começar" → Visão Geral ("Olá, <nome>")
Abrir app → (já usa o app) → Visão Geral
Ajustes → "Carregar dados de demonstração" → confirmação → demonstração (aviso de uma linha nas demais telas → "Sair da demonstração" → confirmação → dados apagados, categorias padrão recriadas)
Ajustes → Aparência → tema de cores / modo / tamanho do texto (aplicado na hora e salvo no dispositivo)
Ajustes → Planilha (CSV) → "Exportar para planilha" (download) · "Importar de planilha" → escolher CSV → prévia → "Importar N lançamentos"
Novo lançamento → valor → chip de categoria → descrição (sugestões) → "Adicionar lançamento" ou "Salvar e adicionar outro" (repete)
Início → "Últimos lançamentos" → tocar → edição · "Ver extrato" → Lançamentos · "Próximas cobranças" → Assinaturas · "Suas metas" → Metas
Ajustes → "Instalar app" → diálogo do navegador (ou instruções no iPhone)
Navegação lateral (desktop, ≥ 1024 px): Visão Geral ⇄ Lançamentos (Extrato) ⇄ Categorias (Gastos) ⇄ Assinaturas ⇄ Metas ⇄ Relatórios (Gráficos) ⇄ Ajustes, todos visíveis ao mesmo tempo
Navegação inferior (mobile, v1.8.0, DT-021): Visão Geral ⇄ Lançamentos (Extrato) ⇄ Metas ⇄ Mais (hub) → Gastos (Categorias) / Assinaturas / Relatórios (Gráficos) / Ajustes
Abrir app / voltar para ele → cobranças de assinaturas vencidas são lançadas como despesas
Assinaturas → "Adicionar assinatura" / "Nova assinatura" → formulário (sugestões rápidas) → salvar → cobranças até hoje lançadas · Pausar/Retomar · Editar → Excluir (manter ou não os lançamentos)
Gastos → bloco "Assinaturas do mês" → "Gerenciar" → Assinaturas
Cabeçalho: alternar tema · notificações (lista de alertas) · Ajustes
Visão Geral → "Novo Lançamento" → formulário (sheet, data sugerida no mês selecionado) → salvar → todos os módulos recalculam
Visão Geral → "Editar tetos" → Categorias
Visão Geral → "Ver todas as transações" / "Histórico" → Lançamentos
Lançamentos → item → ações (editar / duplicar / excluir)
Categorias → "Ajustar limite" → formulário · "Ver histórico" → Lançamentos filtrado pela categoria
Metas → "Aportar" → formulário de aporte · simulador → resultado em tempo real
Relatórios (Gráficos) → resumo e gráficos das metas · sem metas: "Ir para Metas" → Metas · exportar CSV / PDF
```

## 13. Design Systems

| Tema | Design System | Fundamentos |
|---|---|---|
| Claro | **Slate & Flow** | Fundo `#f8f9ff`, cartões `#ffffff`, texto `#0b1c30`, primário sólido escuro (`#000`/`#131b2e`), esmeralda `#006c49` para receitas/progresso, terracota/rosa (`#ba1a1a`, `#ffdad6`) para despesas, âmbar para avisos; Geist (títulos, valores, rótulos) + Inter (texto); números tabulares |
| Escuro | **Obsidian Capital** | Fundo `#0f131c`, containers `#181c24`–`#31353e`, texto `#dfe2ee`, primário esmeralda `#4edea3`/`#10b981`, azul-céu `#7bd0ff`/`#38bdf8` para análises, rosa `#ffb2b7`/`#f43f5e` para despesas; **JetBrains Mono** para valores financeiros |

Comum aos dois: raios 8/12/16/24 px, grade de 4/8 px, margem 16 px no mobile e 24 px a partir de 768 px, cartões com borda de 1 px, cabeçalho e barra inferior translúcidos com `backdrop-filter: blur(12px)`, alvos de toque ≥ 44 px.

Os tokens ficam em `src/design-system/` como variáveis CSS com **nomes semânticos idênticos** nos dois temas (ex.: `--color-surface`, `--color-income`, `--font-money`); componentes só usam os tokens.

**Temas de cores (v1.7.0, DT-019)** — `src/design-system/palettes.css` sobrescreve só primária, foco, cartão de saldo, gráficos e fundo (e superfícies em Pôr do sol/Grafite):

| Tema | Destaque claro | Destaque escuro | `theme-color` claro / escuro |
|---|---|---|---|
| Esmeralda (original) | preto `#000000` + verde `#4edea3` no cartão | `#4edea3` | `#f8f9ff` / `#0b0f17` |
| Oceano | `#0b5cad` | `#38bdf8` | `#f5f9ff` / `#09101a` |
| Ametista | `#6d28d9` | `#a78bfa` | `#faf8ff` / `#0d0b16` |
| Pôr do sol | `#b45309` | `#fbbf24` | `#fffaf5` / `#100d0a` |
| Grafite | `#334155` | `#e2e8f0` | `#f7f8fa` / `#0d0e10` |

Escala tipográfica `--text-2xs` (11 px) a `--text-2xl` (24 px), espaçamentos `--space-*`, números com `font-variant-numeric: tabular-nums` (classe `money`), alvos de toque `--touch-target` (44 px).

## 14. Regras de alternância de tema

1. Botão no cabeçalho: ícone **sol** no modo claro, **lua** no escuro; `aria-label` descritivo. Alterna claro/escuro (fixa o modo) mantendo o tema de cores.
2. Troca global e imediata via atributos `data-theme` (modo efetivo), `data-palette` e `data-text-size` no `<html>`; transição suave de cores (200 ms), desativada com `prefers-reduced-motion`.
3. Preferências salvas em `localStorage` (`money-app:theme:v2`, JSON `{ mode, palette, textSize }`); a chave antiga `money-app:theme` é migrada (regra 48).
4. Modo Automático (padrão, também quando não há nada salvo) → segue `prefers-color-scheme` do sistema, inclusive se ele mudar com o app aberto.
5. Modo, paleta e tamanho aplicados antes da renderização (script inline no `index.html`) para evitar flash; metas `theme-color` atualizadas para a cor da paleta no modo.
6. Gráficos, formulários, menus, cartões e sheets usam os mesmos tokens → acompanham a troca.
7. Uma única aplicação; nenhum componente duplicado por tema. Ajustes → Aparência mostra prévias renderizadas com os tokens reais de cada tema.

## 15. Armazenamento e persistência

- `StorageAdapter` (get/set/remove de JSON) com implementações `LocalStorageAdapter` (produção) e `MemoryStorageAdapter` (testes/fallback quando o storage estiver indisponível).
- Chave única versionada `money-app:data:v1` com `{ schemaVersion, transactions, categories, goals, subscriptions, settings }`.
- Repositórios assíncronos (transações, categorias, metas, assinaturas e preferências) — a UI nunca acessa o storage diretamente.
- Assinaturas (v1.6.0): documentos e backups sem `subscriptions` carregam com lista vazia; cada assinatura é validada (valor em centavos, dia 1–31, mês `AAAA-MM`) e saneada (`active`, `endMonth`, `skippedMonths`, `notes`); lançamentos com `subscriptionId`/`subscriptionMonth` inválidos tornam o documento inválido. O backup JSON inclui as assinaturas.
- Erros de leitura (JSON corrompido) → dados preservados em chave de backup e app inicia vazio com aviso; erros de gravação (cota) → toast de erro, estado não é perdido em memória.
- Nenhum dado sensível (senhas, documentos) é armazenado.
- Preferências (`settings`) são saneadas campo a campo na leitura (`sanitizeSettings` em `FinanceDocument.ts`): ausentes ou inválidos recebem o padrão (migração da v1.4.0, regra 31); campos que não existem mais, como o antigo `savingsTarget`, são descartados (regra 38). O `schemaVersion` continua 1.
- Service worker (`public/sw.js`, só em produção): guarda o app shell e os arquivos do build no Cache Storage para abrir offline. Os dados financeiros continuam apenas no `localStorage`.

## 16. Integração entre módulos

Única fonte de verdade (`FinanceProvider`). Os módulos não guardam cópias dos dados: cada tela deriva seus números de `domain/` a partir do estado. Ex.: cadastrar uma despesa → reducer atualiza `transactions` → repositório persiste → Visão Geral (saldo, despesas, alertas), Categorias (gasto, %, teto global) e Relatórios (gráficos, indicadores) recalculam automaticamente na próxima renderização.

## 17. Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-01 | Cadastrar, editar, duplicar e excluir lançamentos |
| RF-02 | Buscar e filtrar lançamentos por texto, período, tipo e categoria |
| RF-03 | Cadastrar, editar e excluir categorias com limite mensal |
| RF-04 | Calcular gasto, % consumido e status de cada categoria no mês |
| RF-05 | Exibir saldo disponível, receitas, despesas e poupança (aportes em metas) do mês selecionado |
| RF-06 | Gerar alertas mensais automáticos |
| RF-07 | Cadastrar, editar e excluir metas; registrar aportes |
| RF-08 | Simular aporte mensal e calcular prazo/data de conclusão |
| RF-09 | Exibir relatórios por intervalo centrados nas metas (aportes, total guardado, distribuição, progresso), com receitas × despesas e comparação de períodos |
| RF-10 | Exportar lançamentos em CSV e relatório em PDF (impressão) |
| RF-11 | Alternar tema claro/escuro com persistência e respeito ao tema do sistema |
| RF-12 | Persistir todos os dados localmente entre sessões |
| RF-13 | Carregar dados de demonstração (a pedido), apagar dados, exportar/importar backup JSON |
| RF-14 | Tela de boas-vindas no primeiro acesso (nome obrigatório, renda opcional) |
| RF-15 | Renda mensal no perfil (referência; a meta de poupança em % foi removida na v1.5.0) |
| RF-16 | Instalar o app no celular/computador (PWA) e abrir offline após o primeiro acesso |
| RF-17 | Cadastrar, editar, pausar/retomar e excluir assinaturas mensais, com lançamento automático das cobranças vencidas |
| RF-18 | Exibir as assinaturas do mês (lançadas e previstas) na aba Gastos e identificar os lançamentos gerados no Extrato |
| RF-19 | Escolher tema de cores (5 opções), modo claro/escuro/automático e tamanho do texto, com prévia e persistência |
| RF-20 | Lançamento rápido: categorias por uso em chips, sugestões de descrição com categoria, "Salvar e adicionar outro" |
| RF-21 | Início com próximas cobranças, últimos lançamentos, metas em destaque e alertas compactos |
| RF-22 | Exportar lançamentos para CSV (Ajustes e Extrato filtrado) e importar CSV de planilha com prévia |

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
- ✅ 72 testes automatizados (Vitest): utilitários, regras de negócio, validações, persistência, CSV, tema, integração entre módulos e categorias padrão.

### Concluído (v1.0.1 — correção, testada automaticamente)
- ✅ "Apagar todos os dados" mantém as categorias padrão (antes deixava o app sem categorias e impedia novos lançamentos).
- ✅ Recuperação no formulário de lançamento para quem já estava sem categorias ("Criar categorias padrão" / "Criar categoria personalizada").
- ✅ Categorias padrão centralizadas e reutilizadas pela demonstração.

### Concluído (v1.1.0 — testado automaticamente)
- ✅ Máscara automática com pontuação pt-BR em todos os campos de valor (lançamento, teto, metas, aporte), teclado numérico no celular e cursor no fim (regra 24).
- ✅ 92 testes automatizados (inclui 19 unitários da máscara/round-trip e 1 de integração da digitação).

### Concluído (v1.2.0 — testado automaticamente)
- ✅ Ajustes → Categorias: lista agrupada, nova categoria, edição/exclusão pelo formulário existente, "Restaurar categorias padrão" (regras 25–26).
- ✅ Catálogo de 139 ícones com rótulos e palavras-chave em português; `IconPicker` com busca, grade rolável, "Selecionado" e estado vazio; usado por Categorias e Metas.
- ✅ 104 testes automatizados (10 unitários do catálogo/busca e 2 de integração de Ajustes → Categorias).

### Concluído (v1.3.0 — testado automaticamente)
- ✅ Navegação para meses futuros até 60 meses à frente, com "Mês futuro" no seletor e saldo previsto na Visão Geral (regra 20, DT-012).
- ✅ Lançamentos com data futura até o fim do mês limite (regra 27).
- ✅ 112 testes automatizados (2 de domínio, 2 de validação e 4 de integração novos).

### Concluído (v1.3.1 — testado automaticamente)
- ✅ Novo lançamento sugere data no mês selecionado (regra 28, DT-013), em todos os pontos de abertura do formulário.
- ✅ 120 testes automatizados (4 unitários de `defaultDateForMonth` e 4 de integração novos).

### Concluído (v1.4.0 — testado automaticamente)
- ✅ Primeiro acesso vazio com categorias padrão; demonstração só a pedido em Ajustes, com confirmação, mantendo o perfil (regras 17, 29). Nome fixo "Gabriel" removido (regra 32).
- ✅ Tela de boas-vindas (`modules/onboarding`) com nome obrigatório e renda opcional, sem navegação, nos dois temas; migração de documentos antigos sem interromper quem já usava o app (regras 30–31, DT-014).
- ✅ Renda mensal no card "Perfil e meta de poupança" de Ajustes, com o valor mensal da meta em R$ (regra 33).
- ✅ PWA: manifest, ícones PNG 192/512 (any e maskable) e apple-touch-icon 180, metas para iOS/Android, service worker versionado e card "Instalar app" (regra 34, DT-015). Build verificado: `dist/` contém `manifest.webmanifest`, `sw.js` e `icons/`.
- ✅ 141 testes automatizados (12 de integração em `tests/onboarding.test.tsx` e 9 unitários em `tests/profile.test.ts` novos).

### Concluído (v1.5.0 — testado automaticamente)
- ✅ Taxa e meta de poupança (%) removidas de todo o app; Ajustes com o card "Perfil" (nome e renda) (regras 6, 33, 38, DT-016).
- ✅ Poupança = aportes em metas: KPI "Poupança" do Início com variação vs mês anterior; alerta de aportes (regra 35).
- ✅ Saldo disponível desconta os aportes em metas (regra 36).
- ✅ Tela de Gráficos centrada nas metas: resumo, aportes por mês empilhados por meta, evolução acumulada, distribuição por meta, progresso com previsão, estado vazio com "Ir para Metas"; receitas × despesas como seção secundária (10.5, regra 37).
- ✅ 151 testes automatizados (9 unitários em `tests/goalSavings.test.ts` e 3 de integração em `tests/goalReports.test.tsx` novos; testes da meta de poupança substituídos).

### Concluído (v1.6.0 — testado automaticamente)
- ✅ Aba Assinaturas (10.6): lista, resumo mensal/anual, próxima cobrança, status, pausar/retomar, criar/editar com sugestões rápidas, excluir mantendo ou removendo lançamentos, estado vazio (regras 39, 46, 47).
- ✅ Lançamentos automáticos idempotentes das cobranças vencidas; exclusão sem regeneração; pausa sem retroativos; edição só para meses não lançados; dia 31 em meses curtos (regras 40–44, DT-017).
- ✅ Previsões de meses futuros no bloco de Gastos e no saldo previsto do Início (regra 45).
- ✅ Bloco "Assinaturas do mês" em Gastos e selo "Assinatura" no Extrato.
- ✅ Categoria padrão "Assinaturas"; migração/validação do novo array; backup com assinaturas; demonstração com assinaturas.
- ✅ Navegação com 6 itens (DT-018).
- ✅ 185 testes automatizados (28 unitários em `tests/subscriptions.test.ts` e 6 de integração em `tests/subscriptionsFlow.test.tsx` novos).

### Concluído (v1.7.0 — testado automaticamente)
- ✅ Temas escolhíveis (10.7, regra 48, DT-019): 5 paletas em claro/escuro, modo automático, tamanho do texto, Ajustes → Aparência com prévias, migração da preferência antiga, aplicação sem flash e `theme-color` por paleta.
- ✅ Lançamento rápido (regras 52–54): foco no valor, chips de categoria por uso, sugestões de descrição com categoria, "Salvar e adicionar outro".
- ✅ Início reorganizado (10.1, regras 49–51): KPIs limpos com variação discreta, próximas cobranças, últimos lançamentos, metas em destaque, alertas compactos, aviso de demonstração em uma linha com "Sair da demonstração".
- ✅ Extrato com cara de planilha (10.2, regra 55): resumo do filtro (entradas, saídas, saldo), filtros em chips, total por dia, colunas no desktop, exportação CSV do filtro.
- ✅ Metas: lista antes do simulador.
- ✅ Planilha (CSV) em Ajustes: exportação e importação com prévia (regra 56, DT-020).
- ✅ Barra inferior sem transbordo do rótulo ativo (revisão da DT-018); alvos de toque maiores, foco visível, esqueleto de carregamento, microanimações respeitando `prefers-reduced-motion`.
- ✅ 218 testes automatizados (33 novos/reescritos: tema 13, lançamento rápido 7 + 5, Início 4, CSV 6 + 2).

### Concluído (v1.8.0 — testado automaticamente)
- ✅ Navegação em 2 níveis (DT-021): barra inferior (mobile) com 4 itens — Início, Extrato, Metas, Mais — em vez de 6; hub "Mais" (`/mais`) agrupando Gastos e Assinaturas ("Dinheiro saindo"), Gráficos ("Acompanhar") e Ajustes ("Conta"), cada um com ícone, nome e descrição curta.
- ✅ Navegação lateral (desktop) sem alteração: continua com todos os 6 destinos e Ajustes.
- ✅ Nenhuma rota mudou (`/lancamentos`, `/categorias`, `/assinaturas`, `/metas`, `/relatorios`, `/ajustes`).
- ✅ 223 testes automatizados (5 novos em `tests/navigation.test.tsx`: barra com 4 itens, chegar a cada destino inclusive pelo "Mais", hub "Mais" com os 4 destinos agrupados, lateral intacta com 7 itens, barra inferior nunca com 6–7 itens).

### Concluído (v1.9.0 — testado automaticamente)
- ✅ Lembrete de assinatura no Início (regra 58, DT-022): alerta "Cobrança chegando" quando uma assinatura ativa vai descontar nos próximos 3 dias, com valor e link para Assinaturas; aparece no Início (compacto) e nas Notificações do cabeçalho.
- ✅ Saldo projetado até o fim do mês (regra 57, DT-022): novo cartão no Início, só no mês corrente, com receitas − despesas já lançadas − assinaturas ainda não descontadas até o fim do mês.
- ✅ Sugestão de fixo/recorrente no lançamento rápido (regra 59, DT-022): "Marcar como fixo" quando a nova despesa é parecida (categoria, descrição e valor ±10%) com uma do mês anterior; confirmar cria uma assinatura a partir do lançamento.
- ✅ 231 testes automatizados (8 novos: 3 em `tests/subscriptions.test.ts` para `subscriptionsChargingSoon`, 2 em `tests/domain.test.ts` para o alerta de cobrança chegando, 3 em `tests/quickEntry.test.ts` para `findRecurringCandidate`).

### Em desenvolvimento
- Nenhum.

### Pendente
- Nenhuma funcionalidade do escopo inicial pendente.

### Bloqueado
- Nenhum.

### Problemas conhecidos / limitações
- Fontes e ícones vêm do Google Fonts: sem internet, o app funciona, mas os ícones aparecem como texto.
- Aportes em metas não aparecem no extrato nem no CSV (DT-008), embora reduzam o saldo disponível (DT-016). Quem registrava aportes também como despesas manuais terá o valor descontado duas vezes e deve remover esses lançamentos.
- Gráficos das metas (v1.5.0): validados em jsdom; a aparência nos dois temas e em 320–375 px ainda não foi conferida visualmente no navegador. Com mais de 5 metas, as demais aparecem agrupadas em "Outras metas" no gráfico de aportes e na rosca. Metas excluídas levam junto seus aportes (o histórico de poupança daquele dinheiro some).
- Sem testes E2E em navegador real automatizados; a verificação visual foi manual (375 px e 1366 px, temas claro e escuro).
- O projeto está sob Git (há commits por versão); a limitação "sem controle de versão", registrada na v1.0.0, não vale mais.
- Dados ficam apenas no navegador atual (sem sincronização entre dispositivos).
- O aviso de categorias ausentes no formulário (v1.0.1) foi validado por testes automatizados (jsdom); falta verificação visual manual no navegador nos dois temas.
- A máscara de valores (v1.1.0) foi validada em jsdom; falta testar manualmente em teclados de celulares reais (Android/iOS) e com edição no meio do texto (o cursor sempre volta ao fim, por decisão de design).
- Ícones do catálogo (v1.2.0): os nomes foram escolhidos entre os existentes no Material Symbols Outlined, mas a renderização de cada um não foi conferida visualmente no navegador (jsdom não carrega a fonte). Um nome inexistente apareceria como texto.

- Meses futuros (v1.3.0): validados em jsdom; a indicação "Mês futuro" no seletor ainda não foi conferida visualmente no navegador nos dois temas. Lançamentos importados com data além do limite ficam visíveis, mas exigem ajustar a data para salvar uma edição.
- Data sugerida (v1.3.1): a tela de Lançamentos não exibe o seletor de mês (usa filtro de período próprio), mas a data sugerida segue o mês escolhido nas outras telas (DT-013). Validado em jsdom; não conferido manualmente no navegador.
- Boas-vindas e Ajustes (v1.4.0): validados em jsdom; a aparência da tela de boas-vindas e do card "Instalar app" ainda não foi conferida visualmente no navegador nos dois temas.
- PWA (v1.4.0): a instalação real (Android/Chrome e iPhone/Safari) e o funcionamento offline não foram testados em dispositivos; o service worker só é registrado no build de produção (GitHub Pages ou `npm run preview`), não no `npm run dev`. `CACHE_VERSION` em `public/sw.js` precisa ser atualizado a cada release. Offline, fontes e ícones do Google Fonts só aparecem se já estiverem no cache HTTP do navegador. A cor de abertura (splash) do app instalado é a do tema claro (o manifest aceita uma única cor).

- Assinaturas (v1.6.0): validadas em jsdom; a aparência da aba, do bloco em Gastos, do selo no Extrato e da barra inferior com 6 itens (rótulo "Assinaturas" em 320–375 px) **não foi conferida visualmente** no navegador nos dois temas (DT-018). Os novos ícones (`live_tv`, `smart_toy`, `library_music`...) não foram conferidos na fonte real. A geração depende de o app ser aberto: ao abrir depois de muito tempo, todos os meses pendentes são lançados de uma vez. Quem já lançava a assinatura manualmente terá o valor em dobro nos meses em comum (excluir um dos dois). Em meses futuros, "Despesas" não inclui as previsões (só o saldo previsto). Alertas e limites de categoria só consideram cobranças já lançadas.

- Interface v1.7.0 (temas, Início, Extrato, formulário, Aparência, importação CSV): validada em jsdom e por build; **não foi conferida visualmente no navegador** nesta entrega (320/375/430 px e 1366 px, 5 temas × 2 modos). Os contrastes AA das paletas foram calculados pela luminância relativa, não medidos em tela. A ausência de scroll horizontal e o rótulo "Assinaturas" em 320 px dependem de CSS que o jsdom não mede.
- Botões pequenos (`size="sm"`) e opções do controle segmentado têm 40 px de altura (os demais alvos têm ≥ 44 px).
- Importação CSV: sem mapeamento manual de colunas/categorias; planilhas só com valores positivos e sem coluna Tipo viram receitas; arquivos em ANSI (Excel antigo) podem trazer acentos trocados.
- As preferências de aparência não fazem parte do backup JSON (são do dispositivo).
- Navegação v1.8.0 (DT-021): Gastos, Assinaturas e Gráficos passam a exigir 2 toques no mobile (Mais → destino) em vez de 1; não foi conferida visualmente no navegador real (320–430 px), só em jsdom.

### Próximas etapas (sugestões)
1. Conferir visualmente a v1.7.0 no navegador (5 temas × claro/escuro, 320–430 px e 1366 px) e medir os contrastes com uma ferramenta (axe/Lighthouse).
2. Importação CSV: escolher o tipo padrão (despesa) para planilhas só com valores positivos e mapear categorias desconhecidas na prévia.
3. Fontes e ícones locais (hoje do Google Fonts) para uso offline completo do PWA; aviso de "nova versão disponível".
4. Lançamentos recorrentes genéricos (receitas fixas, contas) e parcelados — as assinaturas (v1.6.0) já cobrem despesas mensais recorrentes; avaliar generalizar `domain/subscriptions`.
5. Testes E2E com Playwright (incluindo verificação de layout sem scroll horizontal em 320 px).
6. Backend e sincronização (trocar os repositórios por implementações HTTP).
