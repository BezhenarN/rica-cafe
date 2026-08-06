'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { setToken } from '@/lib/api-client';
import { PageLoader } from '@/components/ui/loader';
import { showToast } from '@/components/ui/toast';

const adminLoginSchema = z.object({
  login: z.string().min(1, 'Введите логин'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

export default function WebAdminPage() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Все хуки ДО любых условных return
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof adminLoginSchema>>({
    defaultValues: { login: '', password: '' },
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: z.infer<typeof adminLoginSchema>) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.login, password: data.password }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Ошибка входа');
        return;
      }
      setToken(result.accessToken);
      useAuthStore.getState().setUser(result.user);
      showToast('Вы вошли как администратор', 'success');
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setSubmitting(false);
    }
  };

  // Уже авторизован — редирект на админку
  if (loading) return <PageLoader />;
  if (user?.role === 'ADMIN') {
    router.push('/admin');
    return <PageLoader />;
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-sm space-y-5 p-6">
        <div className="text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <Shield className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold">Админ-панель</h1>
          <p className="text-sm text-muted">Войдите для управления</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <label className="block">
            <span className="label">Логин</span>
            <input className="input" type="text" {...register('login')} required />
            {errors.login && <span className="mt-1 block text-xs text-danger">{errors.login.message}</span>}
          </label>
          <label className="block">
            <span className="label">Пароль</span>
            <input className="input" type="password" {...register('password')} />
            {errors.password && <span className="mt-1 block text-xs text-danger">{errors.password.message}</span>}
          </label>

          {error && (
            <p className="text-xs text-danger text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex w-full items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            {submitting ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          <Link href="/" className="text-primary hover:underline">← На главную</Link>
        </p>
      </div>
    </div>
  );
}
