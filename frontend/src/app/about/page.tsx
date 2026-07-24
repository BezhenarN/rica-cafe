'use client';

import { MapPin, Phone, Clock, ShoppingBag, Truck } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="container-page py-6 sm:py-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            Кафе «Рица»
          </h1>
          <p className="mt-3 text-lg text-white/80">
            Настоящая грузинская кухня, свежайшие морепродукты и легендарные сувлаки — всё в одном месте, в сердце Сочи.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
      </section>

      {/* Преимущества */}
      <section className="grid gap-4 py-8 sm:grid-cols-3">
        <div className="card p-5">
          <MapPin className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-bold">Адрес</h3>
          <p className="mt-1 text-sm text-muted">г. Сочи, ул. Примерная, 15</p>
        </div>
        <div className="card p-5">
          <Phone className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-bold">Телефон</h3>
          <p className="mt-1 text-sm text-muted">+7 (900) 000-00-00</p>
        </div>
        <div className="card p-5">
          <Clock className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-bold">График</h3>
          <p className="mt-1 text-sm text-muted">Ежедневно 10:00 — 23:00</p>
        </div>
      </section>

      {/* О нас */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold">Наше меню</h2>
          <p className="text-muted">
            Мы объединяем лучшее из средиземноморской и кавказской кухонь. Свежие морепродукты с черноморского побережья,
            настоящие хинкали ручной лепки, сочные сувлаки на гриле — всё готовится из свежих продуктов каждый день.
          </p>
          <p className="text-muted">
            Каждое утро наш повар едет на рынок за свежими рыбой и морепродуктами. Наши хинкали лепятся вручную —
            по традиционному грузинскому рецепту с секретной смесью специй.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-extrabold">Наша кухня</h2>
          {[
            { emoji: '🌯', name: 'Сувлаки и шаурма', desc: 'Свинина, курица, креветки на гриле в лаваше' },
            { emoji: '🦐', name: 'Морепродукты', desc: 'Креветки, мидии, рыба-меч — каждый день с рынка' },
            { emoji: '🫓', name: 'Грузинская кухня', desc: 'Хинкали, хачапури, пхлаги, лобио' },
            { emoji: '🍕', name: 'Пицца', desc: 'Готовые и конструктор — выбирайте начинку' },
            { emoji: '🥤', name: 'Домашние напитки', desc: 'Компоты, тархун, лимонад' },
          ].map((item) => (
            <div key={item.name} className="flex items-start gap-3 rounded-xl bg-line p-3">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Доставка и самовывоз */}
      <section className="grid gap-4 py-6 sm:grid-cols-2">
        <div className="card p-5">
          <Truck className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-bold">Доставка</h3>
          <p className="mt-1 text-sm text-muted">
            Доставляем по Сочи за 30–45 минут. Бесплатно от 1500 ₽.
          </p>
          <Link href="/menu" className="btn-primary mt-4 block w-full text-center">
            Заказать доставку
          </Link>
        </div>
        <div className="card p-5">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-bold">Самовывоз</h3>
          <p className="mt-1 text-sm text-muted">
            Закажите онлайн — заберите готовый заказ без очереди. Мы перезвоним, когда всё будет готово.
          </p>
          <Link href="/menu" className="btn-primary mt-4 block w-full text-center">
            Заказать самовывоз
          </Link>
        </div>
      </section>
    </div>
  );
}
