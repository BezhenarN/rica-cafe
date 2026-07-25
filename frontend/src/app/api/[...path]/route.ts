import { NextRequest, NextResponse } from 'next/server';

/** Use Node.js runtime so environment variables are available */
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'insecure_dev_secret';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Parse path segments from the request URL after "/api/" */
function getPath(request: NextRequest): string[] {
  const segments = request.nextUrl.pathname.split('/api/')[1] || '';
  if (!segments) return [];
  return segments.split('/').filter(Boolean);
}

/** Send a JSON response with an error status */
function errorResponse(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Safely parse a boolean query param: 'true' or '1' → true, everything else → false */
function toBool(v: string | null): boolean {
  return v === 'true' || v === '1';
}

/** Verify JWT from Authorization header, return payload or null. */
function getAuthPayload(request: NextRequest): { sub: string; email: string; role: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return verifyToken(token);
}

/** Require auth — return payload or error response. */
function requireAuth(request: NextRequest): { payload: { sub: string; email: string; role: string }; error?: undefined } | { error: NextResponse; payload?: undefined } {
  const payload = getAuthPayload(request);
  if (!payload) return { error: errorResponse('Unauthorized', 401) };
  return { payload };
}

/** Require ADMIN role. */
function requireAdmin(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth;
  if (auth.payload.role !== 'ADMIN') return { error: errorResponse('Forbidden', 403) };
  return auth;
}

// ─────────────────────────────────────────────
// GET handlers
// ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const path = getPath(request);

  // ── health ──
  if (path[0] === 'health') {
    return NextResponse.json({ status: 'ok' });
  }

  // ── categories ──
  if (path[0] === 'categories' && path.length === 1) {
    try {
      const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
      return NextResponse.json(categories);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[categories] error:', msg.slice(0, 500));
      return NextResponse.json([]);
    }
  }

  // ── featured products ──
  if (path[0] === 'products' && path[1] === 'featured' && path.length === 2) {
    const limit = Number(request.nextUrl.searchParams.get('limit')) || 8;
    try {
      const products = await prisma.product.findMany({
        where: { isAvailable: true, isFeatured: true },
        orderBy: { sortOrder: 'asc' },
        take: limit,
        include: { category: { select: { slug: true, name: true } }, variants: { orderBy: { price: 'asc' } } },
      });
      return NextResponse.json(products);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[featured products] error:', msg.slice(0, 500));
      return NextResponse.json([]);
    }
  }

  // ── single product by slug ──
  if (path[0] === 'products' && path.length === 2 && path[1] !== 'featured') {
    const slug = path[1];
    try {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: { category: { select: { slug: true, name: true } }, variants: { orderBy: { price: 'asc' } } },
      });
      if (!product) return errorResponse('Товар не найден', 404);
      return NextResponse.json(product);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[product by slug] error:', msg.slice(0, 500));
      return errorResponse('Товар не найден', 404);
    }
  }

  // ── catalog products list with filters ──
  if (path[0] === 'products' && path.length === 1) {
    const category = request.nextUrl.searchParams.get('category') ?? undefined;
    const q = request.nextUrl.searchParams.get('q') ?? undefined;
    const vegan = toBool(request.nextUrl.searchParams.get('vegan'));
    const spicy = toBool(request.nextUrl.searchParams.get('spicy'));
    const sort = request.nextUrl.searchParams.get('sort') ?? undefined;

    const where: Record<string, unknown> = { isAvailable: true };
    if (category) where.category = { slug: category };
    if (vegan) where.isVegan = true;
    if (spicy) where.isSpicy = true;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ];
    }

    const orderBy: Record<string, unknown>[] = (() => {
      switch (sort) {
        case 'price_asc': return [{ basePrice: 'asc' }];
        case 'price_desc': return [{ basePrice: 'desc' }];
        case 'name': return [{ name: 'asc' }];
        default: return [{ isFeatured: 'desc' }, { sortOrder: 'asc' }];
      }
    })();

    try {
      const products = await prisma.product.findMany({
        where, orderBy,
        include: { category: { select: { id: true, name: true, slug: true } }, variants: { orderBy: { price: 'asc' } } },
      });
      return NextResponse.json(products);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[products catalog] error:', msg.slice(0, 500));
      return NextResponse.json([]);
    }
  }

  // ── pizza options ──
  if (path[0] === 'pizza' && path[1] === 'options' && path.length === 2) {
    try {
      const sizes = await prisma.pizzaSize.findMany({ orderBy: { sortOrder: 'asc' } });
      const dough = await prisma.doughOption.findMany();
      const sauces = await prisma.sauce.findMany({ orderBy: { sortOrder: 'asc' } });
      const ingredients = await prisma.ingredient.findMany({
        where: { isAvailable: true },
        orderBy: { sortOrder: 'asc' },
      });
      return NextResponse.json({ sizes, dough, sauces, ingredients });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[pizza options] error:', msg.slice(0, 500));
      return NextResponse.json({ sizes: [], dough: [], sauces: [], ingredients: [] });
    }
  }

  // ── auth/me ──
  if (path[0] === 'auth' && path[1] === 'me' && path.length === 2) {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;
    try {
      const user = await prisma.user.findUnique({
        where: { id: auth.payload.sub },
        select: { id: true, email: true, name: true, phone: true, role: true },
      });
      if (!user) return errorResponse('Unauthorized', 401);
      return NextResponse.json(user);
    } catch {
      return errorResponse('Unauthorized', 401);
    }
  }

  // ── orders/mine ──
  if (path[0] === 'orders' && path[1] === 'mine' && path.length === 2) {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;
    try {
      const orders = await prisma.order.findMany({
        where: { userId: auth.payload.sub },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      });
      return NextResponse.json(orders);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[orders/mine] error:', msg.slice(0, 500));
      return NextResponse.json([]);
    }
  }

  // ── orders/[id] ──
  if (path[0] === 'orders' && path.length === 2 && !['mine', 'status'].includes(path[1])) {
    const orderId = path[1];
    const auth = requireAuth(request);
    if (auth.error) return auth.error;
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) return errorResponse('Заказ не найден', 404);
      // Allow access only to own orders or admins
      if (order.userId !== auth.payload.sub && auth.payload.role !== 'ADMIN') {
        return errorResponse('Forbidden', 403);
      }
      return NextResponse.json(order);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[orders/id] error:', msg.slice(0, 500));
      return errorResponse('Заказ не найден', 404);
    }
  }

  // ── orders/[id]/status (polling) ──
  if (path[0] === 'orders' && path[2] === 'status' && path.length === 3) {
    const orderId = path[1];
    const auth = requireAuth(request);
    if (auth.error) return auth.error;
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, publicNumber: true, status: true, statusUpdatedAt: true, total: true, paymentMethod: true, userId: true },
      });
      if (!order) return errorResponse('Заказ не найден', 404);
      if (order.userId !== auth.payload.sub && auth.payload.role !== 'ADMIN') {
        return errorResponse('Forbidden', 403);
      }
      return NextResponse.json(order);
    } catch {
      return errorResponse('Заказ не найден', 404);
    }
  }

  // ── users/me/addresses ──
  if (path[0] === 'users' && path[1] === 'me' && path[2] === 'addresses' && path.length === 3) {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;
    try {
      const addresses = await prisma.address.findMany({
        where: { userId: auth.payload.sub },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      return NextResponse.json(addresses);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[addresses] error:', msg.slice(0, 500));
      return NextResponse.json([]);
    }
  }

  // ── admin/orders ──
  if (path[0] === 'admin' && path[1] === 'orders' && path.length === 2) {
    const admin = requireAdmin(request);
    if (admin.error) return admin.error;
    const status = request.nextUrl.searchParams.get('status') ?? undefined;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    try {
      const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      });
      return NextResponse.json(orders);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[admin/orders] error:', msg.slice(0, 500));
      return NextResponse.json([]);
    }
  }

  // ── admin/products ──
  if (path[0] === 'admin' && path[1] === 'products' && path.length === 2) {
    const admin = requireAdmin(request);
    if (admin.error) return admin.error;
    try {
      const products = await prisma.product.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          category: { select: { name: true, slug: true } },
          variants: { orderBy: { price: 'asc' } },
        },
      });
      return NextResponse.json(products);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[admin/products] error:', msg.slice(0, 500));
      return NextResponse.json([]);
    }
  }

  return errorResponse('Not found', 404);
}

// ─────────────────────────────────────────────
// POST handlers
// ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const path = getPath(request);

  // ── auth/register ──
  if (path[0] === 'auth' && path[1] === 'register' && path.length === 2) {
    try {
      const body = await request.json();
      const { email, password, name, phone } = body;
      if (!email || !password) return errorResponse('Email и пароль обязательны', 400);

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return errorResponse('Пользователь с таким email уже существует', 409);

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, passwordHash, name: name || null, phone: phone || null, role: 'CUSTOMER' },
        select: { id: true, email: true, name: true, phone: true, role: true },
      });

      const accessToken = jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' },
      );
      return NextResponse.json({ accessToken, user });
    } catch {
      return errorResponse('Неверный формат данных');
    }
  }

  // ── auth/login ──
  if (path[0] === 'auth' && path[1] === 'login' && path.length === 2) {
    try {
      const body = await request.json();
      const { email, password } = body;
      if (!email || !password) return errorResponse('Email и пароль обязательны', 400);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return errorResponse('Неверный email или пароль', 401);

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return errorResponse('Неверный email или пароль', 401);

      const userRecord = { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role };
      const accessToken = jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' },
      );
      return NextResponse.json({ accessToken, user: userRecord });
    } catch {
      return errorResponse('Неверный формат данных');
    }
  }

  // ── orders (create) ──
  if (path[0] === 'orders' && path.length === 1) {
    try {
      const body = await request.json();
      const {
        items, pizzas, paymentMethod, deliveryType,
        name, phone, email, street, building, apt, floor, entrance, comment, addressComment,
      } = body;

      if (!paymentMethod) return errorResponse('Способ оплаты обязателен', 400);
      if (!name || !phone) return errorResponse('Имя и телефон обязательны', 400);
      if (deliveryType === 'DELIVERY' && (!street || !building)) {
        return errorResponse('Адрес доставки обязателен', 400);
      }

      // Auth is optional — guests can order
      const authPayload = getAuthPayload(request);

      // ── Server-side price recalculation ──
      let itemsTotal = 0;
      const orderItems: { name: string; unitPrice: number; quantity: number; productId: string | null; configSummary: string | null }[] = [];

      // Catalog items
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: { variants: true },
          });
          if (!product) return errorResponse(`Товар ${item.productId} не найден`, 400);

          const variant = product.variants.find((v) => v.name === item.variantName);
          if (!variant) return errorResponse(`Вариант "${item.variantName}" не найден`, 400);

          const unitPrice = Number(variant.price);
          itemsTotal += unitPrice * item.quantity;
          orderItems.push({
            name: product.name,
            unitPrice,
            quantity: item.quantity,
            productId: product.id,
            configSummary: item.variantName || null,
          });
        }
      }

      // Custom pizzas
      if (pizzas && Array.isArray(pizzas)) {
        for (const pizza of pizzas) {
          const size = await prisma.pizzaSize.findUnique({ where: { id: pizza.sizeId } });
          const dough = await prisma.doughOption.findUnique({ where: { id: pizza.doughId } });
          const sauce = await prisma.sauce.findUnique({ where: { id: pizza.sauceId } });
          if (!size || !dough || !sauce) return errorResponse('Опция пиццы не найдена', 400);

          const ingredientRecords = await prisma.ingredient.findMany({
            where: { id: { in: pizza.ingredientIds } },
          });

          let pizzaPrice = Number(size.basePrice) + Number(dough.price) + Number(sauce.price);
          const ingNames: string[] = [];
          for (const ing of ingredientRecords) {
            pizzaPrice += Number(ing.price);
            ingNames.push(ing.name);
          }
          pizzaPrice *= pizza.quantity;
          itemsTotal += pizzaPrice;

          orderItems.push({
            name: `Пицца ${size.name} (конструктор)`,
            unitPrice: Number(size.basePrice) + Number(dough.price) + Number(sauce.price) + ingredientRecords.reduce((s, i) => s + Number(i.price), 0),
            quantity: pizza.quantity,
            productId: null,
            configSummary: [size.name, dough.name, `соус "${sauce.name}"`, ...ingNames].join(', '),
          });
        }
      }

      if (orderItems.length === 0) return errorResponse('Корзина пуста', 400);

      // Delivery cost
      const DELIVERY_FEE = 149;
      const FREE_FROM = 1500;
      const deliveryCost = deliveryType === 'PICKUP' ? 0 : (itemsTotal >= FREE_FROM ? 0 : DELIVERY_FEE);
      const total = itemsTotal + deliveryCost;

      const order = await prisma.order.create({
        data: {
          userId: authPayload?.sub ?? null,
          guestName: name,
          guestPhone: phone,
          guestEmail: email || null,
          status: 'CREATED',
          paymentMethod: paymentMethod ?? 'CASH',
          deliveryType: deliveryType ?? 'DELIVERY',
          street: street || null,
          building: building || null,
          apt: apt || null,
          floor: floor || null,
          entrance: entrance || null,
          addressComment: addressComment || null,
          comment: comment || null,
          deliveryCost,
          itemsTotal,
          total,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      return NextResponse.json(order);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[orders create] error:', msg.slice(0, 500));
      return errorResponse('Ошибка создания заказа');
    }
  }

  // ── admin/orders/[id]/status — handled via POST here since PATCH comes separately ──
  // (we'll handle it in PATCH below)

  // ── admin/products (create) ──
  if (path[0] === 'admin' && path[1] === 'products' && path.length === 2) {
    const admin = requireAdmin(request);
    if (admin.error) return admin.error;
    try {
      const body = await request.json();
      const { slug, name, description, categoryId, basePrice, weight, kcal, isVegan, isSpicy, isFeatured, isAvailable, variants } = body;
      if (!slug || !name || !categoryId || basePrice == null) {
        return errorResponse('slug, name, categoryId, basePrice обязательны', 400);
      }

      const product = await prisma.product.create({
        data: {
          slug, name,
          description: description || null,
          categoryId,
          basePrice: Number(basePrice),
          weight: weight ? Number(weight) : null,
          kcal: kcal ? Number(kcal) : null,
          isVegan: Boolean(isVegan),
          isSpicy: Boolean(isSpicy),
          isFeatured: Boolean(isFeatured),
          isAvailable: isAvailable === undefined ? true : Boolean(isAvailable),
          variants: variants ? {
            create: variants.map((v: { name: string; price: number; isDefault?: boolean }) => ({
              name: v.name,
              price: Number(v.price),
              isDefault: Boolean(v.isDefault),
            })),
          } : undefined,
        },
        include: { category: { select: { name: true, slug: true } }, variants: true },
      });
      return NextResponse.json(product);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[admin/products create] error:', msg.slice(0, 500));
      if (msg.includes('Unique')) return errorResponse('Такой slug уже существует', 409);
      return errorResponse('Ошибка создания товара');
    }
  }

  // ── users/me/addresses (create) ──
  if (path[0] === 'users' && path[1] === 'me' && path[2] === 'addresses' && path.length === 3) {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;
    try {
      const body = await request.json();
      if (!body.street || !body.building) return errorResponse('Улица и дом обязательны', 400);

      // If this is the first address, make it default
      const existingCount = await prisma.address.count({ where: { userId: auth.payload.sub } });
      const address = await prisma.address.create({
        data: {
          userId: auth.payload.sub,
          label: body.label || null,
          street: body.street,
          building: body.building,
          apt: body.apt || null,
          floor: body.floor || null,
          entrance: body.entrance || null,
          comment: body.comment || null,
          isDefault: existingCount === 0,
        },
      });
      return NextResponse.json(address);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[address create] error:', msg.slice(0, 500));
      return errorResponse('Ошибка создания адреса');
    }
  }

  // ── users/me/addresses/[id]/default ──
  // Path segments: ['users', 'me', 'addresses', id, 'default']
  if (path[0] === 'users' && path[1] === 'me' && path[2] === 'addresses' && path[4] === 'default' && path.length === 5) {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;
    const addressId = path[3];
    try {
      // Unset all defaults, then set this one
      await prisma.address.updateMany({ where: { userId: auth.payload.sub }, data: { isDefault: false } });
      const address = await prisma.address.update({
        where: { id: addressId, userId: auth.payload.sub },
        data: { isDefault: true },
      });
      if (!address) return errorResponse('Адрес не найден', 404);
      return NextResponse.json(address);
    } catch {
      return errorResponse('Адрес не найден', 404);
    }
  }

  return errorResponse('Not found', 404);
}

// ─────────────────────────────────────────────
// PATCH handlers
// ─────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const path = getPath(request);

  // ── admin/orders/[id]/status ──
  if (path[0] === 'admin' && path[1] === 'orders' && path[3] === 'status' && path.length === 4) {
    const admin = requireAdmin(request);
    if (admin.error) return admin.error;
    const orderId = path[2];
    try {
      const body = await request.json();
      const { status } = body;
      const validStatuses = ['CREATED', 'CONFIRMED', 'COOKING', 'ON_THE_WAY', 'DELIVERED', 'CANCELED'];
      if (!validStatuses.includes(status)) return errorResponse('Некорректный статус', 400);

      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status, statusUpdatedAt: new Date() },
        include: { items: true },
      });
      return NextResponse.json(order);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[admin/order/status] error:', msg.slice(0, 500));
      return errorResponse('Ошибка обновления статуса');
    }
  }

  // ── admin/products/[id] (update) ──
  // Path segments: ['admin', 'products', id]
  if (path[0] === 'admin' && path[1] === 'products' && path.length === 3) {
    const admin = requireAdmin(request);
    if (admin.error) return admin.error;
    const productId = path[2];
    try {
      const body = await request.json();
      const data: Record<string, unknown> = {};
      if (body.slug !== undefined) data.slug = body.slug;
      if (body.name !== undefined) data.name = body.name;
      if (body.description !== undefined) data.description = body.description || null;
      if (body.categoryId !== undefined) data.categoryId = body.categoryId;
      if (body.basePrice !== undefined) data.basePrice = Number(body.basePrice);
      if (body.weight !== undefined) data.weight = body.weight ? Number(body.weight) : null;
      if (body.kcal !== undefined) data.kcal = body.kcal ? Number(body.kcal) : null;
      if (body.isVegan !== undefined) data.isVegan = Boolean(body.isVegan);
      if (body.isSpicy !== undefined) data.isSpicy = Boolean(body.isSpicy);
      if (body.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured);
      if (body.isAvailable !== undefined) data.isAvailable = Boolean(body.isAvailable);
      if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

      const product = await prisma.product.update({
        where: { id: productId },
        data,
        include: { category: { select: { name: true, slug: true } }, variants: true },
      });

      // Update variants if provided
      if (body.variants && Array.isArray(body.variants)) {
        // Delete old variants and create new ones
        await prisma.productVariant.deleteMany({ where: { productId } });
        await prisma.productVariant.createMany({
          data: body.variants.map((v: { name: string; price: number; isDefault?: boolean }) => ({
            productId,
            name: v.name,
            price: Number(v.price),
            isDefault: Boolean(v.isDefault ?? false),
          })),
        });
      }

      // Re-fetch with variants
      const updated = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: { select: { name: true, slug: true } }, variants: true },
      });
      return NextResponse.json(updated);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[admin/product update] error:', msg.slice(0, 500));
      return errorResponse('Ошибка обновления товара');
    }
  }

  // ── admin/products/[id]/availability ──
  // Path segments: ['admin', 'products', id, 'availability']
  if (path[0] === 'admin' && path[1] === 'products' && path[3] === 'availability' && path.length === 4) {
    const admin = requireAdmin(request);
    if (admin.error) return admin.error;
    const productId = path[2];
    try {
      const body = await request.json();
      const product = await prisma.product.update({
        where: { id: productId },
        data: { isAvailable: Boolean(body.isAvailable) },
      });
      return NextResponse.json(product);
    } catch {
      return errorResponse('Товар не найден', 404);
    }
  }

  // ── users/me (update profile) ──
  if (path[0] === 'users' && path[1] === 'me' && path.length === 2) {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;
    try {
      const body = await request.json();
      const data: Record<string, unknown> = {};
      if (body.name !== undefined) data.name = body.name || null;
      if (body.phone !== undefined) data.phone = body.phone || null;

      const user = await prisma.user.update({
        where: { id: auth.payload.sub },
        data,
        select: { id: true, email: true, name: true, phone: true, role: true },
      });
      return NextResponse.json(user);
    } catch {
      return errorResponse('Ошибка обновления профиля');
    }
  }

  // ── users/me/addresses/[id] (update address) ──
  // Path segments: ['users', 'me', 'addresses', id]
  if (path[0] === 'users' && path[1] === 'me' && path[2] === 'addresses' && path.length === 4) {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;
    const addressId = path[3];
    try {
      const body = await request.json();
      const data: Record<string, unknown> = {};
      if (body.label !== undefined) data.label = body.label || null;
      if (body.street !== undefined) data.street = body.street;
      if (body.building !== undefined) data.building = body.building;
      if (body.apt !== undefined) data.apt = body.apt || null;
      if (body.floor !== undefined) data.floor = body.floor || null;
      if (body.entrance !== undefined) data.entrance = body.entrance || null;
      if (body.comment !== undefined) data.comment = body.comment || null;

      const address = await prisma.address.update({
        where: { id: addressId, userId: auth.payload.sub },
        data,
      });
      return NextResponse.json(address);
    } catch {
      return errorResponse('Адрес не найден', 404);
    }
  }

  return errorResponse('Not found', 404);
}

// ─────────────────────────────────────────────
// DELETE handlers
// ─────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const path = getPath(request);

  // ── admin/products/[id] ──
  if (path[0] === 'admin' && path[1] === 'products' && path.length === 3) {
    const admin = requireAdmin(request);
    if (admin.error) return admin.error;
    const productId = path[2];
    try {
      await prisma.productVariant.deleteMany({ where: { productId } });
      await prisma.product.delete({ where: { id: productId } });
      return NextResponse.json({ success: true });
    } catch {
      return errorResponse('Товар не найден', 404);
    }
  }

  // ── users/me/addresses/[id] ──
  // Path segments: ['users', 'me', 'addresses', id]
  if (path[0] === 'users' && path[1] === 'me' && path[2] === 'addresses' && path.length === 4) {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;
    const addressId = path[3];
    try {
      await prisma.address.delete({ where: { id: addressId, userId: auth.payload.sub } });
      return NextResponse.json({ success: true });
    } catch {
      return errorResponse('Адрес не найден', 404);
    }
  }

  return errorResponse('Not found', 404);
}
