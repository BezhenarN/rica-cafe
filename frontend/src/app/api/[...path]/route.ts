import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET, type JwtPayload } from '@/lib/auth';
import bcrypt from 'bcryptjs';

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

// ─────────────────────────────────────────────
// GET handlers
// ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const path = getPath(request);

  // health
  if (path[0] === 'health') {
    return NextResponse.json({ status: 'ok' });
  }

  // categories
  if (path[0] === 'categories' && path.length === 1) {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(categories);
  }

  // featured products
  if (path[0] === 'products' && path[1] === 'featured' && path.length === 2) {
    const limit = Number(request.nextUrl.searchParams.get('limit')) || 8;
    const products = await prisma.product.findMany({
      where: { isAvailable: true, isFeatured: true },
      orderBy: { sortOrder: 'asc' },
      take: limit,
      include: {
        category: { select: { slug: true, name: true } },
        variants: { orderBy: { price: 'asc' } },
      },
    });
    return NextResponse.json(products);
  }

  // single product by slug
  if (path[0] === 'products' && path.length >= 2) {
    const slug = path[1] ?? null;
    if (slug) {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: { select: { slug: true, name: true } },
          variants: { orderBy: { price: 'asc' } },
        },
      });
      if (!product) {
        return errorResponse('Товар не найден', 404);
      }
      return NextResponse.json(product);
    }
  }

  // catalog products list with filters
  if (path[0] === 'products' && path.length === 1) {
    const category = request.nextUrl.searchParams.get('category') ?? undefined;
    const q = request.nextUrl.searchParams.get('q') ?? undefined;
    const vegan = toBool(request.nextUrl.searchParams.get('vegan'));
    const spicy = toBool(request.nextUrl.searchParams.get('spicy'));
    const sort = request.nextUrl.searchParams.get('sort') ?? undefined;

    const where: Record<string, unknown> = { isAvailable: true };

    if (category) {
      where.category = { slug: category };
    }
    if (vegan) {
      where.isVegan = true;
    }
    if (spicy) {
      where.isSpicy = true;
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ];
    }

    const orderBy: Record<string, unknown>[] = (() => {
      switch (sort) {
        case 'price_asc':
          return [{ basePrice: 'asc' }];
        case 'price_desc':
          return [{ basePrice: 'desc' }];
        case 'name':
          return [{ name: 'asc' }];
        default:
          return [{ isFeatured: 'desc' }, { sortOrder: 'asc' }];
      }
    })();

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { orderBy: { price: 'asc' } },
      },
    });
    return NextResponse.json(products);
  }

  // pizza options
  if (path[0] === 'pizza' && path[1] === 'options' && path.length === 2) {
    const sizes = await prisma.pizzaSize.findMany({ orderBy: { sortOrder: 'asc' } });
    const dough = await prisma.doughOption.findMany();
    const sauces = await prisma.sauce.findMany({ orderBy: { sortOrder: 'asc' } });
    const ingredients = await prisma.ingredient.findMany({
      where: { isAvailable: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ sizes, dough, sauces, ingredients });
  }

  // auth/me
  if (path[0] === 'auth' && path[1] === 'me' && path.length === 2) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }

    const token = authHeader.slice(7);
    let payload: JwtPayload;
    try {
      const jwt = await import('jsonwebtoken');
      payload = jwt.default.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return errorResponse('Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    return NextResponse.json(user);
  }

  return errorResponse('Not found', 404);
}

// ─────────────────────────────────────────────
// POST handlers
// ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const path = getPath(request);

  // auth/register
  if (path[0] === 'auth' && path[1] === 'register' && path.length === 2) {
    try {
      const body = await request.json();
      const { email, password, name, phone } = body;

      // check if user already exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return errorResponse('Пользователь с таким email уже существует', 409);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: name || null,
          phone: phone || null,
          role: 'CUSTOMER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
        },
      });

      const accessToken = await new Promise<string>((resolve, reject) => {
        import('jsonwebtoken').then((jwt) => {
          const token = jwt.default.sign(
            { sub: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
          );
          resolve(token);
        }).catch(reject);
      });

      return NextResponse.json({ accessToken, user });
    } catch {
      return errorResponse('Неверный формат данных');
    }
  }

  // auth/login
  if (path[0] === 'auth' && path[1] === 'login' && path.length === 2) {
    try {
      const body = await request.json();
      const { email, password } = body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return errorResponse('Неверный email или пароль', 401);
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return errorResponse('Неверный email или пароль', 401);
      }

      const userRecord = {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      };

      const accessToken = await new Promise<string>((resolve, reject) => {
        import('jsonwebtoken').then((jwt) => {
          const token = jwt.default.sign(
            { sub: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
          );
          resolve(token);
        }).catch(reject);
      });

      return NextResponse.json({ accessToken, user: userRecord });
    } catch {
      return errorResponse('Неверный формат данных');
    }
  }

  return errorResponse('Not found', 404);
}
