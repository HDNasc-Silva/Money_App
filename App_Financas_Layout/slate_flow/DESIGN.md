---
name: Slate & Flow
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#40000d'
  on-tertiary-container: '#f23d5c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-lg:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

O design system estabelece uma experiência de finanças pessoais intencional, serena e hiper-estruturada. A filosofia visual equilibra a disciplina utilitária e minimalista do Notion com a fluidez ergonômica e sistemática do Material You (Material 3).

### Personalidade e Tom
- **Serenidade e Clareza:** Elimina a ansiedade financeira ao remover ruídos visuais, decorações supérfluas e excesso de gradientes agressivos.
- **Rigor Tipográfico e Estrutural:** Inspirado em documentos e bases de conhecimento ricas, tratando métricas, orçamentos e lançamentos como itens organizados em listas e blocos lógicos.
- **Precisão Tátil:** Interações mobile-first responsivas, com feedback tátil e transições discretas projetadas para PWA de alta performance.

### Direção Estética
A identidade combina o minimalismo contemporâneo com superfícies de ardósia (*clean slate*), microbordas de baixa opacidade e acentos cromáticos funcionais de alto significado: o esmeralda atua estritamente na validação de receitas e progresso de poupança, enquanto o coral/terracota suave sinaliza despesas sem alarmismo punitivo.

## Colors

A paleta é fundamentada na sobriedade da ardósia neutra (*Slate*), garantindo legibilidade absoluta e permitindo que as cores semânticas comuniquem dados financeiros com alta fidelidade e baixa fadiga cognitiva.

### Superfícies e Neutros
- **Background Principal:** `#F8FAFC` (Slate 50) no tema claro; no dark mode utiliza `#0B0F19` (Slate ultra-profundo).
- **Superfícies de Cartão / Blocos:** `#FFFFFF` em contraste suave com bordas delicadas.
- **Texto Primário:** `#0F172A` (Slate 900) para máxima nitidez em números e rótulos.
- **Texto Secundário e Metadados:** `#64748B` (Slate 500).
- **Divisores e Bordas Estruturais:** `#E2E8F0` (Slate 200) com opacidade controlada.

### Acentos Funcionais e Semântica Financeira
- **Receitas / Saldo Positivo:** `#059669` (Esmeralda Profundo) com fundo de suporte `#ECFDF5`.
- **Despesas / Débito:** `#E11D48` / Terracota `#E05A47` com fundo de suporte `#FFF1F2`.
- **Avisos e Metas em Andamento:** Âmbar suave `#D97706` com base `#FFFBEB`.
- **Categorização e Contas:** Índigo discreto `#4F46E5` (`#EEF2FF`) e Rosé suave `#E11D48` (`#FDF2F8`).

## Typography

A escala tipográfica prioriza a legibilidade de dados quantitativos e hierarquia estruturada de informação.
- **Geist** é empregada nos títulos, valores numéricos principais e rótulos de status (`label-*`), oferecendo métricas monoespaçadas equilibradas com caracteres compactos de alta precisão.
- **Inter** governa o corpo de texto, listas de transações e descritivos contextuais, assegurando fluidez de leitura em telas de densidade variada.
- Todos os montantes monetários de destaque utilizam variantes tabulares (`font-feature-settings: 'tnum' 1`) para evitar trepidações horizontais durante atualizações em tempo real.

## Layout & Spacing

O layout adota uma grade fluida orientada a dispositivos móveis e embalada para comportamento de Progressive Web App (PWA).

### Filosofia de Espaçamento
- **Régua Base:** Grid de 4px/8px rigoroso. Espaçamentos internos de cartões operam predominantemente em `space-md` (12px) e `space-lg` (20px).
- **Margens de Borda:** Margem fixa de 16px (`1rem`) em smartphones para maximizar a área de toque e visualização, expandindo para 24px em tablets e janelas responsivas superiores a 768px.
- **Safe Areas:** O design prevê integração total com a *Safe Area Inset* superior e inferior dos navegadores mobile, reservando áreas ergonômicas para a barra de navegação inferior flutuante (*bottom bar*) e botão de ação rápida (*FAB*).

## Elevation & Depth

A profundidade é expressa através da fusão entre a arquitetura em camadas do Material 3 e o acabamento plano e delineado do Notion.

### Camadas Tonais e Microbordas
- **Nível 0 (Canvas Base):** Fundo neutro ardósia sem elevação.
- **Nível 1 (Cartões e Agrupamentos):** Fundo branco ou neutro puro com borda ultra-fina de 1px em Slate 200 (`#E2E8F0` a 80% de opacidade) combinada a uma sombra difusa imperceptível: `0px 1px 3px rgba(15, 23, 42, 0.04)`.
- **Nível 2 (Bottom Sheets e Menus Suspensos):** Superfície elevada com sombra ambiente amortecida: `0px 8px 24px rgba(15, 23, 42, 0.08)` e borda superior sutil.
- **Nível 3 (Ações Flutuantes / Modais):** Elevação tátil com desfoque de fundo (*backdrop-filter: blur(12px)*) em superfícies translúcidas com tonalidade ardósia.

## Shapes

O sistema de formas adota raios generosos inspirados no Material 3, mantendo a contenção ortogonal do Notion.

- **Cartões e Contêineres de Seção:** Utilizam `rounded-2xl` (16px a 24px) para demarcar grupos de dados com suavidade.
- **Chips, Pílulas de Categoria e Badges:** Empregam formato pílula total (`rounded-full`) ou `rounded-md` (8px) dependendo da densidade da listagem.
- **Campos de Entrada e Botões:** Utilizam `rounded-xl` (12px), proporcionando ergonomia natural aos polegares em telas táteis.

## Components

### Botões
- **Primary:** Fundo Slate 900 (`#0F172A`), texto em contraste neutro branco, canto `rounded-xl`, altura mínima de toque de 48px. Sem sombras agressivas; foco em preenchimento sólido e estado ativo com micro-escala (`scale(0.98)`).
- **Secondary / Subdued:** Fundo ardósia claro (`#F1F5F9`), texto Slate 800, sem borda visível.
- **Destrutivo / Alerta:** Fundo em terracota suave translúcido com texto terracota intenso.

### Chips & Badges Semânticos
- Elementos compactos com cantos `rounded-full` ou `rounded-lg`.
- **Receita:** Fundo `#ECFDF5`, texto `#047857`, ícone indicador ascendente.
- **Despesa:** Fundo `#FFF1F2`, texto `#BE123C`, indicador descendente.
- **Tags de Alerta / Categoria:** Base tonal suave (Índigo `#EEF2FF` / Âmbar `#FFFBEB` / Rosé `#FDF2F8`) com texto na respectiva cor saturada em peso semi-bold (`font-weight: 500`).

### Listas de Transações
- Estrutura linear tipo documento: ícone de categoria inserido em caixa arredondada sutil (`rounded-xl`), título e data alinhados à esquerda, valor monetário alinhado à direita em Geist com formatação tabular.
- Separadores em linha de 1px com recuo alinhado ao texto (estilo iOS/Material You).

### Cartões Financeiros
- Cartão de saldo em destaque no topo com fundo ardósia contrastante ou branco com borda ultra-fina de 1px, apresentando divisão clara entre entradas, saídas e patrimônio consolidado.

### Campos de Entrada (Inputs)
- Altura ergonômica de 52px para telas mobile.
- Bordas em `#E2E8F0`, preenchimento neutro sutil em estado inativo e anel de foco minimalista em Slate 900 de 1.5px sem halos exagerados.
- Inputs numéricos para valores monetários com prefixo de moeda travado e tipografia ampliada em Geist Headline.

### Checkboxes e Seletores
- Estilo minimalista com cantos arredondados (`rounded-md`), transição suave de cor do Slate 200 para Slate 900 ou Esmeralda quando ativado.