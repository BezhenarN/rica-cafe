import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

/** Возвращает все опции для конструктора пиццы одним запросом. */
@Injectable()
export class PizzaBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async getOptions() {
    const [sizes, dough, sauces, ingredients] = await Promise.all([
      this.prisma.pizzaSize.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.doughOption.findMany(),
      this.prisma.sauce.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.ingredient.findMany({
        where: { isAvailable: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);
    return { sizes, dough, sauces, ingredients };
  }
}
