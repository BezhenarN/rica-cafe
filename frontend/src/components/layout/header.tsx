'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, User, Pizza as PizzaIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/store/ui-store';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/menu', label: 'Меню' },
  { href: '/pizza-builder', label: 'Конструктор пиццы' },
  { href: '/about', label: 'О кафе' },
  { href: '/orders', label: 'Заказы' },
];

export function Header() {
  const pathname = usePathname();
  const openCart = useUIStore((s) => s.openCart);
  const openMobileMenu = useUIStore((s) => s.openMobileMenu);
  const cartCount = useCartStore((s) => s.totalCount());
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-lg">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        {/* Лого + бургер (мобайл) */}
        <div className="flex items-center gap-2">
          <button
            onClick={openMobileMenu}
            className="btn-ghost -ml-2 rounded-full p-2 lg:hidden"
            aria-label="Меню"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
              <PizzaIcon className="h-4 w-4" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Рица</span>
          </Link>
        </div>

        {/* Навигация (десктоп) */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative rounded-lg px-4 py-2 text-sm font-medium transition',
                pathname?.startsWith(item.href)
                  ? 'text-primary'
                  : 'text-muted hover:text-ink',
              )}
            >
              {item.label}
              {pathname?.startsWith(item.href) && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-primary"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Корзина + профиль */}
        <div className="flex items-center gap-1">
          <button
            onClick={openCart}
            className="btn-ghost relative rounded-full p-2.5"
            aria-label="Корзина"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
          <Link
            href="/account"
            className={cn(
              'btn-ghost rounded-full p-2.5',
              pathname === '/account' && 'text-primary',
            )}
            aria-label="Личный кабинет"
          >
            <User className="h-5 w-5" />
          </Link>
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="btn-outline ml-1 hidden text-xs sm:inline-flex">
              Админка
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
