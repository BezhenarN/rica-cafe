# Crudo — кафе с доставкой пиццы и готовых блюд

Production-ready MVP: каталог с фильтрами, конструктор пиццы, корзина, чекаут, живой трекинг заказа, личный кабинет, админ-панель, PWA, SEO.

---

## Стек

| Слой | Технологии |
|---|---|
| **Frontend** | Next.js 15 (App Router, SSR/ISR), React 19, TypeScript, TailwindCSS, Framer Motion, Zustand, React Query (TanStack), ky, react-hook-form + zod |
| **Backend** | NestJS 10, TypeScript, Prisma ORM, Passport + JWT, WebSocket (socket.io), Swagger |
| **БД** | PostgreSQL 16 (Docker) |

## Структура проекта

```
├── frontend/               # Next.js 15
│   ├── src/
│   │   ├── app/             # App Router страницы
│   │   ├── components/      # UI-примитивы, фич-компоненты, layout
│   │   ├── hooks/           # React Query хуки
│   │   ├── lib/             # API-клиент, типы, утилиты
│   │   └── store/           # Zustand (cart, auth, ui)
│   └── public/              # manifest, SVG-иконки
├── backend/                # NestJS
│   ├── src/
│   │   ├── auth/            # JWT, регистрация/вход
│   │   ├── users/           # Профиль, адреса
│   │   ├── products/        # Каталог, категории
│   │   ├── pizza-builder/   # Опции конструктора
│   │   ├── orders/          # Заказы + админ CRUD
│   │   └── common/          # PrismaService
│   └── prisma/              # schema.prisma, seed.ts
├── docker-compose.yml      # PostgreSQL + pgAdmin
└── README.md
```

---

## Предпосылки

- **Node.js** ≥ 20 (рекомендуется [fnm](https://github.com/Schniz/fnm) или [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** (рекомендуется) или npm
- **Docker Desktop** (для PostgreSQL; установите с [docker.com](https://www.docker.com/products/docker-desktop/))

---

## Быстрый старт

### 1. PostgreSQL

```bash
docker compose up -d          # стартуем PostgreSQL (порт 5432)
```

Опционально — pgAdmin на порту 5050:

```bash
docker compose --profile tools up -d
```

### 2. Backend

```bash
cd backend
pnpm install               # или npm install
cp .env.example .env        # заполните переменные (JWT_SECRET!)

# Генерация Prisma-клиента + миграции + seed (товары, категории, админ)
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Dev-сервер на :3001
pnpm start:dev
```

Swagger-документация: http://localhost:3001/api/docs

> **Дефолтный админ:** admin@crudo.local / admin12345

### 3. Frontend

```bash
cd frontend
pnpm install               # или npm install
cp .env.local.example .env.local

# Dev-сервер на :3000 (проксирует /api → backend :3001)
pnpm dev
```

Откройте http://localhost:3000.

---

## Переменные окружения

### Backend (.env)

| Переменная | По умолчанию | Описание |
|---|---|---|
| `PORT` | `3001` | Порт API |
| `CORS_ORIGIN` | `http://localhost:3000` | URL фронтенда |
| `JWT_SECRET` | — **обязательно** | Секрет для JWT-токенов |
| `JWT_EXPIRES_IN` | `7d` | Срок жизни токена |
| `DATABASE_URL` | `postgresql://crudo:crudo_pass@localhost:5432/crudo` | Строка подключения |
| `ADMIN_EMAIL` | `admin@crudo.local` | Email админа при seed |
| `ADMIN_PASSWORD` | `admin12345` | Пароль админа при seed |

### Frontend (.env.local)

| Переменная | По умолчанию | Описание |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Публичный URL API (для prod) |
| `BACKEND_URL` | `http://localhost:3001` | Для SSR-запросов и прокси |

---

## Фичи

### Каталог
- Категории с иконками на главной
- Фильтры: категория, веган, острое, текстовый поиск
- Сортировка: по популярности, цене, названию
- Детальная карточка с выбором варианта (размер/порция)

### Конструктор пиццы
- Выбор размера, типа теста, соуса, ингредиентов
- Live-пересчёт цены
- Лимит ингредиентов по размеру
- Добавление в корзину как кастомная пицца

### Корзина
- Persist в localStorage (Zustand)
- Дедупликация одинаковых товаров
- Выезжающий drawer (Sheet) + отдельная страница
- Бесплатная доставка от 1500 ₽

### Оформление заказа
- Форма контактов + адрес доставки
- Выбор оплаты (наличные / карта при получении)
- Серверный пересчёт цен (защита от подделки)
- Экран успешного заказа с кнопкой трекинга

### Трекинг заказа
- Polling каждые 5 сек (GET /orders/:id/status)
- WebSocket push (NestJS socket.io гейтвей)
- Анимированный вертикальный таймлайн
- Состав заказа, детали доставки

### Личный кабинет
- Вход / регистрация
- Профиль (имя, телефон)
- История заказов с фильтром по статусу
- Управление адресами доставки (CRUD, основной адрес)

### Админ-панель (/admin)
- Список заказов с фильтром по статусу
- Смена статуса заказа (пушит обновление трекинга)
- Управление товарами: показать/скрыть

### PWA
- manifest.json, SVG-иконка
- Mobile-nav (нижняя панель, как нативное приложение)
- Может быть установлена на телефон (Add to Home Screen)

### SEO
- SSR/ISR для каталога
- Meta, Open Graph, Twitter Card
- JSON-LD (MenuItem, Restaurant)
- sitemap.xml (динамический, на основе товаров)
- robots.txt
- Семантический HTML, lazy-load, accessibility

---

## Как заменить SVG-плейсхолдеры на реальные фото

1. Положите изображения в `frontend/public/images/` (например, `pizza-margherita.webp`).
2. В бэкенде: добавьте поле `image` (string) в `Product` в Prisma-схеме и храните путь `/images/pizza-margherita.webp`.
3. На фронтенде: замените `<ProductImage imageType={...} />` на `<Image src={product.image} alt={product.name} fill />` из `next/image`.

---

## Архитектурные решения

- **Серверный пересчёт цен**: при `POST /orders` бэкенд заново вычисляет все цены из БД. Клиент может только предложить состав; реальные цены и валидация лимитов — на сервере.
- **Cart persist**: корзина живёт в localStorage через Zustand persist — не требует авторизации и не генерирует запросов.
- **Polling + WS**: трекинг работает на polling (простой, надёжный). WebSocket гейтвей на бэкенде дополнительно пушит обновления подключённым клиентам.
- **Прокси**: в dev Next.js проксирует `/api/*` на бэкенд, устраняя CORS в браузере.

---

## Roadmap (не вошло в MVP)

- [ ] Бонусная программа (накопление/списание баллов)
- [ ] Рекомендации на основе покупок
- [ ] Интеграция Telegram / WhatsApp (уведомления, бот)
- [ ] Платёжный шлюз (ЮKassa, Тинькофф)
- [ ] Отзывы и рейтинги товаров
- [ ] Мульти-заведение / филиалы
- [ ] i18n (английская версия)
- [ ] E2E и unit-тесты (Playwright, Vitest)
- [ ] CI/CD (GitHub Actions)

---

## Лицензия

Демонстрационный проект. Используйте как стартовый шаблон.
