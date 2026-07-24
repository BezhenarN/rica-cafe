'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CategoryStrip } from '@/components/product/category-strip';
import { ProductCard } from '@/components/product/product-card';
import type { Category, Product } from '@/lib/types';

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch('http://localhost:3001/api/categories');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchFeatured(): Promise<Product[]> {
  try {
    const res = await fetch('http://localhost:3001/api/products/featured');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export function HomeHero() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCategories(), fetchFeatured()]).then(([cats, feat]) => {
      if (!cancelled) {
        setCategories(Array.isArray(cats) ? cats : []);
        setFeatured(Array.isArray(feat) ? feat : []);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold sm:text-2xl">Популярное</h2>
          <Link href="/menu" className="text-sm font-medium text-primary hover:underline">
            Смотреть все →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card flex flex-col animate-pulse">
              <div className="aspect-[4/3] w-full bg-line/50" />
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="h-4 w-3/4 rounded bg-line/50" />
                <div className="h-3 w-full rounded bg-line/50" />
                <div className="mt-auto h-5 w-20 rounded bg-line/50" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      {categories.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold sm:text-2xl">Категории</h2>
            <Link href="/menu" className="text-sm font-medium text-primary hover:underline">
              Весь каталог →
            </Link>
          </div>
          <CategoryStrip categories={categories} />
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold sm:text-2xl">Популярное</h2>
          <Link href="/menu" className="text-sm font-medium text-primary hover:underline">
            Смотреть все →
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-muted">Загружаем популярное…</p>
        )}
      </section>
    </>
  );
}
