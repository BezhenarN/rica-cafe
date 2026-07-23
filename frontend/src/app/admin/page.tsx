'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Power, PowerOff } from 'lucide-react';
import { AdminGuard } from '@/components/admin/admin-guard';
import { OrderStatusManager } from '@/components/admin/order-status-manager';
import { useAdminOrders, useAdminProducts, useAdminToggleProduct } from '@/hooks/use-queries';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/cn';
import { getStatusMeta } from '@/lib/order-status';
import type { OrderStatus } from '@/lib/types';

const STATUS_FILTERS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Все' },
  { value: 'CREATED', label: 'Новые' },
  { value: 'CONFIRMED', label: 'Подтверждённые' },
  { value: 'COOKING', label: 'Готовятся' },
  { value: 'ON_THE_WAY', label: 'В пути' },
  { value: 'DELIVERED', label: 'Доставлены' },
];

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminContent />
    </AdminGuard>
  );
}

function AdminContent() {
  const [tab, setTab] = useState<'orders' | 'products'>('orders');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  return (
    <div className="container-page py-6 sm:py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> На сайт
      </Link>

      <h1 className="mb-5 text-2xl font-extrabold sm:text-3xl">Админ-панель</h1>

      <div className="mb-5 flex gap-1 rounded-xl bg-line p-1 sm:w-fit">
        {([
          ['orders', 'Заказы'],
          ['products', 'Товары'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-6 py-2 text-sm font-medium transition sm:flex-none ${
              tab === key ? 'bg-surface text-primary shadow-sm' : 'text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <OrdersAdmin statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      )}
      {tab === 'products' && <ProductsAdmin />}
    </div>
  );
}

function OrdersAdmin({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: OrderStatus | 'ALL';
  setStatusFilter: (s: OrderStatus | 'ALL') => void;
}) {
  const { data: orders, isLoading } = useAdminOrders(statusFilter === 'ALL' ? undefined : statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`chip ${statusFilter === f.value ? 'chip-active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-muted">Загрузка...</p>
      ) : !orders?.length ? (
        <p className="py-8 text-center text-muted">Заказов нет</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o, i) => {
            const meta = getStatusMeta(o.status);
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">#{o.publicNumber}</span>
                      <Badge variant={o.status === 'CANCELED' ? 'danger' : 'primary'}>
                        {meta.emoji} {meta.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(o.createdAt).toLocaleString('ru-RU')}
                    </p>
                    <p className="mt-1 text-sm">
                      {o.guestName ?? 'Клиент'} · {o.guestPhone ?? '—'}
                    </p>
                    <p className="text-xs text-muted">
                      📍 {o.street}, {o.building}{o.apt ? `, кв. ${o.apt}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatPrice(o.total)}</div>
                    <div className="text-xs text-muted">
                      {o.paymentMethod === 'CASH' ? 'Нал.' : 'Картой'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-line pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted">Состав</p>
                  <ul className="mb-3 space-y-0.5 text-sm">
                    {o.items.map((it) => (
                      <li key={it.id} className="flex justify-between gap-2">
                        <span className="text-muted">
                          {it.quantity} × {it.name}
                        </span>
                        <span>{formatPrice(Number(it.unitPrice) * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase text-muted">Статус</span>
                    <OrderStatusManager orderId={o.id} current={o.status} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProductsAdmin() {
  const { data: products, isLoading } = useAdminProducts();
  const toggle = useAdminToggleProduct();

  return (
    <div className="space-y-3">
      {isLoading ? (
        <p className="py-8 text-center text-muted">Загрузка...</p>
      ) : (
        products?.map((p) => (
          <div key={p.id} className="card flex items-center gap-3 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{p.name}</p>
                {!p.isAvailable && <Badge variant="danger">Скрыт</Badge>}
                {p.isFeatured && <Badge variant="success">Хит</Badge>}
              </div>
              <p className="text-xs text-muted">
                {p.category.name} · {formatPrice(p.basePrice)} · slug: {p.slug}
              </p>
            </div>
            <button
              onClick={() => toggle.mutate({ id: p.id, isAvailable: !p.isAvailable })}
              className={p.isAvailable ? 'btn-outline' : 'btn-primary'}
            >
              {p.isAvailable ? (
                <><PowerOff className="h-4 w-4" /> Скрыть</>
              ) : (
                <><Power className="h-4 w-4" /> Показать</>
              )}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
