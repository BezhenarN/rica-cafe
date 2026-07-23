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
            <span className="text-lg font-extrabold tracking-tight">Crudo</span>
          </Link>
          <p className="max-w-xs text-sm text-muted">
            Доставка свежей пиццы и готовых блюд. Соберите свою пиццу в конструкторе и
            отслеживайте заказ в реальном времени.
          </p>
        </div>

        <nav className="space-y-2">
          <h3 className="text-sm font-semibold">Каталог</h3>
          <ul className="space-y-1.5 text-sm text-muted">
            <li><Link href="/menu?category=pizza" className="hover:text-ink">Пицца</Link></li>
            <li><Link href="/menu?category=burgers" className="hover:text-ink">Бургеры</Link></li>
            <li><Link href="/pizza-builder" className="hover:text-ink">Конструктор пиццы</Link></li>
            <li><Link href="/menu" className="hover:text-ink">Все блюда</Link></li>
          </ul>
        </nav>

        <nav className="space-y-2">
          <h3 className="text-sm font-semibold">Компания</h3>
          <ul className="space-y-1.5 text-sm text-muted">
            <li><Link href="/orders" className="hover:text-ink">Мои заказы</Link></li>
            <li><Link href="/account" className="hover:text-ink">Личный кабинет</Link></li>
          </ul>
        </nav>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Контакты</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> +7 800 000-00-00
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Ежедневно 10:00–23:00
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Доставка по городу
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4">
        <p className="container-page text-center text-xs text-muted">
          © {new Date().getFullYear()} Crudo. Демонстрационный проект.
        </p>
      </div>
    </footer>
  );
}
