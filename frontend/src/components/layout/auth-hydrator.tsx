'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Восстанавливает сессию пользователя из токена при первой загрузке на клиенте.
 * Работает полностью в фоне — не рендерит ничего и не блокирует UI.
 */
export function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate().catch(() => { /* 401 или таймаут — просто молчим, пользователь не авторизован */ });
  }, [hydrate]);

  return null;
}
