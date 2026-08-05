'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useForgotPassword } from '@/hooks/use-queries';
import { PageLoader } from '@/components/ui/loader';
import { showToast } from '@/components/ui/toast';

const forgotSchema = z.object({
  email: z.string().email('Введите корректный email'),
});

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const forgotPw = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: z.infer<typeof forgotSchema>) => {
    forgotPw.mutate(data, {
      onSuccess: () => {
        setSent(true);
        showToast('Ссылка для сброса отправлена на ваш email', 'success');
      },
    });
  };

  if (sent) {
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
        <div className="card w-full max-w-sm space-y-5 p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 text-white">
            <Mail className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold">Проверьте почту</h1>
          <p className="text-sm text-muted">
            Мы отправили ссылку для сброса пароля на ваш email. Ссылка действительна 15 минут.
          </p>
          <Link href="/account" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Вернуться ко входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-sm space-y-5 p-6">
        <div className="text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <Mail className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold">Восстановление пароля</h1>
          <p className="text-sm text-muted">Введите email, на который зарегистрирован аккаунт</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <label className="block">
            <span className="label">Email</span>
            <input className="input" type="email" {...register('email')} />
            {errors.email && <span className="mt-1 block text-xs text-danger">{errors.email.message}</span>}
          </label>

          <button type="submit" disabled={forgotPw.isPending} className="btn-primary w-full relative">
            {forgotPw.isPending && (
              <span className="absolute inset-0 flex items-center justify-center bg-primary">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </span>
            )}
            {forgotPw.isPending ? 'Отправляем...' : 'Отправить ссылку'}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          <Link href="/account" className="flex items-center justify-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Вернуться ко входу
          </Link>
        </p>
      </div>
    </div>
  );
}
