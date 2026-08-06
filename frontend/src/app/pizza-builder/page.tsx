import type { Metadata } from 'next';
import { PizzaBuilder } from '@/components/pizza/pizza-builder';
import { ReadyPizzas } from '@/components/pizza/ready-pizzas';

export const metadata: Metadata = {
  title: 'Конструктор пиццы',
  description: 'Соберите свою идеальную пиццу: размер, тесто, соус и ингредиенты. Цена — в реальном времени.',
};

export default function PizzaBuilderPage() {
  return (
    <div className="space-y-12 lg:space-y-16">
      <PizzaBuilder />
      <ReadyPizzas />
    </div>
  );
}
