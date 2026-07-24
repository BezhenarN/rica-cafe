import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { PizzaBuilderModule } from './pizza-builder/pizza-builder.module';
import { OrdersModule } from './orders/orders.module';

import { HealthController } from './app.health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    PizzaBuilderModule,
    OrdersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
