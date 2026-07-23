import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CatalogItemInput, CustomPizzaInput } from '@/lib/api';

/**
 * Элемент корзины. Может быть:
 *  - catalog: товар из каталога с выбранным вариантом
 *  - pizza: сконструированная пицца (расчёт цены на сервере при оформлении)
 */
export interface CartLine {
  uid: string; // локальный идентификатор строки
  kind: 'catalog' | 'pizza';
  // Общие
  title: string;
  subtitle?: string;
  unitPrice: number; // для отображения; реальные цены пересчитает бэкенд
  imageType?: string;
  quantity: number;
  // Для catalog
  productId?: string;
  variantName?: string;
  // Для pizza
  pizzaConfig?: CustomPizzaInput;
}

interface CartState {
  lines: CartLine[];
  // Действия
  addCatalogItem: (item: Omit<CartLine, 'uid' | 'kind' | 'quantity'> & { quantity?: number }) => void;
  addPizza: (item: Omit<CartLine, 'uid' | 'kind' | 'quantity'> & {
    pizzaConfig: CustomPizzaInput;
    quantity?: number;
  }) => void;
  setQuantity: (uid: string, quantity: number) => void;
  increment: (uid: string) => void;
  decrement: (uid: string) => void;
  remove: (uid: string) => void;
  clear: () => void;
  // Селекторы
  totalCount: () => number;
  totalPrice: () => number;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Ключ для дедупликации строк каталога (один товар + один вариант = одна строка). */
function catalogKey(productId?: string, variantName?: string) {
  return `catalog:${productId ?? '?'}:${variantName ?? '?'}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      addCatalogItem: ({ quantity = 1, ...rest }) =>
        set((state) => {
          const key = catalogKey(rest.productId, rest.variantName);
          const idx = state.lines.findIndex(
            (l) => l.kind === 'catalog' && catalogKey(l.productId, l.variantName) === key,
          );
          if (idx >= 0) {
            const lines = [...state.lines];
            lines[idx] = { ...lines[idx], quantity: lines[idx].quantity + quantity };
            return { lines };
          }
          return {
            lines: [...state.lines, { uid: uid(), kind: 'catalog' as const, quantity, ...rest }],
          };
        }),

      addPizza: ({ quantity = 1, ...rest }) =>
        set((state) => ({
          // Каждая пицца — отдельная строка (даже при одинаковом составе это нагляднее).
          lines: [...state.lines, { uid: uid(), kind: 'pizza' as const, quantity, ...rest }],
        })),

      setQuantity: (id, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (l.uid === id ? { ...l, quantity: Math.max(0, quantity) } : l))
            .filter((l) => l.quantity > 0),
        })),

      increment: (id) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.uid === id ? { ...l, quantity: l.quantity + 1 } : l)),
        })),

      decrement: (id) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (l.uid === id ? { ...l, quantity: l.quantity - 1 } : l))
            .filter((l) => l.quantity > 0),
        })),

      remove: (id) => set((state) => ({ lines: state.lines.filter((l) => l.uid !== id) })),

      clear: () => set({ lines: [] }),

      totalCount: () => get().lines.reduce((s, l) => s + l.quantity, 0),
      totalPrice: () => get().lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    }),
    {
      name: 'crudo-cart',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as unknown as Storage))),
    },
  ),
);

/** Преобразует строки корзины в payload для POST /orders. */
export function cartToOrderPayload(lines: CartLine[]): {
  items?: CatalogItemInput[];
  pizzas?: CustomPizzaInput[];
} {
  const items: CatalogItemInput[] = [];
  const pizzas: CustomPizzaInput[] = [];
  for (const l of lines) {
    if (l.kind === 'catalog' && l.productId && l.variantName) {
      items.push({ productId: l.productId, variantName: l.variantName, quantity: l.quantity });
    } else if (l.kind === 'pizza' && l.pizzaConfig) {
      pizzas.push({ ...l.pizzaConfig, quantity: l.quantity });
    }
  }
  const out: { items?: CatalogItemInput[]; pizzas?: CustomPizzaInput[] } = {};
  if (items.length) out.items = items;
  if (pizzas.length) out.pizzas = pizzas;
  return out;
}
