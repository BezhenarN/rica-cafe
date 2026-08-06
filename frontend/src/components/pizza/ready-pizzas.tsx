'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/product/product-card';
import { ProductCardSkeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';

export function ReadyPizzas() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/products?category=pizza&sort=name');
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setProducts([]);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  return (
    <section className="container-page grid gap-6 py-8 lg:grid-cols-[1fr_360px] lg:py-10">
      {/* Содержимое — на всю ширину, как у конструктора */}
      <div className="space-y-6 lg:col-span-2">
        <header className="space-y-1">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Готовые пиццы</h2>
          <p className="text-sm text-muted">
            {products.length > 0
              ? `${products.length} пицц на выбор`
              : isLoading
                ? 'Загрузка...'
                : 'Нет готовых пицц'}
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-sm text-muted py-8">Пока нет готовых пицц</p>
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

      {/* Пустой сайдбар для выравнивания по сетке — как у конструктора */}
      <aside className="lg:sticky lg:top-20 lg:self-start" />
    </section>
  );
}
