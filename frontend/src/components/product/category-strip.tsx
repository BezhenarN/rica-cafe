'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Category } from '@/lib/types';

const ICONS: Record<string, string> = {
  pizza: '🍕',
  burgers: '🍔',
  snacks: '🍟',
  salads: '🥗',
  soups: '🍲',
  desserts: '🍰',
  drinks: '🥤',
};

/** Горизонтальная лента категорий на главной. */
export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Link
            href={`/menu?category=${c.slug}`}
            className="card flex items-center gap-3 p-4 transition hover:border-primary hover:shadow-pop"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
              {ICONS[c.slug] ?? '🍽️'}
            </span>
            <span className="font-semibold">{c.name}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
