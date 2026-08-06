'use client';

import { useState } from 'react';
import { LogOut, Mail, User as UserIcon, Phone, Plus, Trash2, Star, Package, RotateCcw, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useForgotPassword, useAddresses, useCreateAddress, useDeleteAddress, useSetDefaultAddress, useMyOrders } from '@/hooks/use-queries';
import { PageLoader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/cn';
import { getStatusMeta } from '@/lib/order-status';
import { usersApi } from '@/lib/api';
import { setToken } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/components/ui/toast';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cart-store';
import type { Order } from '@/lib/types';

// ── Login / Register ─────────────────────────────────────────────────────────

function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const forgotPw = useForgotPassword();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res: Response;
      let body: Record<string, string>;

      if (mode === 'register') {
        if (!email || !phone || !password || !name) {
          setError('Заполните все поля');
          setLoading(false);
          return;
        }
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, phone }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Ошибка регистрации');
          setLoading(false);
          return;
        }
        useAuthStore.getState().setUser(data.user);
        setToken(data.accessToken);
      } else {
        if (!phone || !password) {
          setError('Заполните все поля');
          setLoading(false);
          return;
        }
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Ошибка входа');
          setLoading(false);
          return;
        }
        useAuthStore.getState().setUser(data.user);
        setToken(data.accessToken);
      }
      // Refresh page after login
      window.location.href = '/account';
    } catch {
      setError('Ошибка соединения с сервером');
    }
    setLoading(false);
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-sm space-y-5 p-6">
        <div className="text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <UserIcon className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold">{mode === 'login' ? 'Вход' : 'Регистрация'}</h1>
          <p className="text-sm text-muted">
            {mode === 'login' ? 'Войдите, чтобы отслеживать заказы' : 'Создайте аккаунт для заказа'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === 'register' && (
            <label className="block">
              <span className="label">Имя</span>
              <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}

          {mode === 'register' && (
            <label className="block">
              <span className="label">Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          )}

          <label className="block">
            <span className="label">Телефон</span>
            <input className="input" type="tel" placeholder="+7 900 000-00-00" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>

          <label className="block">
            <span className="label">Пароль</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          {error && <p className="text-xs text-danger text-center">{error}</p>}

          {mode === 'login' && (
            <button
              type="button"
              onClick={async () => {
                const emailVal = prompt('Введите ваш email, на который зарегистрирован аккаунт:');
                if (emailVal) {
                  forgotPw.mutate({ email: emailVal.trim() }, {
                    onSuccess: () => showToast('Ссылка для сброса отправлена на ваш email', 'success'),
                  });
                }
              }}
              className="text-xs text-primary hover:underline"
            >
              Забыли пароль?
            </button>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          {mode === 'login' ? 'Нет аккаунта?' : 'Уже зарегистрированы?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="font-medium text-primary hover:underline"
          >
            {mode === 'login' ? 'Регистрация' : 'Войти'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Logged in ────────────────────────────────────────────────────────────────

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
        <div className="flex items-center gap-2">
          {user.role === 'ADMIN' && (
            <Link href="/admin" className="btn-primary inline-flex items-center gap-2">
              <Shield className="h-4 w-4" /> Админ-панель
            </Link>
          )}
          <button onClick={logout} className="btn-outline">
            <LogOut className="h-4 w-4" /> Выйти
          </button>
        </div>
      </div>

      {/* Tabs */}
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
  const router = useRouter();
  const { data: orders, isLoading } = useMyOrders();
  const addCatalogItem = useCartStore((s) => s.addCatalogItem);
  const [adding, setAdding] = useState<string | null>(null);

  const reorder = async (order: Order) => {
    setAdding(order.id);
    try {
      // Add all catalog items to cart
      for (const item of order.items) {
        if (item.productId && item.configSummary) {
          addCatalogItem({
            productId: item.productId,
            variantName: item.configSummary,
            title: item.name,
            unitPrice: Number(item.unitPrice),
            quantity: item.quantity,
          });
        }
      }
      // Redirect to cart
      router.push('/cart');
    } catch {
      showToast('Не удалось добавить товары в корзину', 'error');
    } finally {
      setAdding(null);
    }
  };

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
          <div key={o.id} className="card flex items-center gap-3 p-4">
            <Link href={`/orders/${o.id}`} className="flex flex-1 items-center gap-3">
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
            {(o.status === 'DELIVERED' || o.status === 'CANCELED') && (
              <button
                onClick={() => reorder(o)}
                disabled={adding === o.id}
                className="btn-ghost rounded-full p-2 text-muted hover:text-primary"
                title="Заказать снова"
              >
                <RotateCcw className={`h-4 w-4 ${adding === o.id ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
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
  onSubmit: (d: { label: string | null; street: string; building: string; apt: string | null; entrance: string | null; floor: string | null; comment: string | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [apt, setApt] = useState('');
  const [label, setLabel] = useState('');
  const [comment, setComment] = useState('');
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
          onClick={() => street && building && onSubmit({
            label: label || null,
            street, building,
            apt: apt || null,
            entrance: null,
            floor: null,
            comment: comment || null,
          })}
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
