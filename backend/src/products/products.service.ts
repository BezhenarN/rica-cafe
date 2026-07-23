import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

export enum SortOption {
  POPULAR = 'popular',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NAME = 'name',
}

export interface ProductQuery {
  category?: string;
  q?: string;
  vegan?: boolean;
  spicy?: boolean;
  sort?: SortOption;
}

/**
 * Каталог: категории, список товаров с фильтрами/сортировкой, детальная карточка.
 */
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories() {
    return this.prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async list(query: ProductQuery) {
    const where: Prisma.ProductWhereInput = { isAvailable: true };
    if (query.category) where.category = { slug: query.category };
    if (query.vegan) where.isVegan = true;
    if (query.spicy) where.isSpicy = true;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
      switch (query.sort) {
        case SortOption.PRICE_ASC:
          return [{ basePrice: 'asc' }];
        case SortOption.PRICE_DESC:
          return [{ basePrice: 'desc' }];
        case SortOption.NAME:
          return [{ name: 'asc' }];
        default:
          // POPULAR — рекомендуемые вперёд, затем по умолчанию
          return [{ isFeatured: 'desc' }, { sortOrder: 'asc' }];
      }
    })();

    return this.prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { orderBy: { price: 'asc' } },
      },
    });
  }

  async featured(limit = 8) {
    return this.prisma.product.findMany({
      where: { isAvailable: true, isFeatured: true },
      orderBy: { sortOrder: 'asc' },
      take: limit,
      include: {
        category: { select: { slug: true, name: true } },
        variants: { orderBy: { price: 'asc' } },
      },
    });
  }

  async getBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { slug: true, name: true } },
        variants: { orderBy: { price: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Товар не найден');
    return product;
  }
}
