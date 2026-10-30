# Money_App

Aplicativo web de gerenciamento de finanças pessoais, mobile-first, com tema claro (**Slate & Flow**) e escuro (**Obsidian Capital**).

## Objetivo

Registrar receitas e despesas, controlar limites de orçamento por categoria, acompanhar metas financeiras com simulador de aportes e analisar a evolução em relatórios — tudo integrado e salvo localmente no navegador.

## Módulos

| Módulo | O que faz |
|---|---|
| Visão Geral | Saldo, receitas, despesas, poupança, alertas, gráfico semanal, gastos por categoria |
| Lançamentos | Cadastro, edição, exclusão, busca e filtros de receitas e despesas |
| Categorias | Categorias, limites mensais, consumo e alertas |
| Metas | Metas, aportes, progresso e simulador de economia |
| Relatórios | Tendências, distribuição de gastos, comparação de períodos, exportação CSV/PDF |
| Ajustes | Nome, tema, backup, dados de demonstração |

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

O resultado em `dist/` é estático e pode ser publicado em qualquer hospedagem (usa `HashRouter`, sem configuração de servidor).

## Estrutura

```
src/
├── app/            rotas e providers
├── components/     common, layout, charts, forms
├── modules/        dashboard, transactions, categories, goals, reports, settings
├── domain/         regras de negócio puras (cálculos)
├── services/       storage, repositórios, exportação
├── store/          estado global e dados de demonstração
├── hooks/          hooks de dados derivados
├── theme/          alternância e persistência do tema
├── design-system/  tokens Slate & Flow e Obsidian Capital
├── models/         tipos
├── utils/          formatação, datas, dinheiro
├── validations/    validação de formulários
└── styles/         estilos globais
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
- Componentes usam apenas tokens de `src/design-system/` — nunca cores fixas — para funcionar nos dois temas.
- Os dados ficam no `localStorage` do navegador (chave `money-app:data:v1`). Na primeira execução são carregados **dados de demonstração**, identificados na interface e removíveis em Ajustes ("Apagar todos os dados" mantém as categorias padrão definidas em `src/store/defaultCategories.ts`).
- Antes de qualquer alteração, consulte `ESCOPO_PROJETO.md` e `CHANGELOG.md`; depois, atualize-os.
- No Windows, os comandos acima funcionam no PowerShell. Se o Node acabou de ser instalado, abra um terminal novo para que `npm` seja encontrado.
- Os testes (`tests/`) cobrem utilitários, regras de negócio, validações, persistência, exportação CSV, tema e a integração entre os módulos.
- Fontes (Geist, Inter, JetBrains Mono) e ícones (Material Symbols) são carregados do Google Fonts; sem internet, os ícones aparecem como texto.
- `App_Financas_Layout/` é apenas referência visual e não faz parte do build.
