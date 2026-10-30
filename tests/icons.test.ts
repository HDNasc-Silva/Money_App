import { describe, expect, it } from 'vitest';
import { ICON_CATALOG, iconLabel, searchIcons } from '@/design-system/icons';
import { buildDefaultCategories } from '@/store/defaultCategories';
import { buildDemoData } from '@/store/demoData';

const names = (query: string) => searchIcons(query).map((option) => option.name);

describe('catálogo de ícones', () => {
  it('tem pelo menos 80 ícones e nenhum nome duplicado', () => {
    const all = ICON_CATALOG.map((option) => option.name);
    expect(all.length).toBeGreaterThanOrEqual(80);
    expect(new Set(all).size).toBe(all.length);
  });

  it('todo ícone tem rótulo e palavras-chave', () => {
    for (const option of ICON_CATALOG) {
      expect(option.label.trim()).not.toBe('');
      expect(option.keywords.length).toBeGreaterThan(0);
      expect(option.name).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it('inclui os ícones usados pelas categorias padrão e pelas metas de demonstração', () => {
    const used = [
      ...buildDefaultCategories('').map((c) => c.icon),
      ...buildDemoData('2026-10-30').goals.map((g) => g.icon),
    ];
    const catalog = new Set(ICON_CATALOG.map((option) => option.name));
    for (const name of used) expect(catalog.has(name)).toBe(true);
  });
});

describe('searchIcons', () => {
  it('busca vazia devolve o catálogo inteiro', () => {
    expect(searchIcons('')).toHaveLength(ICON_CATALOG.length);
    expect(searchIcons('   ')).toHaveLength(ICON_CATALOG.length);
  });

  it('ignora acentos e maiúsculas', () => {
    expect(names('saúde')).toContain('health_and_safety');
    expect(names('SAUDE')).toContain('health_and_safety');
    expect(names('Ônibus')).toEqual(names('onibus'));
    expect(names('onibus')).toContain('directions_bus');
  });

  it('encontra por palavra-chave e pelo nome do ícone', () => {
    expect(names('cachorro')).toEqual(['pets']);
    expect(names('gasolina')).toContain('local_gas_station');
    expect(names('gas station')).toContain('local_gas_station');
  });

  it('exige todos os termos', () => {
    expect(names('viagem mala')).toEqual(['luggage']);
  });

  it('devolve vazio quando nada corresponde', () => {
    expect(searchIcons('xyzabc')).toEqual([]);
  });

  it('respeita um subconjunto do catálogo', () => {
    const subset = ICON_CATALOG.filter((option) => option.name === 'pets' || option.name === 'home');
    expect(searchIcons('', subset)).toHaveLength(2);
    expect(searchIcons('casa', subset).map((o) => o.name)).toEqual(['home']);
  });
});

describe('iconLabel', () => {
  it('usa o rótulo em português e cai para o nome legível fora do catálogo', () => {
    expect(iconLabel('pets')).toBe('Pets');
    expect(iconLabel('icone_inexistente')).toBe('icone inexistente');
  });
});
