'use client';

import Link from 'next/link';
import { CartContents } from '@/components/cart/cart-contents';
import { useCartStore } from '@/store/cart-store';

export default function CartPage() {
  const count = useCartStore((s) => s.totalCount());

  return (
    <div className="container-page py-6 sm:py-8">
      <h1 className="mb-4 text-2xl font-extrabold sm:text-3xl">Корзина</h1>

      {count === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-muted">В корзине пока ничего нет.</p>
          <Link href="/menu" className="btn-primary">Перейти в меню</Link>
        </div>
      ) : (
        <div className="card mx-auto max-w-2xl">
          {/*
            Не передаём onCheckout — на отдельной странице корзины навигация на чекаут
            идёт через ссылку-кнопку ниже. CartContents.onCheckout нужен только для drawer.
          */}
          <CartContents />
          <div className="border-t border-line p-4">
            <Link href="/checkout" className="btn-primary w-full">
              Оформить заказ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
