'use client';

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Power, PowerOff, Pencil, Trash2, Plus, X, Upload, Heart, LogOut } from 'lucide-react';
import { AdminGuard } from '@/components/admin/admin-guard';
import { OrderStatusManager } from '@/components/admin/order-status-manager';
import { useAdminOrders, useAdminProducts, useAdminToggleProduct } from '@/hooks/use-queries';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/cn';
import { getStatusMeta } from '@/lib/order-status';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useCategories } from '@/hooks/use-queries';
import { unwrapError, getToken, setToken } from '@/lib/api-client';
import { showToast } from '@/components/ui/toast';
import type { OrderStatus, Category, Product as ProductType } from '@/lib/types';

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
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [tab, setTab] = useState<'orders' | 'products'>('orders');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  const handleLogout = () => {
    logout();
    setToken(null);
    router.push('/');
    router.refresh();
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" /> На сайт
        </Link>
        <button onClick={handleLogout} className="btn-outline inline-flex items-center gap-2">
          <LogOut className="h-4 w-4" /> Выйти
        </button>
      </div>

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

/* ─────────────── Заказы ─────────────────────── */

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

/* ─────────────── Товары ─────────────────────── */

function ProductsAdmin() {
  const { data: products, isLoading } = useAdminProducts();
  const { data: categories } = useCategories();
  const toggle = useAdminToggleProduct();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const qc = useQueryClient();

  const handleImageUpload = async (productId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await fetch(`/api/admin/products/${productId}/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Ошибка сервера' }));
        throw new Error(err.error || 'Ошибка сервера');
      }
      const data = await r.json();
      showToast('Фото загружено', 'success');
      qc.setQueryData(['admin', 'products'], (old: any[]) =>
        old?.map((item) => item.id === productId ? { ...item, imagePath: data.imagePath } : item)
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки фото';
      showToast(msg, 'error');
    }
  };

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    const token = getToken();
    if (!token) {
      showToast('Не авторизованы', 'error');
      return;
    }
    await adminApi.updateProduct(id, { isFeatured });
    showToast(isFeatured ? 'Отмечен как хит' : 'Убран из хитов', 'success');
    qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    qc.invalidateQueries({ queryKey: ['products', 'featured'] });
  };

  return (
    <div className="space-y-4">
      {/* Кнопка «Добавить товар» */}
      <button
        onClick={() => setShowForm(true)}
        className="btn-primary inline-flex items-center gap-2"
      >
        <Plus className="h-4 w-4" /> Добавить товар
      </button>

      {/* Форма создания нового товара — сразу под кнопкой */}
      {showForm && (
        <ProductForm
          product={null}
          categories={categories}
          queryClient={qc}
          onClose={() => { setShowForm(false); setEditingId(null); }}
        />
      )}

      {/* Список товаров */}
      <div>
        {isLoading ? (
          <p className="py-8 text-center text-muted">Загрузка...</p>
        ) : products?.length === 0 ? (
          <p className="py-8 text-center text-muted">Товаров нет</p>
        ) : (
          <div className="space-y-3">
            {products!.map((p) => (
              <div key={p.id} className="space-y-3">
                {/* Карточка товара */}
                <div className="card flex items-center gap-3 p-4">
                  {/* Превью фото */}
                  {p.imagePath ? (
                    <img src={`/api/products/${p.id}/image`} alt={p.name} className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-line text-muted">
                      <Plus className="h-5 w-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{p.name}</p>
                      {!p.isAvailable && <Badge variant="danger">Скрыт</Badge>}
                      {p.isFeatured && <Badge variant="success">Хит</Badge>}
                    </div>
                    <p className="text-xs text-muted truncate">
                      {p.category.name} · {formatPrice(p.basePrice)} · slug: {p.slug}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Кнопка загрузки фото */}
                    <label
                      title="Загрузить фото"
                      className="btn-outline h-9 w-9 cursor-pointer rounded-full p-0"
                    >
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          // Сбросим значение чтобы можно было выбрать тот же файл повторно
                          e.target.value = '';
                          handleImageUpload(p.id, file);
                        }}
                      />
                    </label>

                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setShowForm(true);
                      }}
                      className="btn-outline h-9 w-9 rounded-full p-0"
                      title="Редактировать"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleFeatured(p.id, !p.isFeatured)}
                      className={p.isFeatured ? 'btn-primary h-9 w-9 rounded-full p-0' : 'btn-outline h-9 w-9 rounded-full p-0'}
                      title={p.isFeatured ? 'Убрать из хитов' : 'Отметить как хит'}
                    >
                      <Heart className={p.isFeatured ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
                    </button>
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
                </div>

                {/* Форма редактирования — раскрывается под товаром */}
                {showForm && editingId === p.id && (
                  <ProductForm
                    product={p}
                    categories={categories}
                    queryClient={qc}
                    onClose={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Форма товара ───────────────── */

function ProductForm({
  product,
  categories,
  queryClient,
  onClose,
}: {
  product: ProductType | null;
  categories: Category[] | undefined;
  queryClient: ReturnType<typeof useQueryClient>;
  onClose: () => void;
}) {
  const isEdit = !!product;

  const [slug, setSlug] = useState(product?.slug ?? '');
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? (categories?.[0]?.id ?? ''));
  const [basePrice, setBasePrice] = useState(
    product?.basePrice != null ? String(product.basePrice) : ''
  );
  const [weight, setWeight] = useState(
    product?.weight != null ? String(product.weight) : ''
  );
  const [kcal, setKcal] = useState(
    product?.kcal != null ? String(product.kcal) : ''
  );
  const [isVegan, setIsVegan] = useState(product?.isVegan ?? false);
  const [isSpicy, setIsSpicy] = useState(product?.isSpicy ?? false);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);

  // Варианты: имя + цена
  const [variantNames, setVariantNames] = useState<string[]>(
    product?.variants?.length
      ? product.variants.map((v) => v.name)
      : ['Стандарт']
  );
  const [variantPrices, setVariantPrices] = useState<string[]>(
    product?.variants?.length
      ? product.variants.map((v) => v.price)
      : [product?.basePrice ?? '']
  );

  const addVariant = () => {
    setVariantNames((prev) => [...prev, '']);
    setVariantPrices((prev) => [...prev, '']);
  };
  const removeVariant = (idx: number) => {
    if (variantNames.length <= 1) return;
    setVariantNames((prev) => prev.filter((_, i) => i !== idx));
    setVariantPrices((prev) => prev.filter((_, i) => i !== idx));
  };
  const setVariantName = (idx: number, val: string) =>
    setVariantNames((prev) => prev.map((v, i) => (i === idx ? val : v)));
  const setVariantPrice = (idx: number, val: string) =>
    setVariantPrices((prev) => prev.map((v, i) => (i === idx ? val : v)));

  if (!categories || categories.length === 0) return <p className="py-4 text-muted">Категории не загружены.</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      showToast('Не авторизованы', 'error');
      return;
    }

    try {
      const trimmedSlug = slug.trim();
      const trimmedName = name.trim();

      if (!trimmedSlug) {
        showToast('Slug обязателен', 'error');
        return;
      }
      if (!trimmedName) {
        showToast('Название обязательно', 'error');
        return;
      }
      const price = parseFloat(basePrice);
      if (isNaN(price) || price <= 0) {
        showToast('Цена должна быть положительным числом', 'error');
        return;
      }

      const variants = variantNames
        .filter(Boolean)
        .map((v, i) => ({ name: v, price: variantPrices[i] ?? '' }));

      const data: Record<string, unknown> = {
        slug: trimmedSlug,
        name: trimmedName,
        description: description.trim() || undefined,
        categoryId,
        basePrice: price,
        weight: weight ? parseInt(weight, 10) : undefined,
        kcal: kcal ? parseInt(kcal, 10) : undefined,
        isVegan,
        isSpicy,
        isFeatured,
        isAvailable,
        variants: variants
          .filter((v) => v.name.trim())
          .map((v, i) => ({
            name: v.name.trim(),
            price: v.price ? parseFloat(v.price) : undefined,
            isDefault: i === 0,
          })),
      };

      if (isEdit && product) {
        await adminApi.updateProduct(product.id, data);
      } else {
        await adminApi.createProduct(data);
      }

      showToast(isEdit ? 'Товар обновлён' : 'Товар создан', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      onClose();
    } catch (err) {
      let msg = 'Что-то пошло не так';
      if (err instanceof Error) msg = err.message;
      showToast(msg, 'error');
    }
  };

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{isEdit ? 'Редактировать товар' : 'Добавить товар'}</h2>
        <button onClick={onClose} className="btn-outline h-8 w-8 rounded-full p-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Slug" error="">
            <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </Field>
          <Field label="Название" error="">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
        </div>

        <Field label="Описание">
          <textarea className="input min-h-[60px]" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Категория">
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Цена (₽)">
            <input className="input" type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
          </Field>
          <Field label="Вес (г)">
            <input className="input" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ккал">
            <input className="input" type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} />
          </Field>
          <div className="flex items-center gap-6 pt-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isVegan} onChange={(e) => setIsVegan(e.target.checked)} />
              <span className="text-sm">Веган</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isSpicy} onChange={(e) => setIsSpicy(e.target.checked)} />
              <span className="text-sm">Острое</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              <span className="text-sm">Хит</span>
            </label>
          </div>
        </div>

        {/* Варианты */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="label">Варианты</label>
            <button type="button" onClick={addVariant} className="text-xs font-medium text-primary hover:underline">
              + Вариант
            </button>
          </div>
          {variantNames.map((vn, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Название (напр. 30 см)"
                value={vn}
                onChange={(e) => setVariantName(i, e.target.value)}
              />
              <input
                className="input w-28"
                type="number"
                placeholder="Цена"
                value={variantPrices[i] ?? ''}
                onChange={(e) => setVariantPrice(i, e.target.value)}
              />
              {variantNames.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="btn-outline h-9 w-9 rounded-full p-0"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
            <span className="text-sm">Доступен</span>
          </label>
          <button type="submit" className="btn-primary">
            {isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
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
