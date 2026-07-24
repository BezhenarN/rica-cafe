import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Сервис отправки уведомлений в MAX (com.ms).
 *
 * Реализация под REST-endpoint MAX.
 * Настройки через env:
 *   MAX_API_URL   — базовый URL API (по умолчанию https://api.com.ms)
 *   MAX_API_KEY   — API-ключ бота
 *   MAX_CHAT_ID   — ID чата/канала, куда шлем уведомления
 */
@Injectable()
export class MaxNotificationService {
  private readonly logger = new Logger(MaxNotificationService.name);

  constructor(private config: ConfigService) {}

  private get apiUrl(): string {
    return this.config.get<string>('MAX_API_URL', 'https://api.com.ms');
  }

  private get apiKey(): string | undefined {
    return this.config.get<string>('MAX_API_KEY');
  }

  private get chatId(): string | undefined {
    return this.config.get<string>('MAX_CHAT_ID');
  }

  /**
   * Отправляет уведомление о новом заказе в MAX.
   * Если MAX недоступен — логирует ошибку, но не прерывает заказ.
   */
  async notifyNewOrder(order: {
    id: string;
    publicNumber: number;
    guestName?: string | null;
    guestPhone?: string | null;
    total: number;
    items: { name: string; quantity: number; unitPrice: number }[];
    street?: string | null;
    building?: string | null;
    apt?: string | null;
    deliveryType: string;
    paymentMethod: string;
    comment?: string | null;
  }): Promise<void> {
    const key = this.apiKey;
    const chatId = this.chatId;

    if (!key || !chatId) {
      this.logger.warn(
        'MAX_API_KEY или MAX_CHAT_ID не настроены — уведомление пропущено.',
      );
      return;
    }

    const itemsText = order.items
      .map((it) => `${it.quantity} × ${it.name} — ${this.formatPrice(it.unitPrice * it.quantity)} ₽`)
      .join('\n');

    const address =
      order.deliveryType === 'DELIVERY'
        ? `\n\n📍 Адрес: ${order.street ?? '?'}, ${order.building ?? '?'}${order.apt ? `, кв. ${order.apt}` : ''}${order.guestPhone ? '\n📞 Телефон: ' + order.guestPhone : ''}`
        : '\n\n🏪 Самовывоз из кафе «Рица»';

    const commentText = order.comment ? `\n💬 Комментарий: ${order.comment}` : '';

    const text = [
      `🔔 *Новый заказ #${order.publicNumber}*`,
      `👤 ${order.guestName ?? 'Аноним'}`,
      `💰 Итого: ${this.formatPrice(order.total)} ₽`,
      `💳 Оплата: ${order.paymentMethod === 'CASH' ? 'Наличными' : 'Картой'}`,
      `🚚 ${order.deliveryType === 'DELIVERY' ? 'Доставка' : 'Самовывоз'}`,
      itemsText,
      address,
      commentText,
    ].join('\n');

    try {
      await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
      this.logger.log(`✅ Уведомление MAX отправлено для заказа #${order.publicNumber}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `❌ Не удалось отправить уведомление MAX: ${msg}`,
        (err as Error)?.stack,
      );
      // Graceful fail — заказ не теряется
    }
  }

  private formatPrice(n: number): string {
    return n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
