'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Plus, Flame, Leaf } from 'lucide-react';
import { ProductImage } from '@/components/ui/product-image';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/cn';
import { useCartStore } from '@/store/cart-store';
import { showToast } from '@/components/ui/toast';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addCatalogItem = useCartStore((s) => s.addCatalogItem);
  const ref = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);

  // Lightweight IntersectionObserver — no framer-motion, no hydration mismatch
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '-40px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Дефолтный вариант — для быстрого добавления из карточки.
  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const price = defaultVariant ? Number(defaultVariant.price) : Number(product.basePrice);

  const handleQuickAdd = () => {
    if (!defaultVariant) return;
    addCatalogItem({
      title: product.name,
      subtitle: defaultVariant.name,
      unitPrice: Number(defaultVariant.price),
      imageType: product.imageType,
      imagePath: product.imagePath,
      productId: product.id,
      variantName: defaultVariant.name,
    });
    showToast('Добавлено в корзину', 'success');
  };

  return (
    <article
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
      className="card group flex flex-col overflow-hidden"
    >
      <Link href={`/menu/${product.slug}`} className="relative block">
        <ProductImage
          imageType={product.imageType}
          name={product.name}
          imagePath={product.imagePath}
          productId={product.id}
          className="aspect-[4/3] w-full rounded-b-none"
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {product.isSpicy && (
            <Badge variant="danger" className="gap-1">
              <Flame className="h-3 w-3" /> Острое
            </Badge>
          )}
          {product.isVegan && (
            <Badge variant="success" className="gap-1">
              <Leaf className="h-3 w-3" /> Веган
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/menu/${product.slug}`} className="space-y-1">
          <h3 className="line-clamp-1 font-semibold">{product.name}</h3>
          {product.description && (
            <p className="line-clamp-2 text-xs text-muted">{product.description}</p>
          )}
        </Link>

        {product.variants.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {product.variants.map((v) => (
              <span key={v.id} className="rounded-md bg-line px-1.5 py-0.5 text-[11px] text-muted">
                {v.name} · {formatPrice(v.price)}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-bold">{formatPrice(price)}</span>
          <button
            onClick={handleQuickAdd}
            disabled={!defaultVariant}
            className="btn-primary h-9 w-9 rounded-full p-0"
            aria-label="Добавить в корзину"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
