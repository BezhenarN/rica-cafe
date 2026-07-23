'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Flame, Leaf } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { ProductImage } from '@/components/ui/product-image';
import { usePizzaOptions } from '@/hooks/use-queries';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { showToast } from '@/components/ui/toast';
import { formatPrice, cn } from '@/lib/cn';

export function PizzaBuilder() {
  const { data, isLoading } = usePizzaOptions();
  const addPizza = useCartStore((s) => s.addPizza);
  const openCart = useUIStore((s) => s.openCart);

  // Выборы по умолчанию.
  const defaults = useMemo(() => {
    if (!data) return null;
    return {
      sizeId: data.sizes[0]?.id,
      doughId: data.dough[0]?.id,
      sauceId: data.sauces[0]?.id,
    };
  }, [data]);

  const [sizeId, setSizeId] = useState<string | undefined>();
  const [doughId, setDoughId] = useState<string | undefined>();
  const [sauceId, setSauceId] = useState<string | undefined>();
  const [ingredientIds, setIngredientIds] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  // Применяем дефолты после загрузки.
  const sSize = sizeId ?? defaults?.sizeId;
  const sDough = doughId ?? defaults?.doughId;
  const sSauce = sauceId ?? defaults?.sauceId;

  const price = useMemo(() => {
    if (!data || !sSize || !sDough || !sSauce) return 0;
    const size = data.sizes.find((x) => x.id === sSize);
    const dough = data.dough.find((x) => x.id === sDough);
    const sauce = data.sauces.find((x) => x.id === sSauce);
    const ings = data.ingredients.filter((i) => ingredientIds.includes(i.id));
    const sum =
      Number(size?.basePrice ?? 0) +
      Number(dough?.price ?? 0) +
      Number(sauce?.price ?? 0) +
      ings.reduce((acc, i) => acc + Number(i.price), 0);
    return sum;
  }, [data, sSize, sDough, sSauce, ingredientIds]);

  if (isLoading || !data || !defaults) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  const size = data.sizes.find((x) => x.id === sSize);
  const maxIng = size?.maxIngredients ?? 8;

  const toggleIngredient = (id: string) => {
    setIngredientIds((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= maxIng) {
        showToast(`Максимум ${maxIng} ингредиентов для размера «${size?.name}»`, 'error');
        return cur;
      }
      return [...cur, id];
    });
  };

  const handleAdd = () => {
    if (!sSize || !sDough || !sSauce) return;
    const sizeName = data.sizes.find((x) => x.id === sSize)?.name;
    const doughName = data.dough.find((x) => x.id === sDough)?.name;
    const sauceName = data.sauces.find((x) => x.id === sSauce)?.name;
    const ingNames = data.ingredients
      .filter((i) => ingredientIds.includes(i.id))
      .map((i) => i.name);

    const subtitle = [sizeName, doughName, `соус «${sauceName}»`, ...ingNames]
      .filter(Boolean)
      .join(' · ');

    addPizza({
      title: `Пицца ${sizeName} (конструктор)`,
      subtitle,
      unitPrice: price,
      imageType: 'PIZZA',
      quantity: qty,
      pizzaConfig: {
        sizeId: sSize,
        doughId: sDough,
        sauceId: sSauce,
        ingredientIds,
        quantity: qty,
      },
    });
    showToast('Пицца добавлена в корзину', 'success');
    openCart();
  };

  return (
    <div className="container-page grid gap-6 py-6 lg:grid-cols-[1fr_360px] lg:py-8">
      {/* Колонка выбора */}
      <div className="space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-extrabold sm:text-3xl">Конструктор пиццы</h1>
          <p className="text-sm text-muted">Соберите свою идеальную пиццу — цена пересчитывается на лету.</p>
        </header>

        {/* Размер */}
        <Section title="Размер">
          <div className="flex flex-wrap gap-2">
            {data.sizes.map((s) => (
              <OptionButton
                key={s.id}
                active={s.id === sSize}
                onClick={() => setSizeId(s.id)}
                label={s.name}
                sub={`от ${formatPrice(s.basePrice)} · до ${s.maxIngredients} ингр.`}
              />
            ))}
          </div>
        </Section>

        {/* Тесто */}
        <Section title="Тесто">
          <div className="flex flex-wrap gap-2">
            {data.dough.map((d) => (
              <OptionButton
                key={d.id}
                active={d.id === sDough}
                onClick={() => setDoughId(d.id)}
                label={d.name}
                sub={Number(d.price) > 0 ? `+${formatPrice(d.price)}` : undefined}
              />
            ))}
          </div>
        </Section>

        {/* Соус */}
        <Section title="Соус">
          <div className="flex flex-wrap gap-2">
            {data.sauces.map((s) => (
              <OptionButton
                key={s.id}
                active={s.id === sSauce}
                onClick={() => setSauceId(s.id)}
                label={s.name}
                sub={Number(s.price) > 0 ? `+${formatPrice(s.price)}` : undefined}
              />
            ))}
          </div>
        </Section>

        {/* Ингредиенты */}
        <Section title="Ингредиенты" right={
          <span className="text-xs text-muted">{ingredientIds.length}/{maxIng}</span>
        }>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {data.ingredients.map((i) => {
              const selected = ingredientIds.includes(i.id);
              return (
                <button
                  key={i.id}
                  onClick={() => toggleIngredient(i.id)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl border p-3 text-left text-sm transition',
                    selected ? 'border-primary bg-primary/5' : 'border-line bg-surface hover:border-primary/40',
                  )}
                >
                  <span className="flex flex-col gap-1">
                    <span className="font-medium">{i.name}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-muted">+{formatPrice(i.price)}</span>
                      {i.isSpicy && <Flame className="h-3 w-3 text-danger" />}
                      {i.isVegan && <Leaf className="h-3 w-3 text-success" />}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border transition',
                      selected ? 'border-primary bg-primary text-white' : 'border-line text-transparent',
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Липкая сводка справа */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="card space-y-4 p-5">
          <ProductImage imageType="PIZZA" className="aspect-square w-full" />
          <div className="space-y-1">
            <h2 className="font-bold">Ваша пицца</h2>
            <p className="text-xs text-muted">
              {[size?.name, data.dough.find((x) => x.id === sDough)?.name]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <QuantityStepper value={qty} onChange={setQty} />
            <span className="text-xl font-extrabold">{formatPrice(price * qty)}</span>
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">
            <Plus className="h-4 w-4" /> Добавить в корзину
          </button>
          <AnimatePresence>
            {ingredientIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-1 border-t border-line pt-3"
              >
                {data.ingredients
                  .filter((i) => ingredientIds.includes(i.id))
                  .map((i) => (
                    <Badge key={i.id}>{i.name}</Badge>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>
    </div>
  );
}

function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function OptionButton({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'min-w-[120px] rounded-xl border px-4 py-3 text-left transition',
        active ? 'border-primary bg-primary text-white' : 'border-line bg-surface hover:border-primary/40',
      )}
    >
      <div className="text-sm font-semibold">{label}</div>
      {sub && <div className={cn('text-xs', active ? 'text-white/80' : 'text-muted')}>{sub}</div>}
    </button>
  );
}
