import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/**
 * Arrastar e soltar para reordenar uma lista, com Pointer Events nativos (funciona com mouse e
 * toque, sem depender de biblioteca externa — ver DT-025). O item arrastado é identificado por
 * `data-drag-id` no elemento do cartão (usado para medir a posição de cada item durante o arraste);
 * a "alça" que inicia o arraste é um elemento separado, ligado via `getHandleProps`.
 *
 * `items` deve vir na ordem atual (ex.: já ordenada por `order`); ao soltar, `onReorder` recebe os
 * ids na nova ordem relativa entre si.
 */
export function useDragReorder<T>(
  items: readonly T[],
  getId: (item: T) => string,
  onReorder: (orderedIds: string[]) => void,
) {
  const [order, setOrder] = useState<string[]>(() => items.map(getId));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startOrderRef = useRef<string[]>([]);
  const draggingRef = useRef<string | null>(null);

  // Mantém a ordem local sincronizada quando a lista muda por fora (filtro, carregamento, etc.).
  // `items` é um array novo a cada render (filtros recalculados a cada chamada): a atualização de
  // estado só acontece quando os ids realmente mudam (a função abaixo devolve a mesma referência
  // quando a ordem é igual), para o efeito não causar um laço de re-renderizações.
  useEffect(() => {
    const next = items.map(getId);
    setOrder((current) => (current.length === next.length && current.every((id, i) => id === next[i]) ? current : next));
  }, [items, getId]);

  const byId = new Map(items.map((item) => [getId(item), item]));
  const orderedItems = order.map((id) => byId.get(id)).filter((item): item is T => Boolean(item));

  const reorderTo = (dragId: string, targetIndex: number) => {
    setOrder((current) => {
      const from = current.indexOf(dragId);
      const clamped = Math.max(0, Math.min(targetIndex, current.length - 1));
      if (from === -1 || from === clamped) return current;
      const next = [...current];
      next.splice(from, 1);
      next.splice(clamped, 0, dragId);
      return next;
    });
  };

  const handlePointerMove = (event: PointerEvent) => {
    const id = draggingRef.current;
    const container = containerRef.current;
    if (!id || !container) return;
    const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-drag-id]'));
    if (cards.length === 0) return;
    const y = event.clientY;
    let targetIndex = cards.length - 1;
    for (let i = 0; i < cards.length; i += 1) {
      const rect = cards[i]!.getBoundingClientRect();
      if (y < rect.top + rect.height / 2) {
        targetIndex = i;
        break;
      }
    }
    reorderTo(id, targetIndex);
  };

  const endDrag = () => {
    const id = draggingRef.current;
    draggingRef.current = null;
    setDraggingId(null);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', endDrag);
    document.removeEventListener('pointercancel', endDrag);
    if (!id) return;
    setOrder((current) => {
      if (current.join('|') !== startOrderRef.current.join('|')) onReorder(current);
      return current;
    });
  };

  const getHandleProps = (id: string) => ({
    onPointerDown: (event: ReactPointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      draggingRef.current = id;
      startOrderRef.current = order;
      setDraggingId(id);
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', endDrag);
      document.addEventListener('pointercancel', endDrag);
    },
  });

  const getCardProps = (id: string) => ({ 'data-drag-id': id });

  return { containerRef, orderedItems, getHandleProps, getCardProps, draggingId };
}
