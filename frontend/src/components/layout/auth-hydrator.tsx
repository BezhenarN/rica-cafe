'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Восстанавливает сессию пользователя из токена при первой загрузке на клиенте.
 * Монтируется в корневом layout один раз.
 */
export function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return null;
}
