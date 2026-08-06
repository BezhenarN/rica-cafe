'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, Pizza, ShoppingBag, User } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useCartStore } from '@/store/cart-store';
import { cn } from '@/lib/cn';

/**
 * Нижняя навигация в стиле нативных food-delivery приложений.
 * Видна только на мобильных. Делает PWA похожим на приложение.
 */
export function MobileNav() {
  const pathname = usePathname();
  const openCart = useUIStore((s) => s.openCart);
  const cartCount = useCartStore((s) => s.totalCount());

  const items = [
    { href: '/', label: 'Главная', icon: Home, active: pathname === '/' },
    { href: '/menu', label: 'Меню', icon: UtensilsCrossed, active: pathname?.startsWith('/menu') },
    {
      href: '/pizza-builder',
      label: 'Пицца',
      icon: Pizza,
      active: pathname?.startsWith('/pizza-builder'),
    },
  ];

  return (
    <nav className="pb-safe-nav fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-lg lg:hidden">
      <div className="container-page grid grid-cols-5 items-center">
        {items.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition',
              active ? 'text-primary' : 'text-muted',
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate text-center">{label}</span>
          </Link>
        ))}
        <button
          onClick={openCart}
          className={cn(
            'relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition',
            'text-muted',
          )}
        >
          <span className="relative">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </span>
          <span className="truncate text-center">Корзина</span>
        </button>
        <Link
          href="/profile"
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition',
            pathname?.startsWith('/profile') ? 'text-primary' : 'text-muted',
          )}
        >
          <User className="h-5 w-5" />
          <span className="truncate text-center">Профиль</span>
        </Link>
      </div>
    </nav>
  );
}
