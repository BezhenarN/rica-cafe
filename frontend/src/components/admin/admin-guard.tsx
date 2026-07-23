'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { Loader } from '@/components/ui/loader';

/** Защита админ-страниц: только для авторизованных админов. */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-3 py-10 text-center">
        <h1 className="text-xl font-bold">Требуется авторизация</h1>
        <Link href="/account" className="btn-primary">Войти</Link>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-3 py-10 text-center">
        <h1 className="text-xl font-bold">Доступ запрещён</h1>
        <p className="text-sm text-muted">Эта страница доступна только администраторам.</p>
        <Link href="/" className="btn-primary">На главную</Link>
      </div>
    );
  }

  return <>{children}</>;
}
