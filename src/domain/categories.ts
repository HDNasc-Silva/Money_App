import type { Category } from '@/models';

/**
 * Ordem das categorias definida pelo usuário (arrastar e soltar, DT-025). Usada em toda tela que
 * lista categorias (cartões, seletor de lançamento, Ajustes) para que a ordem seja consistente.
 */
export function sortCategories(categories: readonly Category[]): Category[] {
  return [...categories].sort((a, b) => a.order - b.order);
}

/**
 * Reordena as categorias indicadas em `movedIds` (já na nova ordem relativa entre si) dentro do
 * array completo, preservando a posição das categorias que não fazem parte do arraste — elas
 * continuam exatamente onde estavam, apenas a fatia movida muda de lugar. Devolve o array completo
 * com o campo `order` renumerado sequencialmente (0, 1, 2…) a partir da ordem resultante.
 */
export function reorderCategories(categories: readonly Category[], movedIds: readonly string[]): Category[] {
  const sorted = sortCategories(categories);
  const byId = new Map(sorted.map((category) => [category.id, category]));
  // Ignora ids que não existem em `categories` para não desalinhar a lista de posições (`slots`)
  // com a lista de ids a colocar nelas.
  const knownMovedIds = movedIds.filter((id) => byId.has(id));
  const movedSet = new Set(knownMovedIds);
  const slots: number[] = [];
  sorted.forEach((category, index) => {
    if (movedSet.has(category.id)) slots.push(index);
  });
  const result = [...sorted];
  knownMovedIds.forEach((id, i) => {
    const category = byId.get(id);
    const slot = slots[i];
    if (category && slot !== undefined) result[slot] = category;
  });
  return result.map((category, index) => ({ ...category, order: index }));
}
