import Link from 'next/link';
import { Clock, Truck, Star, MapPin, Calendar } from 'lucide-react';
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
  { icon: Truck, title: 'Бесплатная доставка', text: 'Доставка с 8:00 до 23:00' },
  { icon: MapPin, title: 'Самовывоз', text: 'Самовывоз — скидка 10%' },
  { icon: Calendar, title: 'Бронирование', text: 'Стол для теплой встречи или целый зал для вашего мероприятия' },
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
      {/* HERO + ПРЕИМУЩЕСТВА */}
      <section
        className="relative overflow-hidden rounded-3xl text-white"
        style={{ backgroundImage: "url('/mainrica.webp')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />
        <div className="relative z-10 px-6 pt-12 pb-8 text-white sm:px-12 sm:pt-16 sm:pb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Star className="h-3.5 w-3.5" /> Добро пожаловать!
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">
            Рица — от завтрака до праздничного банкета!
          </h1>
          <p className="mt-3 max-w-lg text-white/80 sm:text-lg">
            Завтраки, обеды, ужины, доставка по Сочи и банкетное меню для ваших праздников.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-3 px-6 pb-8 sm:gap-4 sm:px-12 sm:pb-10 lg:grid-cols-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm sm:p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold sm:text-base">{title}</h3>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">{text}</p>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      </section>

      {/* продолжает фон за счёт визуального continuity */}

      {/* КАТЕГОРИИ */}
      {categories.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold sm:text-2xl">Категории</h2>
            <Link href="/menu" className="text-sm font-medium text-primary hover:underline">
              Весь каталог →
            </Link>
          </div>
          <CategoryStrip
            categories={categories.filter((c) => !['bar', 'sauces'].includes(c.slug))}
          />
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
