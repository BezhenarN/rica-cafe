'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogOut, Mail, User as UserIcon, Phone, Plus, Trash2, Star, Package } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useSignIn, useSignUp, useAddresses, useCreateAddress, useDeleteAddress, useSetDefaultAddress, useMyOrders } from '@/hooks/use-queries';
import { PageLoader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/cn';
import { getStatusMeta } from '@/lib/order-status';
import { usersApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/components/ui/toast';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);
  const [tab, setTab] = useState<'orders' | 'addresses' | 'profile'>('orders');

  if (loading) return <PageLoader />;

  if (!user) return <AuthForm />;

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{user.name ?? 'Профиль'}</h1>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
        <button onClick={logout} className="btn-outline">
          <LogOut className="h-4 w-4" /> Выйти
        </button>
      </div>

      {user.role === 'ADMIN' && (
        <Link href="/admin" className="btn-primary mb-6 inline-flex">Перейти в админ-панель</Link>
      )}

      {/* Табы */}
      <div className="mb-5 flex gap-1 rounded-xl bg-line p-1">
        {([
          ['orders', 'Заказы'],
          ['addresses', 'Адреса'],
          ['profile', 'Профиль'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === key ? 'bg-surface text-primary shadow-sm' : 'text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'orders' && <OrdersTab />}
      {tab === 'addresses' && <AddressesTab />}
      {tab === 'profile' && <ProfileTab />}
    </div>
  );
}

// ── Заказы ────────────────────────────────────────────────────────────────────
function OrdersTab() {
  const { data: orders, isLoading } = useMyOrders();
  if (isLoading) return <PageLoader />;
  if (!orders?.length) {
    return (
      <div className="card flex flex-col items-center gap-3 py-12 text-center">
        <Package className="h-8 w-8 text-muted" />
        <p className="text-sm text-muted">Заказов пока нет</p>
        <Link href="/menu" className="btn-primary">В меню</Link>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {orders.map((o) => {
        const meta = getStatusMeta(o.status);
        return (
          <Link key={o.id} href={`/orders/${o.id}`} className="card flex items-center gap-3 p-4 hover:shadow-pop">
            <span className="text-xl">{meta.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold">Заказ #{o.publicNumber}</p>
              <p className="text-xs text-muted">
                {new Date(o.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={o.status === 'DELIVERED' ? 'success' : 'primary'}>{meta.label}</Badge>
              <p className="mt-1 text-sm font-bold">{formatPrice(o.total)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ── Адреса ────────────────────────────────────────────────────────────────────
function AddressesTab() {
  const { data: addresses, isLoading } = useAddresses();
  const createAddr = useCreateAddress();
  const deleteAddr = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [adding, setAdding] = useState(false);

  if (isLoading) return <PageLoader />;

  const handleDelete = (id: string) => {
    if (confirm('Удалить адрес?')) deleteAddr.mutate(id);
  };

  return (
    <div className="space-y-3">
      {addresses?.map((a) => (
        <motion.div key={a.id} layout className="card flex items-start gap-3 p-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{a.label ?? 'Адрес'}</p>
              {a.isDefault && <Badge variant="primary">Основной</Badge>}
            </div>
            <p className="text-sm text-muted">
              {a.street}, {a.building}
              {a.apt ? `, кв. ${a.apt}` : ''}
              {a.entrance ? `, подъезд ${a.entrance}` : ''}
            </p>
          </div>
          <div className="flex gap-1">
            {!a.isDefault && (
              <button onClick={() => setDefault.mutate(a.id)} className="btn-ghost rounded-full p-2" title="Сделать основным">
                <Star className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => handleDelete(a.id)} className="btn-ghost rounded-full p-2 text-muted hover:text-danger" title="Удалить">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ))}

      {adding ? (
        <AddressForm onCancel={() => setAdding(false)} onSubmit={async (data) => {
          await createAddr.mutateAsync(data);
          setAdding(false);
          showToast('Адрес добавлен', 'success');
        }} />
      ) : (
        <button onClick={() => setAdding(true)} className="btn-outline w-full">
          <Plus className="h-4 w-4" /> Добавить адрес
        </button>
      )}
    </div>
  );
}

function AddressForm({ onSubmit, onCancel }: {
  onSubmit: (d: { label?: string; street: string; building: string; apt?: string; entrance?: string; floor?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [apt, setApt] = useState('');
  const [label, setLabel] = useState('');
  return (
    <div className="card space-y-3 p-4">
      <input className="input" placeholder="Метка (Дом, Работа)" value={label} onChange={(e) => setLabel(e.target.value)} />
      <input className="input" placeholder="Улица *" value={street} onChange={(e) => setStreet(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input className="input" placeholder="Дом *" value={building} onChange={(e) => setBuilding(e.target.value)} />
        <input className="input" placeholder="Квартира" value={apt} onChange={(e) => setApt(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => street && building && onSubmit({ label, street, building, apt })}
          className="btn-primary flex-1"
        >
          Сохранить
        </button>
        <button onClick={onCancel} className="btn-outline">Отмена</button>
      </div>
    </div>
  );
}

// ── Профиль ────────────────────────────────────────────────────────────────────
function ProfileTab() {
  const user = useAuthStore((s) => s.user)!;
  const qc = useQueryClient();
  const [name, setName] = useState(user.name ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');

  const save = async () => {
    await usersApi.updateProfile({ name, phone });
    await qc.invalidateQueries({ queryKey: ['user'] });
    showToast('Профиль обновлён', 'success');
  };

  return (
    <div className="card max-w-md space-y-4 p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Mail className="h-4 w-4" /> {user.email}
      </div>
      <label className="block">
        <span className="label">Имя</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block">
        <span className="label">Телефон</span>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000-00-00" />
      </label>
      <button onClick={save} className="btn-primary w-full">Сохранить</button>
    </div>
  );
}

// ── Форма авторизации ──────────────────────────────────────────────────────────
function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const signIn = useSignIn();
  const signUp = useSignUp();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    if (mode === 'login') await signIn.mutateAsync(data);
    else await signUp.mutateAsync(data);
  };

  const pending = signIn.isPending || signUp.isPending;

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-sm space-y-5 p-6">
        <div className="text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <UserIcon className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold">{mode === 'login' ? 'Вход' : 'Регистрация'}</h1>
          <p className="text-sm text-muted">Войдите, чтобы отслеживать заказы</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <label className="block">
            <span className="label">Email</span>
            <input className="input" type="email" {...register('email')} />
            {errors.email && <span className="mt-1 block text-xs text-danger">{errors.email.message}</span>}
          </label>
          <label className="block">
            <span className="label">Пароль</span>
            <input className="input" type="password" {...register('password')} />
            {errors.password && <span className="mt-1 block text-xs text-danger">{errors.password.message}</span>}
          </label>
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          {mode === 'login' ? 'Нет аккаунта?' : 'Уже зарегистрированы?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="font-medium text-primary hover:underline"
          >
            {mode === 'login' ? 'Регистрация' : 'Войти'}
          </button>
        </p>

        <p className="rounded-lg bg-line/50 p-2 text-center text-xs text-muted">
          Демо-админ: admin@crudo.local / admin12345
        </p>
      </div>
    </div>
  );
}
