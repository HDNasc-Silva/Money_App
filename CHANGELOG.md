# Changelog — Money_App

Todas as alterações relevantes do projeto são registradas aqui, em ordem cronológica (mais recente no topo).
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e [Versionamento Semântico](https://semver.org/lang/pt-BR/).

Categorias: **Adicionado** · **Modificado** · **Corrigido** · **Removido** · **Segurança** · **Refatorado** · **Documentação** · **Técnico**

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
