import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export type DeliveryType = 'DELIVERY' | 'PICKUP';

/** Элемент с предустановленным товаром из каталога. */
export class CatalogOrderItemDto {
  @ApiProperty({ example: 'ck...' })
  @IsString()
  productId!: string;

  @ApiProperty({ example: '30 см', description: 'Имя варианта (ProductVariant.name)' })
  @IsString()
  variantName!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

/** Сконструированная пользователем пицца. */
export class CustomPizzaItemDto {
  @ApiProperty({ example: 'ck_30cm' })
  @IsString()
  sizeId!: string;

  @ApiProperty({ example: 'ck_trad' })
  @IsString()
  doughId!: string;

  @ApiProperty({ example: 'ck_tomato_sauce' })
  @IsString()
  sauceId!: string;

  @ApiProperty({ type: [String], description: 'Массив id ингредиентов' })
  @IsArray()
  @ArrayMinSize(0)
  ingredientIds!: string[];

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CatalogOrderItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogOrderItemDto)
  items?: CatalogOrderItemDto[];

  @ApiProperty({ type: [CustomPizzaItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomPizzaItemDto)
  pizzas?: CustomPizzaItemDto[];

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  // Контактные данные гостя (если не залогинен) либо переопределение.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  // DELIVERY или PICKUP
  @ApiProperty({ enum: ['DELIVERY', 'PICKUP'], default: 'DELIVERY' })
  @IsEnum(['DELIVERY', 'PICKUP'])
  @IsOptional()
  deliveryType?: DeliveryType = 'DELIVERY';

  // Адрес доставки (обязателен только при DELIVERY).
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  building?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entrance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressComment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: ['CONFIRMED', 'COOKING', 'ON_THE_WAY', 'DELIVERED', 'CANCELED'] })
  @IsEnum(['CONFIRMED', 'COOKING', 'ON_THE_WAY', 'DELIVERED', 'CANCELED'])
  status!: 'CONFIRMED' | 'COOKING' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELED';
}
