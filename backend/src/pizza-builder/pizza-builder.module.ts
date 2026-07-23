import { Module } from '@nestjs/common';
import { PizzaBuilderService } from './pizza-builder.service';
import { PizzaBuilderController } from './pizza-builder.controller';

@Module({
  controllers: [PizzaBuilderController],
  providers: [PizzaBuilderService],
  exports: [PizzaBuilderService],
})
export class PizzaBuilderModule {}
