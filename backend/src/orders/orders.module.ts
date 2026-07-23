import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin.controller';
import { AdminProductsService } from './admin-products.service';
import { AdminProductsController } from './admin-products.controller';
import { OrdersGateway } from './orders.gateway';

@Module({
  controllers: [
    OrdersController,
    AdminOrdersController,
    AdminProductsController,
  ],
  providers: [OrdersService, AdminProductsService, OrdersGateway],
  exports: [OrdersService, OrdersGateway],
})
export class OrdersModule {}
