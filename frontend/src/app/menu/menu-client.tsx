'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Filters, EmptyCatalog } from '@/components/product/filters';
import { ProductCard } from '@/components/product/product-card';
import { ProductCardSkeleton } from '@/components/ui/skeleton';
import type { Category } from '@/lib/types';
import type { Product } from '@/lib/types';
import type { ProductFilters } from '@/lib/api';

export function MenuClient({
  categories,
  initialCategory,
  initialProducts,
}: {
  categories: Category[];
  initialCategory?: string;
  initialProducts?: Product[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ProductFilters>({
    category: initialCategory ?? undefined,
    q: searchParams.get('q') ?? undefined,
    sort: 'popular',
  });

  // Use server-loaded products as starting state
  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [isLoading, setIsLoading] = useState(false);

  // When filters change, fetch from API (only for client-side filter updates)
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.q) params.set('q', filters.q);
      if (filters.sort) params.set('sort', filters.sort);
      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        // If fetch fails, use initialProducts
        setProducts(initialProducts ?? []);
      }
      setIsLoading(false);
    };
    load();
  }, [filters, initialProducts]);

  const handleChange = (next: ProductFilters) => {
    setFilters(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next.category) params.set('category', next.category);
    else params.delete('category');
    if (next.q) params.set('q', next.q);
    else params.delete('q');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const isEmpty = !isLoading && products.length === 0;

  return (
    <div className="container-page space-y-6 py-6 sm:py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Меню</h1>
        <p className="text-sm text-muted">
          {products.length > 0 ? `${products.length} блюд в наличии` : isLoading ? 'Загрузка...' : 'Нет товаров'}
        </p>
      </header>

      <Filters categories={categories} filters={filters} onChange={handleChange} />

      {isLoading ? (
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
