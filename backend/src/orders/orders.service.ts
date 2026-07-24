import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../common/prisma.service';
import { CatalogOrderItemDto, CreateOrderDto, CustomPizzaItemDto } from './dto/order.dto';
import { OrdersGateway } from './orders.gateway';
import { MaxNotificationService } from '../notifications/max.service';

/** Стоимость доставки. В реальном проекте — динамически или из настроек. */
const DELIVERY_COST = new Decimal(149);
const FREE_DELIVERY_THRESHOLD = new Decimal(1500);

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OrdersGateway,
    private readonly maxNotify: MaxNotificationService,
  ) {}

  /** Создаёт заказ, пересчитывая ВСЕ цены серверно из БД (клиенту верить нельзя). */
  async create(userId: string | undefined, dto: CreateOrderDto) {
    const deliveryType = dto.deliveryType ?? 'DELIVERY';

    if ((!dto.items?.length && !dto.pizzas?.length) || (dto.items?.length === 0 && dto.pizzas?.length === 0)) {
      throw new BadRequestException('Корзина пуста');
    }

    // Гостевые заказы требуют контактов.
    if (!userId && (!dto.phone || !dto.name)) {
      throw new BadRequestException('Укажите имя и телефон для заказа без регистрации');
    }

    // При доставке адрес обязателен.
    if (deliveryType === 'DELIVERY' && (!dto.street || !dto.building)) {
      throw new BadRequestException('Укажите адрес доставки');
    }

    const orderItems: {
      name: string;
      unitPrice: Decimal;
      quantity: number;
      configSummary?: string;
      productId?: string;
    }[] = [];

    // 1) Предустановленные товары каталога
    if (dto.items?.length) {
      const itemsById = new Map(dto.items.map((i) => [i.productId, i]));
      const products = await this.prisma.product.findMany({
        where: { id: { in: Array.from(itemsById.keys()) }, isAvailable: true },
        include: { variants: true },
      });
      for (const product of products) {
        const line = itemsById.get(product.id)!;
        const variant = product.variants.find((v) => v.name === line.variantName);
        if (!variant) {
          throw new BadRequestException(
            `У товара «${product.name}» нет варианта «${line.variantName}»`,
          );
        }
        orderItems.push({
          productId: product.id,
          name: `${product.name}, ${variant.name}`,
          unitPrice: variant.price,
          quantity: line.quantity,
        });
      }
    }

    // 2) Кастомные пиццы — пересчёт по опциям
    if (dto.pizzas?.length) {
      const computed = await this.priceCustomPizzas(dto.pizzas);
      orderItems.push(...computed);
    }

    const itemsTotal = orderItems.reduce(
      (sum, i) => sum.plus(i.unitPrice.times(i.quantity)),
      new Decimal(0),
    );
    const deliveryCost = itemsTotal.gte(FREE_DELIVERY_THRESHOLD) ? new Decimal(0) : DELIVERY_COST;
    const total = itemsTotal.plus(deliveryCost);

    const order = await this.prisma.order.create({
      data: {
        userId,
        guestName: userId ? undefined : dto.name,
        guestPhone: userId ? undefined : dto.phone,
        guestEmail: userId ? undefined : dto.email,
        paymentMethod: dto.paymentMethod,
        deliveryType,
        street: deliveryType === 'DELIVERY' ? dto.street : undefined,
        building: deliveryType === 'DELIVERY' ? dto.building : undefined,
        apt: deliveryType === 'DELIVERY' ? dto.apt : undefined,
        floor: deliveryType === 'DELIVERY' ? dto.floor : undefined,
        entrance: deliveryType === 'DELIVERY' ? dto.entrance : undefined,
        addressComment: deliveryType === 'DELIVERY' ? dto.addressComment : undefined,
        comment: dto.comment,
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

    // Отправляем уведомление в MAX
    this.maxNotify.notifyNewOrder({
      id: order.id,
      publicNumber: order.publicNumber,
      guestName: order.guestName ?? undefined,
      guestPhone: order.guestPhone ?? undefined,
      total: Number(order.total),
      items: order.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
      })),
      street: deliveryType === 'DELIVERY' ? order.street : undefined,
      building: deliveryType === 'DELIVERY' ? order.building : undefined,
      apt: deliveryType === 'DELIVERY' ? order.apt : undefined,
      deliveryType,
      paymentMethod: order.paymentMethod,
      comment: order.comment ?? undefined,
    }).catch(() => {});

    return order;
  }

  /** Пересчёт цен кастомных пицц по опциям из БД. */
  private async priceCustomPizzas(pizzas: CustomPizzaItemDto[]) {
    const sizeIds = pizzas.map((p) => p.sizeId);
    const doughIds = pizzas.map((p) => p.doughId);
    const sauceIds = pizzas.map((p) => p.sauceId);
    const ingredientIds = Array.from(new Set(pizzas.flatMap((p) => p.ingredientIds)));

    const [sizes, doughOpts, sauces, ingredients] = await Promise.all([
      this.prisma.pizzaSize.findMany({ where: { id: { in: sizeIds } } }),
      this.prisma.doughOption.findMany({ where: { id: { in: doughIds } } }),
      this.prisma.sauce.findMany({ where: { id: { in: sauceIds } } }),
      this.prisma.ingredient.findMany({
        where: { id: { in: ingredientIds }, isAvailable: true },
      }),
    ]);

    return pizzas.map((p) => {
      const size = sizes.find((s) => s.id === p.sizeId);
      const dough = doughOpts.find((d) => d.id === p.doughId);
      const sauce = sauces.find((s) => s.id === p.sauceId);
      if (!size || !dough || !sauce) {
        throw new BadRequestException('Невалидная конфигурация пиццы');
      }
      if (p.ingredientIds.length > size.maxIngredients) {
        throw new BadRequestException(
          `Превышен лимит ингредиентов для размера «${size.name}»`,
        );
      }
      const chosenIngredients = p.ingredientIds
        .map((id) => ingredients.find((i) => i.id === id))
        .filter(Boolean) as { id: string; name: string; price: Decimal }[];
      if (chosenIngredients.length !== p.ingredientIds.length) {
        throw new BadRequestException('Один из ингредиентов недоступен');
      }

      const unit = size.basePrice
        .plus(dough.price)
        .plus(sauce.price)
        .plus(chosenIngredients.reduce((s, i) => s.plus(i.price), new Decimal(0)));

      const summaryParts = [
        size.name,
        dough.name.toLowerCase(),
        `соус «${sauce.name}»`,
        chosenIngredients.length ? `+ ${chosenIngredients.map((i) => i.name).join(', ')}` : '',
      ].filter(Boolean);

      return {
        name: `Пицца ${size.name} (конструктор)`,
        unitPrice: unit,
        quantity: p.quantity,
        configSummary: summaryParts.join(' · '),
      };
    });
  }

  listMine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  /** Доступ: владелец либо админ. */
  async getById(orderId: string, userId?: string, role?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (role !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('Нет доступа к этому заказу');
    }
    return order;
  }

  /** Лёгкий эндпоинт для polling-трекинга. */
  async getStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
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
    if (!order) throw new NotFoundException('Заказ не найден');
    return order;
  }

  // ── Админ ────────────────────────────────────────────────────────────────
  listAll(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status, statusUpdatedAt: new Date() },
    });
    // Пушим живой апдейт подключённым клиентам.
    this.gateway.emitStatusChange(order.id, {
      status: order.status,
      updatedAt: order.statusUpdatedAt,
    });
    return order;
  }
}
