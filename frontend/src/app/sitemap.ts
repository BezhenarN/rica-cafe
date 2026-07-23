import type { MetadataRoute } from 'next';
import { catalogApi } from '@/lib/api';

const BASE = 'https://crudo.example.com';

/** Генерирует sitemap.xml динамически на основе товаров из БД. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/menu`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/pizza-builder`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  try {
    const products = await catalogApi.products();
    const dynamic: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${BASE}/menu/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    return [...staticRoutes, ...dynamic];
  } catch {
    return staticRoutes;
  }
}
