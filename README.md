# Money_App

Aplicativo web de gerenciamento de finanças pessoais, mobile-first, feito para substituir a planilha de controle: lançamento rápido, extrato com cara de planilha, importação/exportação CSV e **5 temas de cores** (Esmeralda, Oceano, Ametista, Pôr do sol e Grafite), cada um em modo claro (**Slate & Flow**), escuro (**Obsidian Capital**) ou automático.

## Objetivo

Registrar receitas e despesas, controlar limites de orçamento por categoria, acompanhar as assinaturas mensais, guardar dinheiro em metas financeiras (com simulador de aportes) e acompanhar nos gráficos quanto está sendo guardado — tudo integrado e salvo localmente no navegador.

## Módulos

| Módulo | O que faz |
|---|---|
| Visão Geral ("Início") | Saldo disponível (já descontados os aportes em metas), resumo do mês (receitas, despesas, poupança com variação vs mês anterior), próximas cobranças de assinaturas, últimos lançamentos, metas em destaque, alertas compactos, gráfico semanal e gastos por categoria |
| Lançamentos ("Extrato") | Lançamento rápido (valor com foco automático, categorias em chips, sugestões de descrição, "Salvar e adicionar outro"); seletor de mês (compartilhado com a Visão Geral); extrato agrupado por dia com total do dia, resumo do filtro (entradas, saídas, saldo), busca, filtros em chips, colunas no desktop e exportação CSV; selo "Assinatura" nos lançamentos gerados |
| Categorias ("Gastos") | Categorias, limites mensais, consumo, alertas e o bloco "Assinaturas do mês" (lançadas e previstas) |
| Assinaturas | Assinaturas mensais (Netflix, Spotify, Claude...): valor, dia de cobrança, pausar/retomar, total mensal e anual; as cobranças viram despesas automaticamente no dia de cobrança |
| Metas | Metas, aportes, progresso e simulador de economia |
| Relatórios ("Gráficos") | Centrados nas metas: total guardado, aportes por mês, evolução do total guardado, distribuição por meta e progresso de cada meta; receitas × despesas como seção secundária; exportação CSV/PDF |
| Boas-vindas | No primeiro acesso, pergunta como prefere ser chamado (e, opcionalmente, a renda mensal) |
| Ajustes | Perfil (nome e renda mensal), Aparência (tema de cores com prévia, modo claro/escuro/automático, tamanho do texto, ocultar valores), gerenciamento de categorias (com catálogo de ícones pesquisável), instalar app, planilha (exportar/importar CSV com prévia), backup, dados de demonstração |

## Tecnologias

React 18 · TypeScript · Vite · React Router · CSS Modules com tokens de design · Vitest + Testing Library · ESLint

## Requisitos

- Node.js 20 ou superior (testado com 26.13.0) e npm.
- Navegador moderno (Chrome, Edge, Firefox, Safari).

## Instalação

```bash
npm install
```

## Executar localmente

```bash
npm run dev
```

Abra o endereço exibido no terminal (padrão `http://localhost:5173`).

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Verifica tipos e gera o build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm test` | Executa os testes uma vez |
| `npm run test:watch` | Testes em modo observação |
| `npm run typecheck` | Verificação de tipos |
| `npm run lint` | Análise estática |

## Build

```bash
npm run build
```

O resultado em `dist/` é estático e pode ser publicado em qualquer hospedagem (usa `HashRouter`, sem configuração de servidor). Ele inclui `manifest.webmanifest`, `sw.js` e `icons/` (PWA). A publicação no GitHub Pages é feita pelo workflow `.github/workflows/deploy.yml` a cada push na `main`.

## Instalar no celular (PWA)

Abra https://hdnasc-silva.github.io/Money_App/ (é preciso HTTPS; o service worker só é registrado no build de produção).

- **Android (Chrome):** Ajustes → "Instalar app" → Instalar. Se o botão não aparecer, use o menu ⋮ → "Instalar app" ou "Adicionar à tela inicial".
- **iPhone/iPad (Safari):** toque em Compartilhar (quadrado com seta) → "Adicionar à Tela de Início" → Adicionar. Ajustes mostra essas instruções.
- **Computador (Chrome/Edge):** ícone de instalação na barra de endereço ou Ajustes → "Instalar app".

Depois de aberto uma vez, o app abre também sem internet (os dados ficam no próprio dispositivo). Para testar localmente: `npm run build` e `npm run preview`. A cada release, atualize `CACHE_VERSION` em `public/sw.js`.

## Estrutura

```
src/
├── app/            rotas e providers
├── components/     common, layout, charts, forms
├── modules/        dashboard, transactions, categories, subscriptions, goals, reports, settings, onboarding
├── domain/         regras de negócio puras (cálculos)
├── services/       storage, repositórios, exportação, importação de planilha (CSV), pwa (service worker e instalação)
├── store/          estado global, dados iniciais e de demonstração
├── hooks/          hooks de dados derivados
├── theme/          modo (claro/escuro/automático), paletas, tamanho do texto e persistência
├── design-system/  tokens Slate & Flow (claro), Obsidian Capital (escuro) e palettes.css (temas de cores)
├── models/         tipos
├── utils/          formatação, datas, dinheiro
├── validations/    validação de formulários
└── styles/         estilos globais
public/             favicon, manifest.webmanifest, sw.js e icons/ (PWA)
tests/              testes automatizados
App_Financas_Layout/  layouts de referência (não alterar)
```

## Documentação

- [ESCOPO_PROJETO.md](ESCOPO_PROJETO.md) — escopo, regras de negócio e estado atual.
- [CHANGELOG.md](CHANGELOG.md) — histórico de alterações.
- [DECISOES_TECNICAS.md](DECISOES_TECNICAS.md) — decisões de arquitetura (ADR).

## Para desenvolvedores

- Valores monetários são inteiros em **centavos** (`utils/money.ts` converte e formata).
- Regras de negócio ficam em `src/domain/` como funções puras; componentes não calculam nem acessam o storage.
- Componentes usam apenas tokens de `src/design-system/` — nunca cores fixas — para funcionar em todos os modos e paletas. Tamanhos de texto seguem a escala `--text-*` de `foundation.css`; valores monetários usam a classe `money` (números tabulares).
- Os dados ficam no `localStorage` do navegador (chave `money-app:data:v1`). Na primeira execução o app começa **vazio**, apenas com as categorias padrão (`src/store/defaultCategories.ts`), e mostra a tela de boas-vindas. Dados de demonstração só são carregados a pedido, em Ajustes → "Carregar dados de demonstração"; ficam identificados na interface e são removíveis por "Apagar todos os dados" (que mantém nome, renda e as categorias padrão). Documentos salvos por versões anteriores continuam válidos (ver DT-014; a antiga meta de poupança em % é descartada na leitura, DT-016).
- **Poupança = aportes em metas** (v1.5.0, DT-016): não há taxa nem meta de poupança em %. Os aportes não viram lançamentos, mas saem do saldo disponível. Funções em `src/domain/goals.ts` (`contributionsInPeriod`, `contributionsUntil`, `monthlyContributions`, `savedEvolution`, `savedDistribution`).
- **Assinaturas** (v1.6.0, DT-017): cada cobrança vencida (data ≤ hoje) vira uma despesa real com `subscriptionId`/`subscriptionMonth`, gerada de forma idempotente por `syncSubscriptionCharges` (`src/domain/subscriptions.ts`) ao abrir o app, ao voltar para ele e ao salvar uma assinatura. Meses futuros são só previsões (descontadas do saldo previsto). Excluir um lançamento gerado marca o mês em `skippedMonths`. A barra inferior tem 6 itens (DT-018).
- **Temas** (v1.7.0, DT-019): o modo (`data-theme="light|dark"`, resolvido a partir de claro/escuro/automático) é independente da paleta (`data-palette`) e do tamanho do texto (`data-text-size`), todos no `<html>`. Preferências em `localStorage` na chave `money-app:theme:v2` (JSON); a chave antiga `money-app:theme` é migrada. Para criar um tema: adicione-o em `src/theme/palettes.ts`, os blocos claro/escuro em `src/design-system/palettes.css` e as cores de `theme-color` no script inline do `index.html` (um teste confere a sincronia). Receitas/despesas nunca mudam de cor com o tema.
- **Planilha** (v1.7.0, DT-020): exportação CSV (Excel pt-BR, `;`, BOM) em Ajustes e no Extrato; importação com prévia em Ajustes → "Importar de planilha" (colunas Data, Descrição, Valor, Categoria; `Tipo` e `Observação` opcionais). Regras em `src/services/import/spreadsheetCsv.ts`.
- Antes de qualquer alteração, consulte `ESCOPO_PROJETO.md` e `CHANGELOG.md`; depois, atualize-os.
- No Windows, os comandos acima funcionam no PowerShell. Se o Node acabou de ser instalado, abra um terminal novo para que `npm` seja encontrado.
- Os testes (`tests/`) cobrem utilitários, regras de negócio (inclusive a geração das assinaturas), validações, persistência e migração, exportação e importação CSV, temas (persistência, migração e aplicação), lançamento rápido, o Início e a integração entre os módulos.
- Fontes (Geist, Inter, JetBrains Mono) e ícones (Material Symbols) são carregados do Google Fonts; sem internet, os ícones aparecem como texto.
- `App_Financas_Layout/` é apenas referência visual e não faz parte do build.
