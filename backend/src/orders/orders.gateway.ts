import { Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Шлюз живого трекинга заказа.
 * Клиент подключается и присоединяется к комнате order:<id>.
 * При смене статуса вызывается emitStatusChange(), который пушит апдейт всем в комнате.
 *
 * Включается в OrdersModule. Если WS не нужен — фронтенд работает на polling.
 */
@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? '*' },
  namespace: '/orders',
})
@Injectable()
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const orderId = client.handshake.query.orderId as string | undefined;
    if (orderId) client.join(`order:${orderId}`);
  }

  handleDisconnect() {
    // socket.io очищает комнаты автоматически
  }

  emitStatusChange(orderId: string, payload: { status: string; updatedAt: Date }) {
    this.server?.to(`order:${orderId}`).emit('order:status', payload);
  }
}
