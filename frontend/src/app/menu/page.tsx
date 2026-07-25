import type { Metadata } from 'next';
import { MenuClient } from './menu-client';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Меню — каталог блюд',
  description: 'Пицца, бургеры, салаты, супы, десерты и напитки с доставкой. Фильтры и поиск.',
};

export const revalidate = 60;

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string; vegan?: string; spicy?: string }>;
}) {
  const sp = await searchParams;
  const cats = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });

  let products: any[] = [];
  try {
    const where: Record<string, unknown> = { isAvailable: true };
    if (sp.category) where.category = { slug: sp.category };
    if (sp.vegan === 'true') where.isVegan = true;
    if (sp.spicy === 'true') where.isSpicy = true;
    if (sp.q) where.OR = [
      { name: { contains: sp.q, mode: 'insensitive' as const } },
      { description: { contains: sp.q, mode: 'insensitive' as const } },
    ];

    const orderBy: Record<string, unknown>[] = (() => {
      switch (sp.sort) {
        case 'price_asc': return [{ basePrice: 'asc' }];
        case 'price_desc': return [{ basePrice: 'desc' }];
        case 'name': return [{ name: 'asc' }];
        default: return [{ isFeatured: 'desc' }, { sortOrder: 'asc' }];
      }
    })();

    products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { orderBy: { price: 'asc' } },
      },
    });
  } catch {
    products = [];
  }

  return <MenuClient categories={cats} initialCategory={sp.category} initialProducts={products} />;
}
