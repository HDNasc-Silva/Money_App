# Changelog — Money_App

Todas as alterações relevantes do projeto são registradas aqui, em ordem cronológica (mais recente no topo).
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e [Versionamento Semântico](https://semver.org/lang/pt-BR/).

Categorias: **Adicionado** · **Modificado** · **Corrigido** · **Removido** · **Segurança** · **Refatorado** · **Documentação** · **Técnico**

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
