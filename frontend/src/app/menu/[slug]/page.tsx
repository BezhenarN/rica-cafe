import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from './product-detail-client';
import { JsonLd } from '@/components/seo/json-ld';

export const revalidate = 60;

/**
 * В standalone-билде ky ломает SSR — он идёт через HTTP к 127.0.0.1:3000,
 * чего нет внутри процесса next-server. Директный fetch работает нативно,
 * потому что Next.js маршрутизирует его к route handler'ам.
 */
async function fetchProduct(slug: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:3000'}/api/products/${slug}`, {
    cache: 'force-cache',
    next: { revalidate },
  });
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

/** Статические параметры для популярных slug'ов (остальные рендерятся on-demand). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await fetchProduct(slug);
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
    product = await fetchProduct(slug);
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
