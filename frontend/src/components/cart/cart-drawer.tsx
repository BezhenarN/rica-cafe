'use client';

import { useRouter } from 'next/navigation';
import { Sheet } from '@/components/ui/sheet';
import { CartContents } from './cart-contents';
import { useUIStore } from '@/store/ui-store';

/** Выезжающая корзина. Снизу на мобиле, справа на десктопе. */
export function CartDrawer() {
  const { cartOpen, closeCart } = useUIStore();
  const router = useRouter();

  const goCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  return (
    <Sheet open={cartOpen} onClose={closeCart} title="Корзина" side="right">
      <div className="h-[calc(100vh-4rem)]">
        <CartContents onCheckout={goCheckout} />
      </div>
    </Sheet>
  );
}
