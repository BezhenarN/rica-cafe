import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseCuidPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminProductsService, CreateProductInput, UpdateProductInput } from './admin-products.service';

@ApiTags('admin / products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminProductsController {
  constructor(private readonly service: AdminProductsService) {}

  @Post('categories')
  @ApiOperation({ summary: 'Создать категорию' })
  createCategory(@Body() body: { slug: string; name: string; icon?: string; sortOrder?: number }) {
    return this.service.createCategory(body);
  }

  @Get('products')
  @ApiOperation({ summary: 'Все товары (включая недоступные)' })
  list() {
    return this.service.listAllProducts();
  }

  @Post('products')
  @ApiOperation({ summary: 'Создать товар' })
  create(@Body() body: CreateProductInput) {
    return this.service.createProduct(body);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Редактировать товар' })
  update(@Param('id', ParseCuidPipe) id: string, @Body() body: UpdateProductInput) {
    return this.service.updateProduct(id, body);
  }

  @Patch('products/:id/availability')
  @ApiOperation({ summary: 'Включить/выключить товар' })
  toggle(@Param('id', ParseCuidPipe) id: string, @Body() body: { isAvailable: boolean }) {
    return this.service.toggleAvailable(id, body.isAvailable);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Удалить товар' })
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.service.deleteProduct(id);
  }
}
