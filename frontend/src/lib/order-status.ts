import type { OrderStatus } from './types';

export interface StatusMeta {
  label: string;
  emoji: string;
  color: string;
}

/** Описание этапов заказа для UI трекинга. Порядок = прогресс. */
export const ORDER_FLOW: { status: OrderStatus; meta: StatusMeta; description: string }[] = [
  {
    status: 'CREATED',
    meta: { label: 'Заказ создан', emoji: '📝', color: 'text-muted' },
    description: 'Мы получили ваш заказ и ожидаем подтверждения оператором.',
  },
  {
    status: 'CONFIRMED',
    meta: { label: 'Подтверждён', emoji: '✅', color: 'text-primary' },
    description: 'Заказ подтверждён, передан на кухню.',
  },
  {
    status: 'COOKING',
    meta: { label: 'Готовится', emoji: '👨‍🍳', color: 'text-warning' },
    description: 'Наш повар уже готовит ваши блюда.',
  },
  {
    status: 'ON_THE_WAY',
    meta: { label: 'В пути', emoji: '🛵', color: 'text-primary' },
    description: 'Курьер забрал заказ и уже едет к вам.',
  },
  {
    status: 'DELIVERED',
    meta: { label: 'Доставлен', emoji: '🎉', color: 'text-success' },
    description: 'Заказ доставлен. Приятного аппетита!',
  },
];

export const CANCELED_META: StatusMeta = {
  label: 'Отменён',
  emoji: '❌',
  color: 'text-danger',
};

/** Возвращает индекс текущего этапа в ORDER_FLOW (для прогресс-бара). */
export function statusIndex(status: OrderStatus): number {
  const idx = ORDER_FLOW.findIndex((s) => s.status === status);
  return idx === -1 ? 0 : idx;
}

export function getStatusMeta(status: OrderStatus): StatusMeta {
  return ORDER_FLOW.find((s) => s.status === status)?.meta ?? CANCELED_META;
}

export function isFinal(status: OrderStatus): boolean {
  return status === 'DELIVERED' || status === 'CANCELED';
}
