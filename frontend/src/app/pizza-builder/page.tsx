import type { Metadata } from 'next';
import { PizzaBuilder } from '@/components/pizza/pizza-builder';

export const metadata: Metadata = {
  title: 'Конструктор пиццы',
  description: 'Соберите свою идеальную пиццу: размер, тесто, соус и ингредиенты. Цена — в реальном времени.',
};

export default function PizzaBuilderPage() {
  return <PizzaBuilder />;
}
