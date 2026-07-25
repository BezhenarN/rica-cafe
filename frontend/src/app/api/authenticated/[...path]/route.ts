import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, JwtPayload } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { Decimal } from '@prisma/client/runtime/library';
import type { Prisma } from '@prisma/client';
import type { OrderStatus, PaymentMethod, ImageType } from '@prisma/client';

// ── helpers ──────────────────────────────────────────────────────────────────

function jwtFromHeader(req: NextRequest): JwtPayload | null {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  return verifyToken(token);
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

// ── users/me ─────────────────────────────────────────────────────────────────

interface UpdateProfileBody {
  name?: string;
  phone?: string;
}

async function handlePatchUsersMe(req: NextRequest, user: JwtPayload) {
  const { sub: userId } = user;
  const body = await req.json() as UpdateProfileBody;
  const data: UpdateProfileBody = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.phone !== undefined) data.phone = body.phone;
  return json(
    await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, phone: true, role: true },
    }),
  );
}

// ── users/me/addresses ───────────────────────────────────────────────────────

interface AddressInput {
  label?: string;
  street: string;
  building: string;
  apt?: string;
  floor?: string;
  entrance?: string;
  comment?: string;
}

async function handleGetAddresses(req: NextRequest, user: JwtPayload) {
  const { sub: userId } = user;
  return json(
    await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    }),
  );
}

async function handlePostAddress(req: NextRequest, user: JwtPayload) {
  const { sub: userId } = user;
  const body = await req.json() as AddressInput;

  return json(
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const count = await tx.address.count({ where: { userId } });
      const isFirst = count === 0;
      if (isFirst) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }
      return tx.address.create({
        data: { ...body, userId, isDefault: true },
      });
    }),
  );
}

interface AddressUpdateBody {
  label?: string;
  street?: string;
  building?: string;
  apt?: string;
  floor?: string;
  entrance?: string;
  comment?: string;
}

async function handlePatchAddress(req: NextRequest, user: JwtPayload, addressId: string) {
  const { sub: userId } = user;
  const body = await req.json() as AddressUpdateBody;

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) return json({ error: 'Address not found' }, 404);

  return json(await prisma.address.update({ where: { id: addressId }, data: body }));
}

async function handleDeleteAddress(req: NextRequest, user: JwtPayload, addressId: string) {
  const { sub: userId } = user;

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) return json({ error: 'Address not found' }, 404);

  await prisma.address.delete({ where: { id: addressId } });
  return json({ ok: true });
}

async function handleSetDefaultAddress(req: NextRequest, user: JwtPayload, addressId: string) {
  const { sub: userId } = user;

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) return json({ error: 'Address not found' }, 404);

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);

  return json(await prisma.address.findUnique({ where: { id: addressId } }));
}

// ── types for order payload ──────────────────────────────────────────────────

interface CatalogItemInput {
  productId: string;
  variantName: string;
  quantity: number;
}

interface CustomPizzaInput {
  sizeId: string;
  doughId: string;
  sauceId: string;
  ingredientIds: string[];
  quantity: number;
}

interface CreateOrderBody {
  items?: CatalogItemInput[];
  pizzas?: CustomPizzaInput[];
  paymentMethod?: string;
  deliveryType?: string;
  name?: string;
  phone?: string;
  email?: string;
  street?: string;
  building?: string;
  apt?: string;
  floor?: string;
  entrance?: string;
  addressComment?: string;
  comment?: string;
}

interface OrderItemInput {
  name: string;
  unitPrice: Decimal;
  quantity: number;
  configSummary?: string;
  productId?: string;
}

// ── orders (user) ────────────────────────────────────────────────────────────

async function handlePostOrder(req: NextRequest, user: JwtPayload) {
  const { sub: userId } = user;
  const body = await req.json() as CreateOrderBody;
  const items = body.items ?? [];
  const pizzas = body.pizzas ?? [];

  // Validate cart not empty
  if (items.length === 0 && pizzas.length === 0) {
    return json({ error: 'Cart is empty' }, 400);
  }

  // Guest orders require contacts
  if (!userId && (!body.phone || !body.name)) {
    return json({ error: 'Provide name and phone for guest order' }, 400);
  }

  const deliveryType = body.deliveryType ?? 'DELIVERY';

  // DELIVERY requires street + building
  if (deliveryType === 'DELIVERY' && (!body.street || !body.building)) {
    return json({ error: 'Delivery address required' }, 400);
  }

  const orderItems: OrderItemInput[] = [];

  // Catalog items — lookup from DB (isAvailable:true), match variant by name
  if (items.length) {
    const itemsById = new Map<string, CatalogItemInput>(
      items.map((i) => [i.productId, i])
    );
    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(itemsById.keys()) }, isAvailable: true },
      include: { variants: true },
    });
    for (const product of products) {
      const line = itemsById.get(product.id);
      if (!line) continue;
      const variant = product.variants.find((v: { name: string }) => v.name === line.variantName);
      if (!variant) continue;
      orderItems.push({
        productId: product.id,
        name: `${product.name}, ${variant.name}`,
        unitPrice: variant.price,
        quantity: line.quantity,
      });
    }
  }

  // Custom pizzas — price from DB lookup
  if (pizzas.length) {
    const sizeIds = pizzas.map((p) => p.sizeId);
    const doughIds = pizzas.map((p) => p.doughId);
    const sauceIds = pizzas.map((p) => p.sauceId);
    const ingredientIds = Array.from(new Set(pizzas.flatMap((p) => p.ingredientIds)));

    const [sizes, doughOpts, sauces, ingredients] = await Promise.all([
      prisma.pizzaSize.findMany({ where: { id: { in: sizeIds } } }),
      prisma.doughOption.findMany({ where: { id: { in: doughIds } } }),
      prisma.sauce.findMany({ where: { id: { in: sauceIds } } }),
      prisma.ingredient.findMany({
        where: { id: { in: ingredientIds }, isAvailable: true },
      }),
    ]);

    for (const p of pizzas) {
      const size = sizes.find((s: { id: string; name: string; maxIngredients: number; basePrice: Decimal }) => s.id === p.sizeId);
      const dough = doughOpts.find((d: { id: string; name: string; price: Decimal }) => d.id === p.doughId);
      const sauce = sauces.find((s: { id: string; name: string; price: Decimal }) => s.id === p.sauceId);
      if (!size || !dough || !sauce) {
        return json({ error: 'Invalid pizza configuration' }, 400);
      }
      if (p.ingredientIds.length > size.maxIngredients) {
        return json({ error: `Exceeded max ingredients for size "${size.name}"` }, 400);
      }
      const chosen = p.ingredientIds
        .map((id) => ingredients.find((i: { id: string; name: string; price: Decimal }) => i.id === id))
        .filter(Boolean) as NonNullable<typeof ingredients[number]>[];
      if (chosen.length !== p.ingredientIds.length) {
        return json({ error: 'One or more ingredients unavailable' }, 400);
      }

      const unit = size.basePrice
        .plus(dough.price)
        .plus(sauce.price)
        .plus(chosen.reduce((s, i) => s.plus(i.price), new Decimal(0)));

      const summaryParts = [
        size.name,
        dough.name.toLowerCase(),
        `sauce "${sauce.name}"`,
        chosen.length ? `+ ${chosen.map((i) => i.name).join(', ')}` : '',
      ].filter(Boolean);

      orderItems.push({
        name: `Pizza ${size.name} (custom)`,
        unitPrice: unit,
        quantity: p.quantity,
        configSummary: summaryParts.join(' · '),
      });
    }
  }

  // Calculate totals
  const itemsTotal = orderItems.reduce(
    (sum, i) => sum.plus(i.unitPrice.times(i.quantity)),
    new Decimal(0),
  );
  const deliveryCost = itemsTotal.gte(new Decimal(1500)) ? new Decimal(0) : new Decimal(149);
  const total = itemsTotal.plus(deliveryCost);

  const order = await prisma.order.create({
    data: {
      userId: userId || undefined,
      guestName: userId ? undefined : body.name,
      guestPhone: userId ? undefined : body.phone,
      guestEmail: userId ? undefined : body.email,
      paymentMethod: (body.paymentMethod ?? 'CASH') as 'CASH' | 'CARD_ON_DELIVERY',
      deliveryType: deliveryType as 'DELIVERY' | 'PICKUP',
      street: deliveryType === 'DELIVERY' ? body.street : undefined,
      building: deliveryType === 'DELIVERY' ? body.building : undefined,
      apt: deliveryType === 'DELIVERY' ? body.apt : undefined,
      floor: deliveryType === 'DELIVERY' ? body.floor : undefined,
      entrance: deliveryType === 'DELIVERY' ? body.entrance : undefined,
      addressComment: deliveryType === 'DELIVERY' ? body.addressComment : undefined,
      comment: body.comment,
      itemsTotal,
      deliveryCost,
      total,
      items: {
        create: orderItems.map((i) => ({
          productId: i.productId,
          name: i.name,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          configSummary: i.configSummary,
        })),
      },
    },
    include: { items: true },
  });

  return json(order);
}

async function handleGetMineOrders(req: NextRequest, user: JwtPayload) {
  const { sub: userId } = user;
  return json(
    await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
  );
}

async function handleGetOrderById(req: NextRequest, orderId: string, user: JwtPayload) {
  const { sub: userId, role } = user;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return json({ error: 'Order not found' }, 404);
  if (role !== 'ADMIN' && order.userId !== userId) {
    return json({ error: 'Access denied' }, 403);
  }
  return json(order);
}

async function handleGetOrderStatus(req: NextRequest, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      publicNumber: true,
      status: true,
      statusUpdatedAt: true,
      total: true,
      paymentMethod: true,
    },
  });
  if (!order) return json({ error: 'Order not found' }, 404);
  return json(order);
}

// ── admin/orders ─────────────────────────────────────────────────────────────

async function handleGetAdminOrders(req: NextRequest, user: JwtPayload, status?: string) {
  if (!isAdmin(user.role)) return json({ error: 'Forbidden' }, 403);
  void req;

  const where = status
    ? { status: status as OrderStatus }
    : undefined;
  return json(
    await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
  );
}

async function handlePatchAdminOrderStatus(req: NextRequest, user: JwtPayload, orderId: string) {
  if (!isAdmin(user.role)) return json({ error: 'Forbidden' }, 403);

  const { status } = await req.json() as { status: string };
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: status as OrderStatus, statusUpdatedAt: new Date() },
  });
  return json(order);
}

// ── admin/categories ─────────────────────────────────────────────────────────

async function handlePostCategory(req: NextRequest, user: JwtPayload) {
  if (!isAdmin(user.role)) return json({ error: 'Forbidden' }, 403);

  const { slug, name, icon, sortOrder } = await req.json() as { slug: string; name: string; icon?: string; sortOrder?: number };
  return json(
    await prisma.category.create({ data: { slug, name, icon, sortOrder: sortOrder ?? 0 } }),
  );
}

// ── admin/products ───────────────────────────────────────────────────────────

async function handleGetAdminProducts(req: NextRequest, user: JwtPayload) {
  if (!isAdmin(user.role)) return json({ error: 'Forbidden' }, 403);
  void req;

  return json(
    await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true, slug: true } }, variants: true },
    }),
  );
}

interface CreateProductInput {
  slug: string;
  name: string;
  description?: string;
  imagePath?: string;
  imageType?: string;
  categoryId: string;
  isVegan?: boolean;
  isSpicy?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  basePrice: number;
  weight?: number;
  kcal?: number;
  sortOrder?: number;
  variants?: { name: string; price: number; isDefault?: boolean }[];
}

async function handlePostProduct(req: NextRequest, user: JwtPayload) {
  if (!isAdmin(user.role)) return json({ error: 'Forbidden' }, 403);

  const body = await req.json() as CreateProductInput;
  const { variants, imageType, ...rest } = body;
  return json(
    await prisma.product.create({
      data: {
        ...rest,
        imageType: imageType as unknown as ImageType,
        basePrice: new Decimal(String(rest.basePrice)),
        variants: variants?.length
          ? {
              create: variants.map((v) => ({
                name: v.name,
                price: new Decimal(String(v.price)),
                isDefault: v.isDefault ?? false,
              })),
            }
          : undefined,
      },
      include: { variants: true },
    }),
  );
}

async function handlePatchProduct(req: NextRequest, user: JwtPayload, productId: string) {
  if (!isAdmin(user.role)) return json({ error: 'Forbidden' }, 403);

  const body = await req.json() as CreateProductInput;
  const { variants, ...rest } = body;
  const data: Record<string, unknown> = { ...rest };
  if (rest.basePrice !== undefined) {
    data.basePrice = new Decimal(String(rest.basePrice));
  }

  if (variants) {
    await prisma.productVariant.deleteMany({ where: { productId } });
    data.variants = {
      create: variants.map((v) => ({
        name: v.name,
        price: new Decimal(String(v.price)),
        isDefault: v.isDefault ?? false,
      })),
    };
  }

  return json(
    await prisma.product.update({ where: { id: productId }, data, include: { variants: true } }),
  );
}

async function handlePatchProductAvailability(req: NextRequest, user: JwtPayload, productId: string) {
  if (!isAdmin(user.role)) return json({ error: 'Forbidden' }, 403);

  const { isAvailable } = await req.json() as { isAvailable: boolean };
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return json({ error: 'Product not found' }, 404);

  return json(await prisma.product.update({ where: { id: productId }, data: { isAvailable } }));
}

async function handleDeleteProduct(req: NextRequest, user: JwtPayload, productId: string) {
  if (!isAdmin(user.role)) return json({ error: 'Forbidden' }, 403);

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return json({ error: 'Product not found' }, 404);

  await prisma.product.delete({ where: { id: productId } });
  return json({ ok: true });
}

// ── main handler: GET ────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (!path.length) return json({ error: 'Not found' }, 404);

  const [resource, ...rest] = path;
  const joined = rest.join('/');

  // GET /api/users/me/addresses
  if (resource === 'users' && joined === 'me/addresses') {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    return handleGetAddresses(req, user);
  }

  // GET /api/orders/mine
  if (resource === 'orders' && joined === 'mine') {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    return handleGetMineOrders(req, user);
  }

  // GET /api/orders/:id[/:sub]
  if (resource === 'orders' && joined) {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const slashIdx = joined.indexOf('/');
    if (slashIdx !== -1) {
      const orderId = joined.slice(0, slashIdx);
      const sub = joined.slice(slashIdx + 1);
      if (sub === 'status') {
        return handleGetOrderStatus(req, orderId);
      }
    }
    // /:id
    return handleGetOrderById(req, joined, user);
  }

  // GET /api/admin/orders[?status=...]
  if (resource === 'admin' && joined === 'orders') {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined;
    return handleGetAdminOrders(req, user, status);
  }

  // GET /api/admin/products
  if (resource === 'admin' && joined === 'products') {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    return handleGetAdminProducts(req, user);
  }

  return json({ error: 'Not found' }, 404);
}

// ── main handler: PATCH ──────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (!path.length) return json({ error: 'Not found' }, 404);

  const [resource, ...rest] = path;
  const joined = rest.join('/');

  // PATCH /api/users/me
  if (resource === 'users' && joined === 'me') {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    return handlePatchUsersMe(req, user);
  }

  // PATCH /api/users/me/addresses[/:id][/:sub]
  if (resource === 'users' && joined.startsWith('me/addresses/')) {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const afterSlash = joined.slice('me/addresses/'.length);
    const slashIdx = afterSlash.indexOf('/');
    if (slashIdx !== -1) {
      const addressId = afterSlash.slice(0, slashIdx);
      const sub = afterSlash.slice(slashIdx + 1);
      if (sub === 'default') {
        return handleSetDefaultAddress(req, user, addressId);
      }
    }
    return handlePatchAddress(req, user, afterSlash);
  }

  // PATCH /api/admin/orders/:id/status
  if (resource === 'admin' && joined.endsWith('/status')) {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const idx = joined.lastIndexOf('/status');
    const orderId = joined.slice(0, idx);
    return handlePatchAdminOrderStatus(req, user, orderId);
  }

  // PATCH /api/admin/products[/:id][/:sub]
  if (resource === 'admin' && joined.startsWith('products/')) {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const afterSlash = joined.slice('products/'.length);
    const slashIdx = afterSlash.indexOf('/');
    if (slashIdx !== -1) {
      const productId = afterSlash.slice(0, slashIdx);
      const sub = afterSlash.slice(slashIdx + 1);
      if (sub === 'availability') {
        return handlePatchProductAvailability(req, user, productId);
      }
    }
    return handlePatchProduct(req, user, afterSlash);
  }

  return json({ error: 'Not found' }, 404);
}

// ── main handler: POST ───────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (!path.length) return json({ error: 'Not found' }, 404);

  const [resource, ...rest] = path;
  const joined = rest.join('/');

  // POST /api/users/me/addresses
  if (resource === 'users' && joined === 'me/addresses') {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    return handlePostAddress(req, user);
  }

  // POST /api/users/me/addresses/:id/default
  if (resource === 'users' && joined.startsWith('me/addresses/')) {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const afterSlash = joined.slice('me/addresses/'.length);
    const slashIdx = afterSlash.indexOf('/');
    if (slashIdx !== -1) {
      const addressId = afterSlash.slice(0, slashIdx);
      const sub = afterSlash.slice(slashIdx + 1);
      if (sub === 'default') {
        return handleSetDefaultAddress(req, user, addressId);
      }
    }
    return handlePostAddress(req, user);
  }

  // POST /api/orders
  if (resource === 'orders' && joined === '') {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    return handlePostOrder(req, user);
  }

  // POST /api/admin/categories
  if (resource === 'admin' && joined === 'categories') {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    return handlePostCategory(req, user);
  }

  // POST /api/admin/products
  if (resource === 'admin' && joined === 'products') {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    return handlePostProduct(req, user);
  }

  return json({ error: 'Not found' }, 404);
}

// ── main handler: DELETE ─────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (!path.length) return json({ error: 'Not found' }, 404);

  const [resource, ...rest] = path;
  const joined = rest.join('/');

  // DELETE /api/users/me/addresses/:id
  if (resource === 'users' && joined.startsWith('me/addresses/')) {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const addressId = joined.slice('me/addresses/'.length);
    return handleDeleteAddress(req, user, addressId);
  }

  // DELETE /api/admin/products/:id
  if (resource === 'admin' && joined.startsWith('products/')) {
    const user = jwtFromHeader(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const productId = joined.slice('products/'.length);
    return handleDeleteProduct(req, user, productId);
  }

  return json({ error: 'Not found' }, 404);
}
