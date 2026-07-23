'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ORDER_FLOW, CANCELED_META } from '@/lib/order-status';
import { cn } from '@/lib/cn';
import type { OrderStatus } from '@/lib/types';

/**
 * Вертикальный таймлайн статусов заказа с анимацией прогресса.
 */
export function OrderTracker({ status }: { status: OrderStatus }) {
  const canceled = status === 'CANCELED';
  const currentIdx = canceled ? -1 : ORDER_FLOW.findIndex((s) => s.status === status);

  return (
    <div className="space-y-1">
      {ORDER_FLOW.map((step, idx) => {
        const done = !canceled && idx < currentIdx;
        const active = !canceled && idx === currentIdx;
        const future = !canceled && idx > currentIdx;

        return (
          <div key={step.status} className="flex gap-3">
            {/* Маркер + соединительная линия */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: active ? 1.1 : 1,
                  backgroundColor: done || active ? '#0D5C57' : '#ECECE6',
                }}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-white',
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm">{step.meta.emoji}</span>
                )}
              </motion.div>
              {idx < ORDER_FLOW.length - 1 && (
                <div className="relative my-1 h-10 w-0.5 bg-line">
                  <motion.div
                    initial={false}
                    animate={{ height: done ? '100%' : '0%' }}
                    className="absolute inset-x-0 top-0 bg-primary"
                  />
                </div>
              )}
            </div>

            {/* Текст */}
            <div className={cn('pt-1.5', future && 'opacity-50')}>
              <p className={cn('font-semibold', active && step.meta.color)}>{step.meta.label}</p>
              <p className="text-xs text-muted">{step.description}</p>
            </div>
          </div>
        );
      })}

      {canceled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center gap-2 rounded-xl bg-danger/10 p-3 text-sm text-danger"
        >
          <span className="text-lg">{CANCELED_META.emoji}</span>
          Заказ отменён. Свяжитесь с нами, если это ошибка.
        </motion.div>
      )}
    </div>
  );
}
