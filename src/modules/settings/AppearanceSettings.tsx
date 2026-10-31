import type { ReactNode } from 'react';
import { Card, CardHeader } from '@/components/common/Card';
import { Icon } from '@/components/common/Icon';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { PALETTES } from '@/theme/palettes';
import { MODE_LABELS, TEXT_SIZE_LABELS, type TextSize, type ThemeMode } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import styles from './Appearance.module.css';

const MODE_OPTIONS = (['light', 'dark', 'system'] as const satisfies readonly ThemeMode[]).map((value) => ({
  value,
  label: MODE_LABELS[value],
}));
const TEXT_SIZE_OPTIONS = (['normal', 'large'] as const satisfies readonly TextSize[]).map((value) => ({
  value,
  label: TEXT_SIZE_LABELS[value],
}));

const PREVIEW_BARS = ['60%', '90%', '45%', '75%'];

/** Mini cartão de saldo + botão, renderizado com os tokens da paleta (escopo por data-attributes). */
function PalettePreview({ palette, theme }: { palette: string; theme: string }) {
  return (
    <span className={styles.preview} data-theme={theme} data-palette={palette} aria-hidden="true">
      <span className={styles.previewHero}>
        <span className={styles.previewLabel}>Saldo</span>
        <span className={styles.previewValue}>R$ 4.250</span>
      </span>
      <span className={styles.previewFooter}>
        <span className={styles.previewButton}>+ Lançar</span>
        <span className={styles.previewBars}>
          {PREVIEW_BARS.map((height, i) => (
            <span key={height} style={{ background: `var(--chart-${i + 1})`, height }} />
          ))}
        </span>
      </span>
    </span>
  );
}

/** Ajustes → Aparência: paleta (tema de cores), modo claro/escuro/automático e tamanho do texto. */
export function AppearanceSettings({ children }: { children?: ReactNode }) {
  const { theme, mode, palette, textSize, setMode, setPalette, setTextSize } = useTheme();
  return (
    <Card>
      <CardHeader title="Aparência" subtitle="Deixe o app com a sua cara. A escolha fica salva neste dispositivo." />

      <div className={styles.group}>
        <span className={styles.groupLabel} id="palette-label">
          Tema de cores
        </span>
        <div role="radiogroup" aria-labelledby="palette-label" className={styles.paletteGrid}>
          {PALETTES.map((p) => {
            const selected = p.id === palette;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={[styles.paletteOption, selected && styles.paletteSelected].filter(Boolean).join(' ')}
                onClick={() => setPalette(p.id)}
              >
                <PalettePreview palette={p.id} theme={theme} />
                <span className={styles.paletteName}>
                  {p.name}
                  {selected && <Icon name="check_circle" size={16} filled />}
                </span>
                <span className={styles.paletteDescription}>{p.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.groupLabel}>Modo</span>
        <SegmentedControl label="Modo de cor" options={MODE_OPTIONS} value={mode} onChange={setMode} />
        {mode === 'system' && <p className={styles.hint}>Acompanha o modo claro/escuro do seu celular ou computador.</p>}
      </div>

      <div className={styles.group}>
        <span className={styles.groupLabel}>Tamanho do texto</span>
        <SegmentedControl label="Tamanho do texto" options={TEXT_SIZE_OPTIONS} value={textSize} onChange={setTextSize} />
      </div>

      {children}
    </Card>
  );
}
