'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Flame, Leaf } from 'lucide-react';
import { ProductImage } from '@/components/ui/product-image';
import { Badge } from '@/components/ui/badge';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { formatPrice } from '@/lib/cn';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { showToast } from '@/components/ui/toast';
import type { Product } from '@/lib/types';

export function ProductDetailClient({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(
    product.variants.find((v) => v.isDefault)?.id ?? product.variants[0]?.id,
  );
  const [qty, setQty] = useState(1);
  const addCatalogItem = useCartStore((s) => s.addCatalogItem);
  const openCart = useUIStore((s) => s.openCart);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const price = variant ? Number(variant.price) : Number(product.basePrice);

  const handleAdd = () => {
    if (!variant) return;
    addCatalogItem({
      title: product.name,
      subtitle: variant.name,
      unitPrice: Number(variant.price),
      imageType: product.imageType,
      imagePath: product.imagePath,
      productId: product.id,
      variantName: variant.name,
      quantity: qty,
    });
    showToast('Добавлено в корзину', 'success');
    openCart();
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <Link
        href="/menu"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Назад в меню
      </Link>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <ProductImage
            imageType={product.imageType}
            name={product.name}
            imagePath={product.imagePath}
            productId={product.id}
            className="aspect-square w-full"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
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
        </motion.div>

        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{product.name}</h1>
            {product.description && (
              <p className="mt-2 text-muted">{product.description}</p>
            )}
            <div className="mt-3 flex gap-4 text-sm text-muted">
              {product.weight && <span>{product.weight} г</span>}
              {product.kcal && <span>{product.kcal} ккал</span>}
            </div>
          </div>

          {product.variants.length > 1 && (
            <div className="space-y-2">
              <span className="text-sm font-semibold">Размер / вариант</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      v.id === variantId
                        ? 'border-primary bg-primary text-white'
                        : 'border-line bg-surface hover:border-primary'
                    }`}
                  >
                    <div>{v.name}</div>
                    <div className={`text-xs ${v.id === variantId ? 'text-white/80' : 'text-muted'}`}>
                      {formatPrice(v.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <QuantityStepper value={qty} onChange={setQty} />
            <button onClick={handleAdd} className="btn-primary flex-1 sm:flex-none">
              <Plus className="h-4 w-4" /> В корзину · {formatPrice(price * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
