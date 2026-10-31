/**
 * Paletas de cor (temas nomeados). Cada paleta tem variantes clara e escura; os tokens CSS
 * ficam em `design-system/palettes.css` (seletores `[data-theme][data-palette]`). Ver DT-019.
 *
 * Receitas (verde) e despesas (vermelho) são cores semânticas fixas e NÃO mudam com a paleta.
 */
export type PaletteId = 'esmeralda' | 'oceano' | 'ametista' | 'por-do-sol' | 'grafite';

export interface PaletteVariant {
  /** Cor de destaque principal (botões primários, seleção). */
  accent: string;
  /** Cor da barra do navegador/app instalado (`<meta name="theme-color">`), igual ao fundo do cabeçalho. */
  themeColor: string;
}

export interface PaletteDefinition {
  id: PaletteId;
  name: string;
  description: string;
  light: PaletteVariant;
  dark: PaletteVariant;
}

export const DEFAULT_PALETTE: PaletteId = 'esmeralda';

/**
 * Mantenha `themeColor` igual ao mapa do script inline do `index.html` (há um teste que confere).
 * Os valores de `accent` são apenas descritivos (prévia/documentação); as cores reais vêm do CSS.
 */
export const PALETTES: readonly PaletteDefinition[] = [
  {
    id: 'esmeralda',
    name: 'Esmeralda',
    description: 'O visual original: grafite elegante com verde de destaque.',
    light: { accent: '#000000', themeColor: '#f8f9ff' },
    dark: { accent: '#4edea3', themeColor: '#0b0f17' },
  },
  {
    id: 'oceano',
    name: 'Oceano',
    description: 'Azul profundo, calmo e corporativo.',
    light: { accent: '#0b5cad', themeColor: '#f5f9ff' },
    dark: { accent: '#38bdf8', themeColor: '#09101a' },
  },
  {
    id: 'ametista',
    name: 'Ametista',
    description: 'Roxo vibrante com toque moderno.',
    light: { accent: '#6d28d9', themeColor: '#faf8ff' },
    dark: { accent: '#a78bfa', themeColor: '#0d0b16' },
  },
  {
    id: 'por-do-sol',
    name: 'Pôr do sol',
    description: 'Âmbar quente e acolhedor.',
    light: { accent: '#b45309', themeColor: '#fffaf5' },
    dark: { accent: '#fbbf24', themeColor: '#100d0a' },
  },
  {
    id: 'grafite',
    name: 'Grafite',
    description: 'Neutro e discreto, sem cor de destaque.',
    light: { accent: '#334155', themeColor: '#f7f8fa' },
    dark: { accent: '#e2e8f0', themeColor: '#0d0e10' },
  },
];

export const isPaletteId = (value: unknown): value is PaletteId => PALETTES.some((p) => p.id === value);

export const paletteById = (id: PaletteId): PaletteDefinition => PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;
