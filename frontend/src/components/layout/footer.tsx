import Link from 'next/link';
import { Pizza as PizzaIcon, Phone, Clock, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
              <PizzaIcon className="h-4 w-4" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Рица</span>
          </Link>
          <p className="max-w-xs text-sm text-muted">
            Кафе «Рица» в Сочи: сувлаки, морепродукты, грузинская кухня, пицца и напитки. Доставка и самовывоз.
          </p>
        </div>

        <nav className="space-y-2">
          <h3 className="text-sm font-semibold">Каталог</h3>
          <ul className="space-y-1.5 text-sm text-muted">
            <li><Link href="/menu?category=suvlaki" className="hover:text-ink">Сувлаки и шаурма</Link></li>
            <li><Link href="/menu?category=seafood" className="hover:text-ink">Морепродукты</Link></li>
            <li><Link href="/menu?category=georgian" className="hover:text-ink">Грузинская кухня</Link></li>
            <li><Link href="/menu?category=pizza" className="hover:text-ink">Пицца</Link></li>
            <li><Link href="/pizza-builder" className="hover:text-ink">Конструктор пиццы</Link></li>
            <li><Link href="/menu" className="hover:text-ink">Все блюда</Link></li>
          </ul>
        </nav>

        <nav className="space-y-2">
          <h3 className="text-sm font-semibold">Компания</h3>
          <ul className="space-y-1.5 text-sm text-muted">
            <li><Link href="/about" className="hover:text-ink">О кафе</Link></li>
            <li><Link href="/orders" className="hover:text-ink">Мои заказы</Link></li>
            <li><Link href="/account" className="hover:text-ink">Личный кабинет</Link></li>
          </ul>
        </nav>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Контакты</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> +7 (900) 000-00-00
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Ежедневно 10:00–23:00
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> г. Сочи, ул. Примерная, 15
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4">
        <p className="container-page text-center text-xs text-muted">
          © {new Date().getFullYear()} Рица. Кафе и доставка, Сочи.
        </p>
      </div>
    </footer>
  );
}
