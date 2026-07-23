'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag } from 'lucide-react';
import { ProductImage } from '@/components/ui/product-image';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { formatPrice } from '@/lib/cn';
import { useCartStore } from '@/store/cart-store';

/** Список строк корзины + итоги. Используется в drawer и на странице /cart. */
export function CartContents({ onCheckout }: { onCheckout?: () => void }) {
  const lines = useCartStore((s) => s.lines);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const remove = useCartStore((s) => s.remove);
  const totalPrice = useCartStore((s) => s.totalPrice());

  const DELIVERY = 149;
  const FREE_FROM = 1500;
  const deliveryCost = totalPrice >= FREE_FROM || totalPrice === 0 ? 0 : DELIVERY;
  const total = totalPrice + deliveryCost;

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-line">
          <ShoppingBag className="h-7 w-7 text-muted" />
        </span>
        <h3 className="font-bold">Корзина пуста</h3>
        <p className="max-w-xs text-sm text-muted">
          Добавьте блюда из меню или соберите пиццу в конструкторе.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 divide-y divide-line overflow-y-auto">
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <motion.div
              key={l.uid}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="flex gap-3 p-4"
            >
              <ProductImage
                imageType={l.imageType as any}
                className="h-16 w-16 shrink-0"
              />
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold leading-tight">{l.title}</p>
                    {l.subtitle && <p className="text-xs text-muted">{l.subtitle}</p>}
                  </div>
                  <button
                    onClick={() => remove(l.uid)}
                    className="btn-ghost rounded-full p-1.5 text-muted hover:text-danger"
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <QuantityStepper
                    size="sm"
                    value={l.quantity}
                    onChange={(v) => (v > l.quantity ? increment(l.uid) : decrement(l.uid))}
                  />
                  <span className="text-sm font-bold">{formatPrice(l.unitPrice * l.quantity)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Итоги */}
      <div className="space-y-3 border-t border-line p-4">
        <Row label="Товары" value={formatPrice(totalPrice)} />
        <Row
          label="Доставка"
          value={deliveryCost === 0 ? 'Бесплатно' : formatPrice(deliveryCost)}
        />
        {totalPrice < FREE_FROM && totalPrice > 0 && (
          <p className="text-xs text-muted">
            До бесплатной доставки осталось {formatPrice(FREE_FROM - totalPrice)}
          </p>
        )}
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="font-bold">Итого</span>
          <span className="text-xl font-extrabold">{formatPrice(total)}</span>
        </div>
        {onCheckout && (
          <button onClick={onCheckout} className="btn-primary w-full">
            Оформить заказ
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
