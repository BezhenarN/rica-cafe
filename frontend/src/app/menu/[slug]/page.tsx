import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { catalogApi } from '@/lib/api';
import { ProductDetailClient } from './product-detail-client';
import { JsonLd } from '@/components/seo/json-ld';

export const revalidate = 60;

/** Статические параметры для популярных slug'ов (остальные рендерятся on-demand). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await catalogApi.bySlug(slug);
    return {
      title: product.name,
      description: product.description ?? undefined,
      openGraph: { title: product.name, description: product.description ?? undefined },
    };
  } catch {
    return { title: 'Товар не найден' };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let product;
  try {
    product = await catalogApi.bySlug(slug);
  } catch {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: product.name,
    description: product.description ?? undefined,
    offers: {
      '@type': 'Offer',
      price: product.basePrice,
      priceCurrency: 'RUB',
      availability: product.isAvailable ? 'InStock' : 'OutOfStock',
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProductDetailClient product={product} />
    </>
  );
}
