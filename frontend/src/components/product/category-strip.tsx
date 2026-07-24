'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Category } from '@/lib/types';

const ICONS: Record<string, string> = {
  suvlaki: '🌯',
  seafood: '🦐',
  georgian: '🫓',
  pizza: '🍕',
  burgers: '🍔',
  snacks: '🍟',
  salads: '🥗',
  soups: '🍲',
  desserts: '🍰',
  drinks: '🥤',
  kids: '🧒',
};

const HIGHLIGHT_SLUGS = ['suvlaki', 'seafood', 'georgian'];

/** Горизонтальная лента категорий — обновлённый дизайн для «Рица». */
export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c, i) => {
        const isHighlight = HIGHLIGHT_SLUGS.includes(c.slug);
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
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
                {ICONS[c.slug] ?? '🍽️'}
              </span>
              <span className="font-semibold">{c.name}</span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
