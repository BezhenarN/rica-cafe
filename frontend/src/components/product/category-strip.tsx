'use client';

import Link from 'next/link';
import type { Category } from '@/lib/types';

const ICONS: Record<string, string> = {
  breakfast: '🍳',
  snacks: '🥘',
  salads: '🥗',
  soups: '🍲',
  pasta: '🍝',
  meat: '🥩',
  fish: '🐟',
  pizza: '🍕',
  burgers: '🍔',
  'caucasian-pastry': '🫓',
  sauces: '🫙',
  desserts: '🍰',
  bar: '🍺',
  drinks: '🥤',
};

// Отображаемые имена категорий (переопределяют DB-значения).
const CATEGORY_LABELS: Record<string, string> = {
  pizza: 'Пицца',
};

const HIGHLIGHT_SLUGS = ['breakfast', 'snacks'];

/** Горизонтальная лента категорий — обновлённый дизайн для «Рица». */
export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c, i) => {
        const isHighlight = HIGHLIGHT_SLUGS.includes(c.slug);
        const label = CATEGORY_LABELS[c.slug] ?? c.name;
        const icon = ICONS[c.slug] ?? '🍽️';

        /* ====== BREAKFAST: карточка с картинкой ====== */
        if (c.slug === 'breakfast') {
          return (
            <div
              key={c.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                href={`/menu?category=${c.slug}`}
                className="group relative flex h-28 sm:h-36 w-full items-start justify-end overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop hover:bg-surface/90"
              >
                <span className="absolute top-2 right-2 max-w-[50%] line-clamp-2 text-right text-base font-semibold text-ink">{label}</span>
                <img
                  src="/images/categories/breakfast.webp"
                  alt={label}
                  className="pointer-events-none h-36 w-36 sm:h-52 sm:w-52 -translate-x-[77px] sm:-translate-x-[109px] object-contain transition group-hover:scale-110"
                />
              </Link>
            </div>
          );
        }

        /* ====== SNACKS: карточка с картинкой ====== */
        if (c.slug === 'snacks') {
          return (
            <div
              key={c.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                href={`/menu?category=${c.slug}`}
                className="group relative flex h-28 sm:h-36 w-full items-start justify-end overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop hover:bg-surface/90"
              >
                <span className="absolute top-2 right-2 max-w-[50%] line-clamp-2 text-right text-base font-semibold text-ink">{label}</span>
                <img
                  src="/images/categories/snacks.webp"
                  alt={label}
                  className="pointer-events-none h-36 w-36 sm:h-52 sm:w-52 -translate-x-[77px] sm:-translate-x-[109px] object-contain transition group-hover:scale-110"
                />
              </Link>
            </div>
          );
        }

        /* ====== SALADS: карточка с картинкой ====== */
        if (c.slug === 'salads') {
          return (
            <div
              key={c.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                href={`/menu?category=${c.slug}`}
                className="group relative flex h-28 sm:h-36 w-full items-start justify-end overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop hover:bg-surface/90"
              >
                <span className="absolute top-2 right-2 max-w-[50%] line-clamp-2 text-right text-base font-semibold text-ink">{label}</span>
                <img
                  src="/images/categories/salads.webp"
                  alt={label}
                  className="pointer-events-none h-36 w-36 sm:h-52 sm:w-52 -translate-x-[77px] sm:-translate-x-[109px] object-contain transition group-hover:scale-110"
                />
              </Link>
            </div>
          );
        }

        /* ====== SOUPS: карточка с картинкой ====== */
        if (c.slug === 'soups') {
          return (
            <div
              key={c.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                href={`/menu?category=${c.slug}`}
                className="group relative flex h-28 sm:h-36 w-full items-start justify-end overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop hover:bg-surface/90"
              >
                <span className="absolute top-2 right-2 max-w-[50%] line-clamp-2 text-right text-base font-semibold text-ink">{label}</span>
                <img
                  src="/images/categories/soups.webp"
                  alt={label}
                  className="pointer-events-none h-36 w-36 sm:h-52 sm:w-52 -translate-x-[77px] sm:-translate-x-[109px] object-contain transition group-hover:scale-110"
                />
              </Link>
            </div>
          );
        }

        /* ====== PASTA: карточка с картинкой ====== */
        if (c.slug === 'pasta') {
          return (
            <div
              key={c.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                href={`/menu?category=${c.slug}`}
                className="group relative flex h-28 sm:h-36 w-full items-start justify-end overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop hover:bg-surface/90"
              >
                <span className="absolute top-2 right-2 max-w-[50%] line-clamp-2 text-right text-base font-semibold text-ink">{label}</span>
                <img
                  src="/images/categories/pasta.webp"
                  alt={label}
                  className="pointer-events-none h-36 w-36 sm:h-52 sm:w-52 -translate-x-[77px] sm:-translate-x-[109px] object-contain transition group-hover:scale-110"
                />
              </Link>
            </div>
          );
        }

        /* ====== MEAT: карточка с картинкой ====== */
        if (c.slug === 'meat') {
          return (
            <div
              key={c.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                href={`/menu?category=${c.slug}`}
                className="group relative flex h-28 sm:h-36 w-full items-start justify-end overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop hover:bg-surface/90"
              >
                <span className="absolute top-2 right-2 max-w-[50%] line-clamp-2 text-right text-base font-semibold text-ink">{label}</span>
                <img
                  src="/images/categories/meat.webp"
                  alt={label}
                  className="pointer-events-none h-36 w-36 sm:h-52 sm:w-52 -translate-x-[77px] sm:-translate-x-[109px] object-contain transition group-hover:scale-110"
                />
              </Link>
            </div>
          );
        }

        /* ====== FISH: карточка с картинкой ====== */
        if (c.slug === 'fish') {
          return (
            <div
              key={c.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                href={`/menu?category=${c.slug}`}
                className="group relative flex h-28 sm:h-36 w-full items-start justify-end overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop hover:bg-surface/90"
              >
                <span className="absolute top-2 right-2 max-w-[50%] line-clamp-2 text-right text-base font-semibold text-ink">{label}</span>
                <img
                  src="/images/categories/fish.webp"
                  alt={label}
                  className="pointer-events-none h-36 w-36 sm:h-52 sm:w-52 -translate-x-[77px] sm:-translate-x-[109px] object-contain transition group-hover:scale-110"
                />
              </Link>
            </div>
          );
        }

        /* ====== PIZZA: карточка с картинкой ====== */
        if (c.slug === 'pizza') {
          return (
            <div
              key={c.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                href={`/menu?category=${c.slug}`}
                className="group relative flex h-28 sm:h-36 w-full items-start justify-end overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop hover:bg-surface/90"
              >
                <span className="absolute top-2 right-2 max-w-[50%] line-clamp-2 text-right text-base font-semibold text-ink">{label}</span>
                <img
                  src="/images/categories/pizza.webp"
                  alt={label}
                  className="pointer-events-none h-36 w-36 sm:h-52 sm:w-52 -translate-x-[77px] sm:-translate-x-[109px] object-contain transition group-hover:scale-110"
                />
              </Link>
            </div>
          );
        }

        /* ====== BURGERS: карточка с картинкой ====== */
        if (c.slug === 'burgers') {
          return (
            <div
              key={c.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                href={`/menu?category=${c.slug}`}
                className="group relative flex h-28 sm:h-36 w-full items-start justify-end overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop hover:bg-surface/90"
              >
                <span className="absolute top-2 right-2 max-w-[50%] line-clamp-2 text-right text-base font-semibold text-ink">{label}</span>
                <img
                  src="/images/categories/burgers.webp"
                  alt={label}
                  className="pointer-events-none h-36 w-36 sm:h-52 sm:w-52 -translate-x-[77px] sm:-translate-x-[109px] object-contain transition group-hover:scale-110"
                />
              </Link>
            </div>
          );
        }

        /* ====== CAUCASIAN: карточка с картинкой ====== */
        if (c.slug === 'caucasian-pastry') {
          return (
            <div
              key={c.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                href={`/menu?category=${c.slug}`}
                className="group relative flex h-28 sm:h-36 w-full items-start justify-end overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop hover:bg-surface/90"
              >
                <span className="absolute top-2 right-2 max-w-[50%] line-clamp-2 text-right text-base font-semibold text-ink">{label}</span>
                <img
                  src="/images/categories/caucasian-pastry.webp"
                  alt={label}
                  className="pointer-events-none h-36 w-36 sm:h-52 sm:w-52 -translate-x-[77px] sm:-translate-x-[109px] object-contain transition group-hover:scale-110"
                />
              </Link>
            </div>
          );
        }

        /* ====== DESSERTS: карточка с картинкой ====== */
        if (c.slug === 'desserts') {
          return (
            <div
              key={c.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                href={`/menu?category=${c.slug}`}
                className="group relative flex h-28 sm:h-36 w-full items-start justify-end overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop hover:bg-surface/90"
              >
                <span className="absolute top-2 right-2 max-w-[50%] line-clamp-2 text-right text-base font-semibold text-ink">{label}</span>
                <img
                  src="/images/categories/desserts.webp"
                  alt={label}
                  className="pointer-events-none h-36 w-36 sm:h-52 sm:w-52 -translate-x-[77px] sm:-translate-x-[109px] object-contain transition group-hover:scale-110"
                />
              </Link>
            </div>
          );
        }

        /* ====== DRINKS: карточка с картинкой ====== */
        if (c.slug === 'drinks') {
          return (
            <div
              key={c.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                href={`/menu?category=${c.slug}`}
                className="group relative flex h-28 sm:h-36 w-full items-start justify-end overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop hover:bg-surface/90"
              >
                <span className="absolute top-2 right-2 max-w-[50%] line-clamp-2 text-right text-base font-semibold text-ink">{label}</span>
                <img
                  src="/images/categories/drinks.webp"
                  alt={label}
                  className="pointer-events-none h-36 w-36 sm:h-52 sm:w-52 -translate-x-[77px] sm:-translate-x-[109px] object-contain transition group-hover:scale-110"
                />
              </Link>
            </div>
          );
        }

        /* ====== ОСТАЛЬНЫЕ: как было, пока не переделаем ====== */
        return (
          <div
            key={c.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Link
              href={`/menu?category=${c.slug}`}
              className={`card flex items-center gap-3 p-4 transition hover:shadow-pop ${
                isHighlight
                  ? 'border-primary/30 bg-gradient-to-r from-primary/5 to-transparent'
                  : 'hover:border-primary'
              }`}
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                isHighlight
                  ? 'bg-primary/15 ring-2 ring-primary/20'
                  : 'bg-line'
              }`}>
                {icon}
              </span>
              <span className="line-clamp-2 break-words font-semibold">{label}</span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
