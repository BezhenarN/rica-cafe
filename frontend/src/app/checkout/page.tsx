'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, Truck, ShoppingBag } from 'lucide-react';
import { useCartStore, cartToOrderPayload } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { useCreateOrder } from '@/hooks/use-queries';
import { formatPrice } from '@/lib/cn';
import { showToast } from '@/components/ui/toast';
import { unwrapError } from '@/lib/api-client';
import type { PaymentMethod } from '@/lib/types';

type DeliveryType = 'DELIVERY' | 'PICKUP';

const schema = z.object({
  name: z.string().min(2, 'Введите имя'),
  phone: z.string().min(6, 'Введите телефон'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  deliveryType: z.enum(['DELIVERY', 'PICKUP']).default('DELIVERY'),
  street: z.string(),
  building: z.string(),
  apt: z.string(),
  entrance: z.string(),
  floor: z.string(),
  comment: z.string(),
  paymentMethod: z.enum(['CASH', 'CARD_ON_DELIVERY']).default('CASH'),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const clearCart = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const createOrder = useCreateOrder();

  const [success, setSuccess] = useState<{ id: string; number: number } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentMethod: 'CASH',
      deliveryType: 'DELIVERY',
    },
  });

  // Fill user fields after mount to avoid SSR mismatch
  useEffect(() => {
    if (user) {
      setValue('name', user.name ?? '');
      setValue('phone', user.phone ?? '');
      setValue('email', user.email ?? '');
    }
  }, [user, setValue]);

  const deliveryType = watch('deliveryType');

  const DELIVERY = 149;
  const FREE_FROM = 1500;
  const deliveryCost = deliveryType === 'PICKUP' ? 0 : (totalPrice >= FREE_FROM || totalPrice === 0 ? 0 : DELIVERY);
  const total = totalPrice + deliveryCost;

  const onSubmit = async (data: FormData) => {
    if (lines.length === 0) {
      showToast('Корзина пуста', 'error');
      return;
    }
    if (data.deliveryType === 'DELIVERY' && (!data.street || !data.building)) {
      showToast('Укажите адрес доставки', 'error');
      return;
    }
    const payload = cartToOrderPayload(lines);
    try {
      const order = await createOrder.mutateAsync({
        ...payload,
        paymentMethod: data.paymentMethod as PaymentMethod,
        deliveryType: data.deliveryType as DeliveryType,
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        street: data.street || undefined,
        building: data.building || undefined,
        apt: data.apt || undefined,
        entrance: data.entrance || undefined,
        floor: data.floor || undefined,
        comment: data.comment || undefined,
      });
      clearCart();
      setSuccess({ id: order.id, number: order.publicNumber });
      showToast('Заказ оформлен!', 'success');
    } catch (err) {
      showToast(await unwrapError(err), 'error');
    }
  };

  // Экран успеха.
  if (success) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-10 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success"
        >
          <CheckCircle2 className="h-10 w-10" />
        </motion.div>
        <h1 className="mt-5 text-2xl font-extrabold">Заказ оформлен!</h1>
        <p className="mt-2 text-muted">
          Номер заказа <span className="font-semibold text-ink">#{success.number}</span>
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Мы свяжемся с вами для подтверждения. Отслеживайте статус в реальном времени.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => router.push(`/orders/${success.id}`)}
            className="btn-primary"
          >
            Отследить заказ
          </button>
          <Link href="/menu" className="btn-outline">Вернуться в меню</Link>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-3 py-10 text-center">
        <h1 className="text-xl font-bold">Корзина пуста</h1>
        <Link href="/menu" className="btn-primary">Перейти в меню</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-6 sm:py-8">
      <Link
        href="/cart"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Назад в корзину
      </Link>

      <h1 className="mb-5 text-2xl font-extrabold sm:text-3xl">Оформление заказа</h1>

      <form
        onSubmit={handleSubmit(onSubmit, (e) => {
          console.error('Form validation errors:', e);
          const fields = Object.keys(e);
          showToast(
            `Ошибка формы: ${fields.join(', ')}`,
            'error',
          );
        })}
        className="grid gap-6 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-6">
          {/* Контакты */}
          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Контакты</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Имя" error={errors.name?.message}>
                <input className="input" {...register('name')} />
              </Field>
              <Field label="Телефон" error={errors.phone?.message}>
                <input className="input" placeholder="+7 900 000-00-00" {...register('phone')} />
              </Field>
            </div>
            <Field label="Email (необязательно)" error={errors.email?.message}>
              <input className="input" {...register('email')} />
            </Field>
          </section>

          {/* Способ получения */}
          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Как получите заказ?</h2>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5 ${
                  deliveryType === 'DELIVERY' ? 'border-primary bg-primary/5' : 'border-line'
                }`}
              >
                <input type="radio" value="DELIVERY" {...register('deliveryType')} />
                <Truck className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">Доставка</div>
                  <div className="text-xs text-muted">{deliveryCost === 0 ? 'Бесплатно от 1500 ₽' : '149 ₽'}</div>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5 ${
                  deliveryType === 'PICKUP' ? 'border-primary bg-primary/5' : 'border-line'
                }`}
              >
                <input type="radio" value="PICKUP" {...register('deliveryType')} />
                <ShoppingBag className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">Самовывоз</div>
                  <div className="text-xs text-muted">Бесплатно</div>
                </div>
              </label>
            </div>
          </section>

          {/* Адрес — показывается только при доставке */}
          {deliveryType === 'DELIVERY' && (
            <section className="card space-y-4 p-5">
              <h2 className="font-bold">Адрес доставки</h2>
              <Field label="Улица" error={errors.street?.message}>
                <input className="input" {...register('street')} />
              </Field>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="Дом" error={errors.building?.message}>
                  <input className="input" {...register('building')} />
                </Field>
                <Field label="Квартира">
                  <input className="input" {...register('apt')} />
                </Field>
                <Field label="Подъезд">
                  <input className="input" {...register('entrance')} />
                </Field>
                <Field label="Этаж">
                  <input className="input" {...register('floor')} />
                </Field>
              </div>
              <Field label="Комментарий курьеру (необязательно)">
                <textarea className="input min-h-[80px]" {...register('comment')} />
              </Field>
            </section>
          )}

          {/* Самовывоз — показывается только при pickup */}
          {deliveryType === 'PICKUP' && (
            <section className="card space-y-4 p-5 border-2 border-primary/20">
              <h2 className="font-bold">🏪 Самовывоз из кафе «Рица»</h2>
              <p className="text-sm text-muted">
                Закажите онлайн — заберите готовый заказ без очереди.<br />
                Мы перезвоним, когда заказ будет готов.
              </p>
              <div className="rounded-lg bg-primary/5 p-4 text-sm">
                <p><strong>Кафе «Рица»</strong></p>
                <p className="text-muted">г. Сочи, ул. Примерная, 15</p>
                <p className="text-muted">Ежедневно: 10:00 — 23:00</p>
              </div>
            </section>
          )}

          {/* Оплата */}
          <section className="card space-y-3 p-5">
            <h2 className="font-bold">Способ оплаты</h2>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['CASH', 'Наличными при получении'],
                ['CARD_ON_DELIVERY', 'Картой при получении'],
              ] as const).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-line p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input type="radio" value={value} {...register('paymentMethod')} />
                  {label}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted">
              Онлайн-оплата будет добавлена в следующей итерации.
            </p>
          </section>
        </div>

        {/* Сводка заказа (липкая) */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card space-y-3 p-5">
            <h2 className="font-bold">Ваш заказ</h2>
            <div className="divide-y divide-line">
              {lines.map((l) => (
                <div key={l.uid} className="flex justify-between gap-2 py-2 text-sm">
                  <span className="text-muted">
                    {l.quantity} × {l.title}
                  </span>
                  <span className="font-medium">{formatPrice(l.unitPrice * l.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Товары</span><span>{formatPrice(totalPrice)}</span></div>
              <div className="flex justify-between"><span className="text-muted">{deliveryType === 'DELIVERY' ? 'Доставка' : 'Самовывоз'}</span><span>{deliveryCost === 0 ? 'Бесплатно' : formatPrice(deliveryCost)}</span></div>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="font-bold">Итого</span>
              <span className="text-xl font-extrabold">{formatPrice(total)}</span>
            </div>
            <button
              type="submit"
              disabled={createOrder.isPending}
              className="btn-primary w-full"
            >
              {createOrder.isPending ? 'Оформляем...' : `Подтвердить заказ · ${formatPrice(total)}`}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}
