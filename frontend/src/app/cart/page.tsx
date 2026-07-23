'use client';

import Link from 'next/link';
import { CartContents } from '@/components/cart/cart-contents';
import { useCartStore } from '@/store/cart-store';

export default function CartPage() {
  const count = useCartStore((s) => s.totalCount());

  return (
    <div className="container-page py-6 sm:py-8">
      <h1 className="mb-4 text-2xl font-extrabold sm:text-3xl">Корзина</h1>
      <div className="card mx-auto max-w-2xl">
        <CartContents onCheckout={count > 0 ? undefined : undefined} />
        {count > 0 && (
          <div className="border-t border-line p-4">
            <Link href="/checkout" className="btn-primary w-full">
              Оформить заказ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
