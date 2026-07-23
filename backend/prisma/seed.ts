/**
 * Seed-скрипт: наполняет БД демо-данными (категории, товары, опции пиццы, админ).
 * Запуск:  pnpm prisma:seed   (или npm run prisma:seed)
 */
import { PrismaClient, Role, ImageType, DoughType, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const money = (v: number) => v.toFixed(2);

async function main() {
  // ── Администратор по умолчанию ────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@crudo.local';
  const adminPass = process.env.ADMIN_PASSWORD ?? 'admin12345';
  const passwordHash = await bcrypt.hash(adminPass, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: 'Администратор', role: Role.ADMIN },
  });
  console.log(`✔ Админ создан: ${adminEmail} / ${adminPass}`);

  // ── Категории ─────────────────────────────────────────────────────────────
  const categories = await Promise.all(
    [
      { slug: 'pizza', name: 'Пицца', icon: 'pizza', sortOrder: 1 },
      { slug: 'burgers', name: 'Бургеры', icon: 'burger', sortOrder: 2 },
      { slug: 'snacks', name: 'Закуски', icon: 'snack', sortOrder: 3 },
      { slug: 'salads', name: 'Салаты', icon: 'salad', sortOrder: 4 },
      { slug: 'soups', name: 'Супы', icon: 'soup', sortOrder: 5 },
      { slug: 'desserts', name: 'Десерты', icon: 'dessert', sortOrder: 6 },
      { slug: 'drinks', name: 'Напитки', icon: 'drink', sortOrder: 7 },
    ].map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      }),
    ),
  );
  const cat = (slug: string) => categories.find((c) => c.slug === slug)!;

  // ── Товары ────────────────────────────────────────────────────────────────
  type T = {
    slug: string;
    name: string;
    desc?: string;
    category: string;
    image: ImageType;
    basePrice: number;
    weight?: number;
    kcal?: number;
    vegan?: boolean;
    spicy?: boolean;
    featured?: boolean;
    variants?: { name: string; price: number; isDefault?: boolean }[];
  };

  const products: T[] = [
    {
      slug: 'margherita',
      name: 'Маргарита',
      desc: 'Томатный соус, моцарелла, базилик',
      category: 'pizza',
      image: ImageType.PIZZA,
      basePrice: 549,
      weight: 480,
      kcal: 980,
      featured: true,
      variants: [
        { name: '25 см', price: 549 },
        { name: '30 см', price: 749, isDefault: true },
        { name: '35 см', price: 949 },
      ],
    },
    {
      slug: 'pepperoni',
      name: 'Пепперони',
      desc: 'Острая пепперони, моцарелла, томатный соус',
      category: 'pizza',
      image: ImageType.PIZZA,
      basePrice: 649,
      weight: 510,
      kcal: 1100,
      spicy: true,
      featured: true,
      variants: [
        { name: '25 см', price: 649 },
        { name: '30 см', price: 849, isDefault: true },
        { name: '35 см', price: 1049 },
      ],
    },
    {
      slug: 'quattro-formaggi',
      name: 'Четыре сыра',
      desc: 'Моцарелла, дорблю, пармезан, чеддер',
      category: 'pizza',
      image: ImageType.PIZZA,
      basePrice: 699,
      weight: 500,
      kcal: 1150,
      variants: [
        { name: '25 см', price: 699 },
        { name: '30 см', price: 899, isDefault: true },
        { name: '35 см', price: 1099 },
      ],
    },
    {
      slug: 'veggie-pizza',
      name: 'Вегано',
      desc: 'Томаты, перец, шампиньоны, оливки, базилик',
      category: 'pizza',
      image: ImageType.PIZZA,
      basePrice: 599,
      weight: 460,
      kcal: 820,
      vegan: true,
      variants: [
        { name: '25 см', price: 599 },
        { name: '30 см', price: 799, isDefault: true },
        { name: '35 см', price: 999 },
      ],
    },
    {
      slug: 'classic-burger',
      name: 'Классический бургер',
      desc: 'Говяжья котлета, чеддер, салат, соус',
      category: 'burgers',
      image: ImageType.BURGER,
      basePrice: 389,
      weight: 240,
      kcal: 620,
      featured: true,
    },
    {
      slug: 'double-cheese',
      name: 'Двойной чизбургер',
      desc: 'Две котлеты, двойной чеддер, бекон',
      category: 'burgers',
      image: ImageType.BURGER,
      basePrice: 459,
      weight: 300,
      kcal: 820,
    },
    {
      slug: 'chicken-burger',
      name: 'Чикен бургер',
      desc: 'Куриное филе, салат айсберг, соус чипотле',
      category: 'burgers',
      image: ImageType.BURGER,
      basePrice: 359,
      weight: 230,
      kcal: 540,
    },
    {
      slug: 'fries',
      name: 'Картофель фри',
      desc: 'Хрустящий картофель с солью',
      category: 'snacks',
      image: ImageType.SNACK,
      basePrice: 149,
      weight: 150,
      kcal: 320,
      variants: [
        { name: 'Стандарт', price: 149, isDefault: true },
        { name: 'Большой', price: 199 },
      ],
    },
    {
      slug: 'nuggets',
      name: 'Куриные наггетсы',
      desc: '6 шт. с соусом на выбор',
      category: 'snacks',
      image: ImageType.SNACK,
      basePrice: 219,
      weight: 180,
      kcal: 410,
    },
    {
      slug: 'caesar',
      name: 'Цезарь с курицей',
      desc: 'Куриное филе, салат романо, пармезан, гренки',
      category: 'salads',
      image: ImageType.SALAD,
      basePrice: 329,
      weight: 220,
      kcal: 380,
    },
    {
      slug: 'greek-salad',
      name: 'Греческий',
      desc: 'Овечий сыр, томаты, огурцы, оливки',
      category: 'salads',
      image: ImageType.SALAD,
      basePrice: 299,
      weight: 210,
      kcal: 290,
      vegan: true,
    },
    {
      slug: 'tomato-soup',
      name: 'Томатный суп-крем',
      desc: 'Печёные томаты, базилик, сливки',
      category: 'soups',
      image: ImageType.SOUP,
      basePrice: 259,
      weight: 300,
      kcal: 210,
      vegan: true,
    },
    {
      slug: 'cheesecake',
      name: 'Чизкейк',
      desc: 'Нью-йоркский чизкейк с ягодным соусом',
      category: 'desserts',
      image: ImageType.DESSERT,
      basePrice: 249,
      weight: 140,
      kcal: 420,
      featured: true,
    },
    {
      slug: 'tiramisu',
      name: 'Тирамису',
      desc: 'Классический итальянский десерт',
      category: 'desserts',
      image: ImageType.DESSERT,
      basePrice: 269,
      weight: 150,
      kcal: 390,
    },
    {
      slug: 'cola',
      name: 'Кола 0.5',
      desc: 'Освежающий напиток',
      category: 'drinks',
      image: ImageType.DRINK,
      basePrice: 129,
      weight: 500,
      kcal: 210,
      variants: [
        { name: '0.5 л', price: 129, isDefault: true },
        { name: '1 л', price: 179 },
      ],
    },
    {
      slug: 'fresh-orange',
      name: 'Апельсиновый фреш',
      desc: 'Свежевыжатый, 0.3 л',
      category: 'drinks',
      image: ImageType.DRINK,
      basePrice: 189,
      weight: 300,
      kcal: 140,
      vegan: true,
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue;
    const { variants, category, image, basePrice, ...rest } = p;
    const created = await prisma.product.create({
      data: {
        ...rest,
        basePrice: money(basePrice),
        imageType: image,
        category: { connect: { slug: category } },
      },
    });
    if (variants?.length) {
      await prisma.productVariant.createMany({
        data: variants.map((v) => ({
          productId: created.id,
          name: v.name,
          price: money(v.price),
          isDefault: v.isDefault ?? false,
        })),
      });
    } else {
      await prisma.productVariant.create({
        data: { productId: created.id, name: 'Стандарт', price: money(basePrice), isDefault: true },
      });
    }
  }
  console.log(`✔ Создано товаров: ${products.length}`);

  // ── Опции конструктора пиццы ───────────────────────────────────────────────
  await prisma.pizzaSize.createMany({
    data: [
      { name: '25 см', basePrice: money(399), maxIngredients: 6, sortOrder: 1 },
      { name: '30 см', basePrice: money(549), maxIngredients: 8, sortOrder: 2 },
      { name: '35 см', basePrice: money(699), maxIngredients: 10, sortOrder: 3 },
    ],
    skipDuplicates: true,
  });

  await prisma.doughOption.createMany({
    data: [
      { type: DoughType.TRADITIONAL, name: 'Традиционное', price: money(0) },
      { type: DoughType.THIN, name: 'Тонкое', price: money(49) },
    ],
    skipDuplicates: true,
  });

  await prisma.sauce.createMany({
    data: [
      { name: 'Томатный', price: money(0), sortOrder: 1 },
      { name: 'Барбекю', price: money(39), sortOrder: 2 },
      { name: 'Сливочный', price: money(49), sortOrder: 3 },
    ],
    skipDuplicates: true,
  });

  const ingredients = [
    { name: 'Моцарелла', price: 99 },
    { name: 'Пепперони', price: 119, spicy: true },
    { name: 'Шампиньоны', price: 79 },
    { name: 'Бекон', price: 129 },
    { name: 'Ветчина', price: 109 },
    { name: 'Лук', price: 49 },
    { name: 'Перец халапеньо', price: 69, spicy: true },
    { name: 'Оливки', price: 79, vegan: true },
    { name: 'Томаты', price: 69, vegan: true },
    { name: 'Болгарский перец', price: 69, vegan: true },
    { name: 'Ананас', price: 89 },
    { name: 'Пармезан', price: 139 },
  ];
  await prisma.ingredient.createMany({
    data: ingredients.map((i, idx) => ({
      name: i.name,
      price: money(i.price),
      isVegan: i.vegan ?? false,
      isSpicy: i.spicy ?? false,
      sortOrder: idx,
    })),
    skipDuplicates: true,
  });
  console.log('✔ Опции конструктора пиццы готовы');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
