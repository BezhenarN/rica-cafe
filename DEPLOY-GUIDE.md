# Руководство по деплою сайта доставки (Next.js + Neon + Vercel)

> Конструктор для быстрого запуска проектов типа кафе / доставки еды. Все решения и подводные камни, накопленные при деплое сайта «Рица» (Сочи).

---

## 📐 Архитектура

```
┌─────────────────────────────────────────────────────┐
│  Vercel                                              │
│  ┌───────────────────────────────────────────────┐  │
│  │  Next.js App Router (Node.js runtime)         │  │
│  │  ┌─────────────┐  ┌────────────────────────┐  │  │
│  │  │ React Page  │  │  API Routes             │  │  │
│  │  │ Components  │  │  /api/products          │  │  │
│  │  │             │  │  /api/categories        │  │  │
│  │  │  (client)   │  │  /api/auth/login        │  │  │
│  │  └─────────────┘  │  /api/orders            │  │  │
│  │                    └────────────────────────┘  │  │
│  │                        │  Prisma Client         │  │
│  └────────────────────────┼───────────────────────┘  │
│                          │                           │
│                  Neon Serverless PostgreSQL           │
└─────────────────────────────────────────────────────┘
```

**Ключевой принцип:** один деплой на Vercel, бэкенд не нужен. Вся серверная логика — в API Routes Next.js.

---

## 🏗️ Шаблоны настройки проекта

### 1. Структура фронтенда

```
frontend/
├── prisma/
│   ├── schema.prisma          # Модель данных (каталоги, продукты, заказы)
│   └── seed.ts                # начальные данные
├── src/
│   ├── app/
│   │   ├── api/[...path]/     # Catch-all API route
│   │   │   └── route.ts       # Все API эндпоинты в одном файле
│   │   ├── menu/page.tsx      # Серверный компонент — рендер каталога
│   │   ├── home/page.tsx      # Главная
│   │   └── cart/page.tsx      # Корзина
│   ├── lib/
│   │   ├── prisma.ts          # Singleton PrismaClient
│   │   ├── api-client.ts      # Ky HTTP-клиент
│   │   └── auth.ts            # JWT helpers
│   ├── store/                 # Zustand stores (auth, cart)
│   └── hooks/
│       └── use-queries.ts     # React Query хуки
└── .env                       # Локальные env (НЕ в git)
```

### 2. API Routes — catch-all паттерн

**`src/app/api/[...path]/route.ts`** — один файл обрабатывает все API эндпоинты:

```typescript
export const runtime = 'nodejs'; // ⚠️ КРИТИЧНО: Node.js runtime для DATABASE_URL

function getPath(request: NextRequest): string[] {
  return request.nextUrl.pathname.split('/api/')[1] || '';
}

export async function GET(request: NextRequest) {
  const path = getPath(request);

  // health
  if (path === 'health') return NextResponse.json({ status: 'ok' });

  // categories
  if (path[0] === 'categories' && path.length === 1) {
    try {
      return NextResponse.json(await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }));
    } catch (e) {
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  // products
  if (path[0] === 'products' && path.length === 1) {
    try {
      const { searchParams } = new URL(request.url);
      const where: any = {};
      if (searchParams.get('category')) where.categoryId = searchParams.get('category');
      if (searchParams.get('vegan')) where.vegan = true;
      if (searchParams.get('spicy')) where.spicy = true;
      const products = await prisma.product.findMany({ where, orderBy: { sortOrder: 'asc' }, include: { category: true } });
      return NextResponse.json(products);
    } catch (e) {
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

**Правило:** оборачиваем каждый handler в try-catch, возвращаем `{ error }` вместо падения с 500.

### 3. Prisma singleton

**`src/lib/prisma.ts`**:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

> **Важно:** singleton нужен для горячих ребилдов в dev-режиме (Prisma выбросит error при создании нового клиента).

---

## ⚙️ Middleware: клиентский vs серверный

### Подводный камень №1: Ky + React Query в продакшене

**Проблема:** клиентские API-хуки (`useProducts()`, `useCategories()`) могут молча падать в продакшене:
- Скрытые ошибки Ky (таймауты, не-JSON ответы)
- Конфликты с кэшем браузера/CDN
- `NEXT_PUBLIC_` переменные, заданные post-deploy, не пересобраны

**Решение:** критически важные данные (каталог, меню) загружаем на сервере:

```typescript
// menu/page.tsx — серверный компонент
export default async function MenuPage({ searchParams }) {
  const sp = await searchParams;
  const cats = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  const products = await prisma.product.findMany({
    where: { isAvailable: true },
    include: { category: true },
  });
  return <MenuClient categories={cats} initialProducts={products} />;
}

// menu-client.tsx — клиентский компонент только для фильтров
export function MenuClient({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts);
  // фильтры через fetch(), не через Ky
}
```

### Подводный камень №2: API-URL на клиенте

```typescript
// api-client.ts
function createClient(): KyInstance {
  const isServer = typeof window === 'undefined';
  const apiBase = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : isServer
      ? `https://${process.env.VERCEL_URL || 'localhost:3000'}/api`
      : '/api'; // ⚠️ БРАУЗЕР: '/api' (не ''), иначе fetch('/products') вместо '/api/products'

  return ky.create({ prefixUrl: apiBase });
}
```

### Подводный камень №3: Edge vs Node.js

| Runtime | DATABASE_URL | SECRET env vars | Next.js rewrites |
|---------|-------------|-----------------|------------------|
| `edge`  | ❌ недоступен | ❌ нет          | ✅               |
| `nodejs`| ✅ есть      | ✅ есть         | ❌ нет           |

**Правило:** API routes с Prisma — всегда `export const runtime = 'nodejs';`. Страницы — `export const runtime = 'edge';`.

---

## 🚀 Деплой на Vercel

### Этап 1: подготовка

1. **Убери `.env` из git!** `.env.production` тоже. Они перезаписывают Vercel runtime env vars.
2. **Убери `.vercel/project.json`** — Vercel CLI v57+ его игнорирует и сам определяет проект из Git metadata.
3. Запусти `npx vercel login` — авторизация.
4. Запусти `npx vercel` — первый деплой, создаёт проект в директории `frontend/`.

### Этап 2: environment variables

```bash
# Установить все vars сразу (production env)
npx vercel env update DATABASE_URL production --yes << EOF
postgresql://neondb_owner:npg_XXX@ep-withered-tooth-ayis7hdq.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require
EOF

npx vercel env update JWT_SECRET production --yes --secret
npx vercel env update ADMIN_EMAIL production --yes
npx vercel env update ADMIN_PASSWORD production --yes --secret
```

> `--secret` шифрует значение (bcrypt). Для `DATABASE_URL` не нужен, для JWT — обязателен.

### Этап 3: Prisma migration + seed

```bash
cd frontend
npx prisma generate    # генерирует клиент
npx prisma db push     # применяет schema.prisma к БД (не мигрирует, как migrate)
npx prisma db seed     # заполняет данными
```

> `db push` быстрее `migrate` для разработки. Для продакшена можно `migrate`.

### Этап 4: Настройка Neon PostgreSQL

1. В Neon Dashboard: **Connection Data** → **Serverless** → скопируй строку подключения.
2. Два формата:
   - **Direct:** `ep-withered-tooth-ayis7hdq.c-5.us-east-2.aws.neon.tech` — быстрее при cold start
   - **Pooler:** `pooler.s野兽那头-ayis7hdq.pooler` — хорош при высокой нагрузке
3. Для продакшена с низкими нагрузками — **direct connection** (меньше cold start latency).

### Этап 5: Deprecation Protection (если нужен)

Если стоит Vercel Team/Enterprise и включён Protection:
1. **Settings → Git → Git Integration** — убедись, что `Automatic Deployment` включён
2. **Settings → General → Deployment Protection** — отключить **Git Protection** и **SSO Protection** (иначе Vercel CLI не сможет деплоить)

---

## 🔧 Частые проблемы и решения

| Проблема | Причина | Решение |
|----------|---------|---------|
| Меню пустое в продакшене, но API работает через curl | Клиентский `useProducts()` молча упал | Перенести загрузку на сервер (server component) |
| `DATABASE_URL` is undefined | API route работает в Edge runtime | `export const runtime = 'nodejs'` |
| `.env` перезаписывает Vercel vars | Файл лежит рядом с кодом | Убрать `.env` из git (не должен быть в репо) |
| `NEXT_PUBLIC_` не изменились после `vercel env update` | JS-бандл скомпилирован со старым значением | Очистить переменную на Vercel, `vercel --prod` (перебилдить) |
| Ky строит `GET /products` вместо `/api/products` | `prefixUrl: ''` в браузере | `prefixUrl: '/api'` |
| Prisma timeout при cold start | Direct connection без connection pooling | Pooler string (`-pooler.`) или `db push` через Vercel cron |
| `vercel env update` зависает | Интерактивный prompt | Пипинг значения: `echo "val" | npx vercel env update NAME production` |
| CLI не находит проект | `vercel project link` не выполнен | `npx vercel` в директории frontend — автоопределение |

---

## 📋 Чек-лист перед деплоем

```
[ ] .env НЕ в git (git status чистый)
[ ] DATABASE_URL в Vercel env (не в .env файле)
[ ] JWT_SECRET установлен как secret в Vercel
[ ] API routes: runtime = 'nodejs'
[ ] Server components для каталога (не client-side fetch)
[ ] API route handlers обёрнуты в try-catch
[ ] Prisma generate + db push выполнены
[ ] Seed выполнил (продукты, категории, админ)
[ ] NEXT_PUBLIC_API_URL не направлен на устаревший бэкенд
[ ] Deployment Protection отключён (если Team-аккаунт)
[ ] yarn build / npm build проходит без ошибок
```

---

## 🎯 Быстрый старт нового проекта

```bash
# 1. Клонировать репо и скопировать frontend
cp -r frontend frontend-new
cd frontend-new

# 2. Обновить package.json и зависимости
npm install @prisma/client bcryptjs jsonwebtoken passport-jwt class-validator class-transformer

# 3. Обновить Prisma schema
#    (проект-специфичные модели: категории, продукты, пицца и т.д.)

# 4. Обнови API routes — путь
#    (src/app/api/[...path]/route.ts — обрабатываем новые эндпоинты)

# 5. Локальный запуск
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev

# 6. Деплой
npx vercel (первый деплой — создаст проект)
npx vercel env update DATABASE_URL production --yes << 'EOF'
<database_url>
EOF
npx vercel --prod

# 7. Готово — открыть URL из Vercel
```

---

## 💡 На что обращать внимание

1. **Сервер рендерит, клиент фильтрует.** Server component для каталога, client component для интерактивных фильтров. Кэша не падает.
2. **API-URL: `/api` — не пустая строка.** Мелочь, но складывается в `GET /products` вместо `/api/products`.
3. **Node.js runtime для БД.** Edge functions не видят `process.env.DATABASE_URL`.
4. **Catch-all для всех API.** Один route-файл для всех эндпоинтов — проще поддерживать, меньше файлов.
5. **Не выноси `.env` в git.** Ни `.env`, ни `.env.production`. Vercel env vars — единственный источник правды.
