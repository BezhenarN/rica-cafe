'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PackageOpen, ChevronRight } from 'lucide-react';
import { useMyOrders } from '@/hooks/use-queries';
import { useAuthStore } from '@/store/auth-store';
import { PageLoader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/cn';
import { getStatusMeta } from '@/lib/order-status';

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const { data: orders, isLoading } = useMyOrders();

  if (loading || (user && isLoading)) return <PageLoader />;

  // Не залогинен → гостевой доступ к заказам по ссылке из чекаута.
  if (!user) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-3 py-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-line">
          <PackageOpen className="h-7 w-7 text-muted" />
        </span>
        <h1 className="text-xl font-bold">Войдите, чтобы увидеть заказы</h1>
        <p className="max-w-sm text-sm text-muted">
          История заказов доступна только авторизованным пользователям.
        </p>
        <Link href="/account" className="btn-primary">Войти</Link>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-3 py-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-line">
          <PackageOpen className="h-7 w-7 text-muted" />
        </span>
        <h1 className="text-xl font-bold">Заказов пока нет</h1>
        <Link href="/menu" className="btn-primary">Сделать первый заказ</Link>
      </div>
    );
  }

  return (
    <div className="container-page space-y-4 py-6 sm:py-8">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Мои заказы</h1>
      <div className="space-y-3">
        {orders.map((o, i) => {
          const meta = getStatusMeta(o.status);
          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/orders/${o.id}`}
                className="card flex items-center gap-4 p-4 transition hover:shadow-pop"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-line text-xl">
                  {meta.emoji}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Заказ #{o.publicNumber}</span>
                    <Badge variant={o.status === 'DELIVERED' ? 'success' : 'primary'}>
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {new Date(o.createdAt).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · {o.items.length} тов.
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatPrice(o.total)}</div>
                  <ChevronRight className="ml-auto h-4 w-4 text-muted" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
