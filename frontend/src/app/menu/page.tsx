import type { Metadata } from 'next';
import { MenuClient } from './menu-client';
import { catalogApi } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Меню — каталог блюд',
  description: 'Пицца, бургеры, салаты, супы, десерты и напитки с доставкой. Фильтры и поиск.',
};

// Категории тянем на сервере (для SEO и быстрого first paint).
export const revalidate = 60;

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const categories = await catalogApi.categories().catch(() => []);
  return <MenuClient categories={categories} initialCategory={sp.category} />;
}
