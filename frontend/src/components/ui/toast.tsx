'use client';

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastCtx {
  showToast: (msg: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx>({ showToast: () => {} });
export const useToast = () => useContext(Ctx);

export { showToast as _internalShowToast };

let toastId = 0;
export function showToast(message: string, type: ToastType = 'info') {
  // Глобальная функция для вызова вне React-дерева (в хуках мутаций).
  // Реальная реализация — через синглтон, который подтягивается провайдером.
  const evt = new CustomEvent('crudo-toast', { detail: { message, type } });
  window.dispatchEvent(evt);
}

const COLORS: Record<ToastType, string> = {
  success: 'bg-success text-white',
  error: 'bg-danger text-white',
  info: 'bg-ink text-white',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = String(++toastId);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  // Слушаем глобальные toast-события (для вызова из хуков мутаций вне провайдера).
  useState(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail;
      showToast(d.message, d.type);
    };
    window.addEventListener('crudo-toast', handler);
    return () => window.removeEventListener('crudo-toast', handler);
  });

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 sm:bottom-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className={cn(
                'pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-pop',
                COLORS[t.type],
              )}
            >
              <span className="flex-1">{t.message}</span>
              <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
