'use client';

import { Search, SlidersHorizontal, Leaf, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { Category, ProductFilters } from '@/lib/types';

interface FiltersProps {
  categories: Category[];
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
}

const SORTS: { value: NonNullable<ProductFilters['sort']>; label: string }[] = [
  { value: 'popular', label: 'По популярности' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
  { value: 'name', label: 'По названию' },
];

export function Filters({ categories, filters, onChange }: FiltersProps) {
  const update = (patch: Partial<ProductFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-4">
      {/* Поиск */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={filters.q ?? ''}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Поиск блюда..."
          className="input pl-10"
        />
      </div>

      {/* Категории (чипы, скроллятся по горизонтали на мобиле) */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          onClick={() => update({ category: undefined })}
          className={cn('chip shrink-0', !filters.category && 'chip-active')}
        >
          Все
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => update({ category: c.slug })}
            className={cn('chip shrink-0', filters.category === c.slug && 'chip-active')}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Доп. фильтры + сортировка */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => update({ vegan: !filters.vegan })}
          className={cn('chip gap-1.5', filters.vegan && 'chip-active')}
        >
          <Leaf className="h-3.5 w-3.5" /> Веган
        </button>
        <button
          onClick={() => update({ spicy: !filters.spicy })}
          className={cn('chip gap-1.5', filters.spicy && 'chip-active')}
        >
          <Flame className="h-3.5 w-3.5" /> Острое
        </button>

        <div className="relative ml-auto flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted" />
          <select
            value={filters.sort ?? 'popular'}
            onChange={(e) => update({ sort: e.target.value as ProductFilters['sort'] })}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium outline-none focus:border-primary"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/** Пустое состояние каталога. */
export function EmptyCatalog({ query }: { query?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card flex flex-col items-center gap-2 py-16 text-center"
    >
      <span className="text-4xl">🔍</span>
      <p className="font-semibold">
        {query ? `Ничего не нашлось по запросу «${query}»` : 'Ничего не найдено'}
      </p>
      <p className="text-sm text-muted">Попробуйте изменить фильтры или поисковый запрос.</p>
    </motion.div>
  );
}
