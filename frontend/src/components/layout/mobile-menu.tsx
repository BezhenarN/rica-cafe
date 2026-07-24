'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, Pizza, ShoppingBag, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';

const LINKS = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/menu', label: 'Меню', icon: UtensilsCrossed },
  { href: '/about', label: 'О кафе', icon: UtensilsCrossed },
  { href: '/pizza-builder', label: 'Конструктор пиццы', icon: Pizza },
  { href: '/cart', label: 'Корзина', icon: ShoppingBag },
  { href: '/orders', label: 'Мои заказы', icon: ShoppingBag },
  { href: '/account', label: 'Личный кабинет', icon: User },
];

export function MobileMenu() {
  const { mobileMenuOpen, closeMobileMenu } = useUIStore();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
            onClick={closeMobileMenu}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-surface shadow-pop lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="text-lg font-extrabold">Меню</span>
              <button onClick={closeMobileMenu} className="btn-ghost rounded-full p-2" aria-label="Закрыть">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              {LINKS.map(({ href, label, icon: Icon }) => {
                const active = href === '/' ? pathname === '/' : pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      active ? 'bg-primary/10 text-primary' : 'text-ink hover:bg-line'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                );
              })}
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={closeMobileMenu}
                  className="mt-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Админ-панель
                </Link>
              )}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
