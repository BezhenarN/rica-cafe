import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { ParseCuidPipe } from '../common/cuid.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateOrderDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Оформить заказ (серверный пересчёт цен). Доступно гостям.' })
  create(@CurrentUser('id') userId: string | undefined, @Body() dto: CreateOrderDto) {
    return this.orders.create(userId, dto);
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Мои заказы (требует авторизации)' })
  mine(@CurrentUser('id') userId: string) {
    return this.orders.listMine(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детали заказа' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getById(@Param('id', ParseCuidPipe) id: string, @CurrentUser() user: any) {
    return this.orders.getById(id, user?.id, user?.role);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Только статус заказа — для polling-трекинга (без авторизации)' })
  status(@Param('id', ParseCuidPipe) id: string) {
    return this.orders.getStatus(id);
  }
}
