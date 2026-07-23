import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PizzaBuilderService } from './pizza-builder.service';

@ApiTags('pizza-builder')
@Controller('pizza')
export class PizzaBuilderController {
  constructor(private readonly service: PizzaBuilderService) {}

  @Get('options')
  @ApiOperation({ summary: 'Опции конструктора пиццы: размеры, тесто, соусы, ингредиенты' })
  options() {
    return this.service.getOptions();
  }
}
