import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ImageType, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

export interface CreateProductInput {
  slug: string;
  name: string;
  description?: string;
  imagePath?: string;
  imageType?: ImageType;
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

export interface UpdateProductInput extends Partial<Omit<CreateProductInput, 'variants'>> {
  variants?: { id?: string; name: string; price: number; isDefault?: boolean }[];
}

/** CRUD товаров и категорий для админ-панели. */
@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Категории ────────────────────────────────────────────────────────────
  createCategory(data: { slug: string; name: string; icon?: string; sortOrder?: number }) {
    return this.prisma.category.create({ data });
  }

  // ── Товары ───────────────────────────────────────────────────────────────
  async createProduct(input: CreateProductInput) {
    const { variants, basePrice, ...rest } = input;
    return this.prisma.product.create({
      data: {
        ...rest,
        basePrice: rest.basePrice ?? basePrice,
        variants: variants?.length
          ? {
              create: variants.map((v) => ({
                name: v.name,
                price: v.price,
                isDefault: v.isDefault ?? false,
              })),
            }
          : undefined,
      },
      include: { variants: true },
    });
  }

  listAllProducts() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true, slug: true } }, variants: true },
    });
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const { variants, basePrice, ...rest } = input;
    const data: Prisma.ProductUpdateInput = { ...rest };
    if (basePrice !== undefined) data.basePrice = basePrice;

    if (variants) {
      // Простая стратегия: заменить все варианты новыми.
      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
      data.variants = {
        create: variants.map((v) => ({ name: v.name, price: v.price, isDefault: v.isDefault ?? false })),
      };
    }
    return this.prisma.product.update({ where: { id }, data, include: { variants: true } });
  }

  async toggleAvailable(id: string, isAvailable: boolean) {
    await this.getOrThrow(id);
    return this.prisma.product.update({ where: { id }, data: { isAvailable } });
  }

  async deleteProduct(id: string) {
    await this.getOrThrow(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async setProductImage(id: string, filename: string) {
    await this.getOrThrow(id);
    const path = `/uploads/${filename}`;
    await this.prisma.product.update({ where: { id }, data: { imagePath: path } });
    return { imagePath: path };
  }

  private async getOrThrow(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Товар не найден');
    return p;
  }
}
