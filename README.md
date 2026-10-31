# Money_App

Aplicativo web de gerenciamento de finanças pessoais, mobile-first, com tema claro (**Slate & Flow**) e escuro (**Obsidian Capital**).

## Objetivo

Registrar receitas e despesas, controlar limites de orçamento por categoria, guardar dinheiro em metas financeiras (com simulador de aportes) e acompanhar nos gráficos quanto está sendo guardado — tudo integrado e salvo localmente no navegador.

## Módulos

| Módulo | O que faz |
|---|---|
| Visão Geral | Saldo disponível (já descontados os aportes em metas), receitas, despesas, poupança (aportes em metas no mês), alertas, gráfico semanal, gastos por categoria |
| Lançamentos | Cadastro, edição, exclusão, busca e filtros de receitas e despesas |
| Categorias | Categorias, limites mensais, consumo e alertas |
| Metas | Metas, aportes, progresso e simulador de economia |
| Relatórios ("Gráficos") | Centrados nas metas: total guardado, aportes por mês, evolução do total guardado, distribuição por meta e progresso de cada meta; receitas × despesas como seção secundária; exportação CSV/PDF |
| Boas-vindas | No primeiro acesso, pergunta como prefere ser chamado (e, opcionalmente, a renda mensal) |
| Ajustes | Perfil (nome e renda mensal), tema, gerenciamento de categorias (com catálogo de ícones pesquisável), instalar app, backup, dados de demonstração |

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
├── modules/        dashboard, transactions, categories, goals, reports, settings, onboarding
├── domain/         regras de negócio puras (cálculos)
├── services/       storage, repositórios, exportação, pwa (service worker e instalação)
├── store/          estado global, dados iniciais e de demonstração
├── hooks/          hooks de dados derivados
├── theme/          alternância e persistência do tema
├── design-system/  tokens Slate & Flow e Obsidian Capital
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
- Componentes usam apenas tokens de `src/design-system/` — nunca cores fixas — para funcionar nos dois temas.
- Os dados ficam no `localStorage` do navegador (chave `money-app:data:v1`). Na primeira execução o app começa **vazio**, apenas com as categorias padrão (`src/store/defaultCategories.ts`), e mostra a tela de boas-vindas. Dados de demonstração só são carregados a pedido, em Ajustes → "Carregar dados de demonstração"; ficam identificados na interface e são removíveis por "Apagar todos os dados" (que mantém nome, renda e as categorias padrão). Documentos salvos por versões anteriores continuam válidos (ver DT-014; a antiga meta de poupança em % é descartada na leitura, DT-016).
- **Poupança = aportes em metas** (v1.5.0, DT-016): não há taxa nem meta de poupança em %. Os aportes não viram lançamentos, mas saem do saldo disponível. Funções em `src/domain/goals.ts` (`contributionsInPeriod`, `contributionsUntil`, `monthlyContributions`, `savedEvolution`, `savedDistribution`).
- Antes de qualquer alteração, consulte `ESCOPO_PROJETO.md` e `CHANGELOG.md`; depois, atualize-os.
- No Windows, os comandos acima funcionam no PowerShell. Se o Node acabou de ser instalado, abra um terminal novo para que `npm` seja encontrado.
- Os testes (`tests/`) cobrem utilitários, regras de negócio, validações, persistência, exportação CSV, tema e a integração entre os módulos.
- Fontes (Geist, Inter, JetBrains Mono) e ícones (Material Symbols) são carregados do Google Fonts; sem internet, os ícones aparecem como texto.
- `App_Financas_Layout/` é apenas referência visual e não faz parte do build.
