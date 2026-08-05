import Link from 'next/link';
import { ArrowRight, Clock, Truck, Pizza as PizzaIcon, MapPin, ShoppingBag } from 'lucide-react';
import type { Metadata } from 'next';
import { CategoryStrip } from '@/components/product/category-strip';
import { ProductCard } from '@/components/product/product-card';
import type { Category, Product } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Рица — кафе и доставка, Сочи',
  description:
    'Кафе «Рица» в Сочи: завтраки, закуски, салаты, супы, мясо, рыба, паста, бургеры, кавказская выпечка, соусы, десерты и напитки. Доставка и самовывоз.',
};

const PERKS = [
  { icon: Clock, title: '30–45 минут', text: 'Доставляем быстро и в горячем виде' },
  { icon: Truck, title: 'Бесплатно от 1500 ₽', text: 'Иначе доставка — 149 ₽' },
  { icon: MapPin, title: 'Доставка и самовывоз', text: 'Выберите удобный способ получения' },
  { icon: ShoppingBag, title: 'Честные цены', text: 'Пересчёт стоимости на сервере' },
];

/** Force dynamic: SSR on every request, no ISR cache with stale JSON. */
export const dynamic = 'force-dynamic';

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`http://127.0.0.1:3000${url}`, {
      cache: 'no-store',
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as unknown as T;
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const categories: Category[] = await safeFetch<Category[]>('/api/categories', []);
  const featured: Product[] = await safeFetch<Product[]>('/api/products/featured', []);

  return (
    <div className="container-page space-y-16 py-6 sm:py-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-white sm:px-12 sm:py-16">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Truck className="h-3.5 w-3.5" /> Доставка по Сочи · 30–45 минут
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">
            Кафе «Рица» — доставка, завтраки и всё меню
          </h1>
          <p className="mt-3 max-w-lg text-white/80 sm:text-lg">
            Завтраки, закуски, салаты, супы, мясо, рыба, паста, бургеры, кавказская выпечка и напитки. Доставка и самовывоз по Сочи.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/menu" className="btn bg-white text-primary hover:bg-white/90">
              Перейти в меню <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pizza-builder"
              className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <PizzaIcon className="h-4 w-4" /> Собрать пиццу
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      </section>

      {/* ПРЕИМУЩЕСТВА */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-4 sm:p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold sm:text-base">{title}</h3>
            <p className="mt-1 text-xs text-muted sm:text-sm">{text}</p>
          </div>
        ))}
      </section>

      {/* КАТЕГОРИИ */}
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

      {/* ХИТЫ */}
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
    </div>
  );
}
