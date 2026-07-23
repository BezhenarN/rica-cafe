'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CreditCard } from 'lucide-react';
import { useOrder, useOrderStatusPolling } from '@/hooks/use-queries';
import { PageLoader } from '@/components/ui/loader';
import { OrderTracker } from '@/components/orders/order-tracker';
import { formatPrice } from '@/lib/cn';
import { getStatusMeta, isFinal } from '@/lib/order-status';

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);
  // Polling статуса обновляет трекер в реальном времени.
  const { data: statusInfo } = useOrderStatusPolling(id);

  if (isLoading) return <PageLoader />;
  if (!order) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-3 py-10 text-center">
        <h1 className="text-xl font-bold">Заказ не найден</h1>
        <Link href="/orders" className="btn-primary">К списку заказов</Link>
      </div>
    );
  }

  // Приоритет у polling-данных (актуальнее), иначе — из заказа.
  const currentStatus = statusInfo?.status ?? order.status;
  const meta = getStatusMeta(currentStatus);

  return (
    <div className="container-page py-6 sm:py-8">
      <Link
        href="/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> К заказам
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Трекинг */}
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Заказ #{order.publicNumber}</p>
                <h1 className="text-2xl font-extrabold">
                  <span className="mr-2">{meta.emoji}</span>
                  {meta.label}
                </h1>
              </div>
              {!isFinal(currentStatus) && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  В реальном времени
                </span>
              )}
            </div>
            <OrderTracker status={currentStatus} />
          </motion.div>

          {/* Состав заказа */}
          <div className="card p-5">
            <h2 className="mb-3 font-bold">Состав заказа</h2>
            <div className="divide-y divide-line">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">
                      {item.quantity} × {item.name}
                    </p>
                    {item.configSummary && (
                      <p className="text-xs text-muted">{item.configSummary}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-medium">
                    {formatPrice(Number(item.unitPrice) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Сводка */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card space-y-3 p-5">
            <h2 className="font-bold">Детали</h2>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-muted" />
                <span>
                  {order.street}, {order.building}
                  {order.apt ? `, кв. ${order.apt}` : ''}
                </span>
              </div>
              <div className="flex gap-2">
                <CreditCard className="h-4 w-4 shrink-0 text-muted" />
                <span>
                  {order.paymentMethod === 'CASH' ? 'Наличными' : 'Картой'} при получении
                </span>
              </div>
            </div>
            <div className="space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Товары</span>
                <span>{formatPrice(order.itemsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Доставка</span>
                <span>
                  {Number(order.deliveryCost) === 0 ? 'Бесплатно' : formatPrice(order.deliveryCost)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="font-bold">Итого</span>
              <span className="text-xl font-extrabold">{formatPrice(order.total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
