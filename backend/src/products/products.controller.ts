import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductsService, SortOption } from './products.service';

@ApiTags('catalog')
@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Список категорий' })
  categories() {
    return this.products.listCategories();
  }

  @Get('products/featured')
  @ApiOperation({ summary: 'Рекомендуемые товары (для главной)' })
  featured(@Query('limit') limit?: string) {
    return this.products.featured(limit ? Number(limit) : undefined);
  }

  @Get('products')
  @ApiOperation({ summary: 'Каталог товаров с фильтрами и сортировкой' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'q', required: false, description: 'Поиск по названию/описанию' })
  @ApiQuery({ name: 'vegan', required: false, type: Boolean })
  @ApiQuery({ name: 'spicy', required: false, type: Boolean })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: SortOption,
    description: 'popular | price_asc | price_desc | name',
  })
  list(
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('vegan') vegan?: string,
    @Query('spicy') spicy?: string,
    @Query('sort') sort?: SortOption,
  ) {
    return this.products.list({
      category,
      q,
      vegan: vegan === 'true' || vegan === '1',
      spicy: spicy === 'true' || spicy === '1',
      sort,
    });
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Карточка товара по slug' })
  bySlug(@Param('slug') slug: string) {
    return this.products.getBySlug(slug);
  }
}
