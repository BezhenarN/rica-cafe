'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useProducts } from '@/hooks/use-queries';
import { Filters, EmptyCatalog } from '@/components/product/filters';
import { ProductCard } from '@/components/product/product-card';
import { ProductCardSkeleton } from '@/components/ui/skeleton';
import type { Category, ProductFilters } from '@/lib/types';

export function MenuClient({
  categories,
  initialCategory,
}: {
  categories: Category[];
  initialCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ProductFilters>({
    category: initialCategory ?? undefined,
    q: searchParams.get('q') ?? undefined,
    sort: 'popular',
  });

  // Дебаунс поиска — простой useMemo по q.slice (хук ниже ограничивает refetch).
  const query = useProducts(filters);

  const handleChange = (next: ProductFilters) => {
    setFilters(next);
    // Синхронизируем категорию с URL (для шаринга/SEO).
    const params = new URLSearchParams(searchParams.toString());
    if (next.category) params.set('category', next.category);
    else params.delete('category');
    if (next.q) params.set('q', next.q);
    else params.delete('q');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const products = query.data ?? [];
  const isEmpty = !query.isLoading && products.length === 0;

  return (
    <div className="container-page space-y-6 py-6 sm:py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Меню</h1>
        <p className="text-sm text-muted">
          {products.length > 0 ? `${products.length} блюд в наличии` : 'Загрузка...'}
        </p>
      </header>

      <Filters categories={categories} filters={filters} onChange={handleChange} />

      {query.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyCatalog query={filters.q} />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
