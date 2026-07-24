import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Role } from '@prisma/client';
import { ParseCuidPipe } from '../common/cuid.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrdersService } from './orders.service';
import { UpdateStatusDto } from './dto/order.dto';

@ApiTags('admin / orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Все заказы (админ), опционально фильтр по статусу' })
  list(@Query('status') status?: OrderStatus) {
    return this.orders.listAll(status);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Изменить статус заказа (запускает трекинг-пуш)' })
  updateStatus(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateStatusDto) {
    return this.orders.updateStatus(id, dto.status as OrderStatus);
  }
}
