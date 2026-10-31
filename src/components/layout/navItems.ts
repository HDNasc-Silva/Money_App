export interface NavItem {
  to: string;
  label: string;
  /** Rótulo curto usado na barra inferior do mobile. */
  shortLabel: string;
  icon: string;
  title: string;
}

/** Todos os destinos do app (usados pela navegação lateral, que tem espaço para mostrá-los todos). */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Visão Geral', shortLabel: 'Início', icon: 'grid_view', title: 'Início' },
  { to: '/lancamentos', label: 'Lançamentos', shortLabel: 'Extrato', icon: 'receipt_long', title: 'Lançamentos' },
  { to: '/categorias', label: 'Categorias', shortLabel: 'Gastos', icon: 'category', title: 'Categorias' },
  { to: '/assinaturas', label: 'Assinaturas', shortLabel: 'Assinaturas', icon: 'subscriptions', title: 'Assinaturas' },
  { to: '/metas', label: 'Metas', shortLabel: 'Metas', icon: 'flag', title: 'Metas' },
  { to: '/relatorios', label: 'Relatórios', shortLabel: 'Gráficos', icon: 'analytics', title: 'Relatórios' },
];

export const SETTINGS_ITEM: NavItem = {
  to: '/ajustes',
  label: 'Ajustes',
  shortLabel: 'Ajustes',
  icon: 'tune',
  title: 'Ajustes',
};

export const MORE_ITEM: NavItem = {
  to: '/mais',
  label: 'Mais',
  shortLabel: 'Mais',
  icon: 'apps',
  title: 'Mais',
};

/**
 * Destinos principais da barra inferior (mobile/tablet), ver DT-021: os itens de uso mais
 * frequente a um toque, e o restante agrupado em "Mais". Os `to` seguem `NAV_ITEMS`.
 */
export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  NAV_ITEMS[0]!, // Início
  NAV_ITEMS[1]!, // Extrato
  NAV_ITEMS[4]!, // Metas
];

export interface MoreNavEntry {
  item: NavItem;
  description: string;
}

export interface MoreNavGroup {
  title: string;
  entries: readonly MoreNavEntry[];
}

/** Agrupamento do hub "Mais" (DT-021): dinheiro saindo, acompanhar e conta. */
export const MORE_NAV_GROUPS: readonly MoreNavGroup[] = [
  {
    title: 'Dinheiro saindo',
    entries: [
      { item: NAV_ITEMS[2]!, description: 'Limites por categoria e gasto do mês' },
      { item: NAV_ITEMS[3]!, description: 'Cobranças recorrentes e próximos vencimentos' },
    ],
  },
  {
    title: 'Acompanhar',
    entries: [{ item: NAV_ITEMS[5]!, description: 'Evolução das metas, receitas e despesas' }],
  },
  {
    title: 'Conta',
    entries: [{ item: SETTINGS_ITEM, description: 'Perfil, aparência, categorias e seus dados' }],
  },
];

export function titleForPath(pathname: string): string {
  const item = [...NAV_ITEMS, SETTINGS_ITEM, MORE_ITEM].find((i) =>
    i.to === '/' ? pathname === '/' : pathname.startsWith(i.to),
  );
  return item?.title ?? 'Money App';
}
