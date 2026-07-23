'use client';

import { useAdminUpdateOrderStatus } from '@/hooks/use-queries';
import { cn } from '@/lib/cn';
import { ORDER_FLOW, CANCELED_META } from '@/lib/order-status';
import type { OrderStatus } from '@/lib/types';

/**
 * Ряд кнопок для смены статуса заказа в админке.
 * Каждое нажатие пушит апдейт через WS-гейтвей → клиентский трекинг обновляется.
 */
const NEXT_STATUSES: { status: OrderStatus; label: string }[] = [
  ...ORDER_FLOW.map((s) => ({ status: s.status, label: s.meta.label })),
  { status: 'CANCELED', label: CANCELED_META.label },
];

export function OrderStatusManager({ orderId, current }: { orderId: string; current: OrderStatus }) {
  const mutation = useAdminUpdateOrderStatus();

  return (
    <div className="flex flex-wrap gap-1.5">
      {NEXT_STATUSES.map(({ status, label }) => {
        const active = status === current;
        const canceled = status === 'CANCELED';
        return (
          <button
            key={status}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id: orderId, status })}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition',
              active
                ? canceled
                  ? 'bg-danger text-white'
                  : 'bg-primary text-white'
                : canceled
                  ? 'border border-danger/30 text-danger hover:bg-danger/10'
                  : 'border border-line text-muted hover:border-primary hover:text-primary',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
