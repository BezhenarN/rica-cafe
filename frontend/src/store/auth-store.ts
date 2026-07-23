import { create } from 'zustand';
import type { User } from '@/lib/types';
import { authApi, signOut as apiSignOut } from '@/lib/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  hydrate: () => Promise<void>;
  logout: () => void;
}

/**
 * Auth-состояние. Токен живёт в api-client (localStorage); здесь — только user.
 * hydrate() вызывается на клиенте при старте, чтобы восстановить сессию.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  hydrate: async () => {
    const token =
      typeof window !== 'undefined' ? window.localStorage.getItem('crudo_token') : null;
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    try {
      const user = (await authApi.me()) as User;
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  logout: () => {
    apiSignOut();
    set({ user: null });
  },
}));
