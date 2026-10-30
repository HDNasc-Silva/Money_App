export interface NavItem {
  to: string;
  label: string;
  /** Rótulo curto usado na barra inferior do mobile. */
  shortLabel: string;
  icon: string;
  title: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Visão Geral', shortLabel: 'Início', icon: 'grid_view', title: 'Início' },
  { to: '/lancamentos', label: 'Lançamentos', shortLabel: 'Extrato', icon: 'receipt_long', title: 'Lançamentos' },
  { to: '/categorias', label: 'Categorias', shortLabel: 'Gastos', icon: 'category', title: 'Categorias' },
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

export function titleForPath(pathname: string): string {
  const item = [...NAV_ITEMS, SETTINGS_ITEM].find((i) => (i.to === '/' ? pathname === '/' : pathname.startsWith(i.to)));
  return item?.title ?? 'Money App';
}
