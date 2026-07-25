/**
 * Seed-скрипт: наполняет БД меню кафе «Рица» (Сочи).
 *
 * Категории:
 *   - сувлаки-шаурма
 *   - морепродукты и гриль
 *   - грузинская кухня
 *   - салаты
 *   - супы
 *   - детские блюда
 *   - десерты
 *   - напитки
 *
 * Также остаются: пицца (конструктор + готовые), бургеры, закуски.
 *
 * Запуск:  pnpm prisma:seed   (или npm run prisma:seed)
 */
import { PrismaClient, Role, ImageType, DoughType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const money = (v: number) => v.toFixed(2);

async function main() {
  // ── Администратор ────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@rica.local';
  const adminPass = process.env.ADMIN_PASSWORD ?? 'rica123456';
  const passwordHash = await bcrypt.hash(adminPass, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: 'Администратор', role: Role.ADMIN },
  });
  console.log(`✔ Админ создан: ${adminEmail} / ${adminPass}`);

  // ── Категории кафе «Рица» ────────────────────────────────────────────────
  const categories = await Promise.all(
    [
      // Новые категории для Рица
      { slug: 'suvlaki', name: 'Сувлаки и шаурма', icon: null, sortOrder: 1 },
      { slug: 'seafood', name: 'Морепродукты и гриль', icon: null, sortOrder: 2 },
      { slug: 'georgian', name: 'Грузинская кухня', icon: null, sortOrder: 3 },
      { slug: 'salads', name: 'Салаты', icon: 'salad', sortOrder: 4 },
      { slug: 'soups', name: 'Супы', icon: 'soup', sortOrder: 5 },
      { slug: 'kids', name: 'Детские блюда', icon: null, sortOrder: 6 },
      { slug: 'desserts', name: 'Десерты', icon: 'dessert', sortOrder: 7 },
      { slug: 'drinks', name: 'Напитки', icon: 'drink', sortOrder: 8 },
      // Остающиеся из Crudo
      { slug: 'pizza', name: 'Пицца', icon: null, sortOrder: 9 },
      { slug: 'burgers', name: 'Бургеры', icon: 'burger', sortOrder: 10 },
      { slug: 'snacks', name: 'Закуски', icon: 'snack', sortOrder: 11 },
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
    description?: string;
    category: string;
    image: ImageType;
    basePrice: number;
    weight?: number;
    kcal?: number;
    vegan?: boolean;
    spicy?: boolean;
    isFeatured?: boolean;
    variants?: { name: string; price: number; isDefault?: boolean }[];
  };

  const products: T[] = [
    // ── Сувлаки и шаурма ───────────────────────────────────────────────────
    {
      slug: 'pork-suvlaki-wrap',
      name: 'Сувлаки свинина',
      description: 'Свинина на гриле, лаваш, помидор, лук, соус цацики',
      category: 'suvlaki',
      image: ImageType.OTHER,
      basePrice: 349,
      weight: 280,
      kcal: 520,
      isFeatured: true,
    },
    {
      slug: 'chicken-suvlaki-wrap',
      name: 'Сувлаки курица',
      description: 'Куриное филе, лаваш, салат, томат, чесночный соус',
      category: 'suvlaki',
      image: ImageType.OTHER,
      basePrice: 329,
      weight: 270,
      kcal: 480,
      isFeatured: true,
    },
    {
      slug: 'shrimp-kebab',
      name: 'Кebab из креветок',
      description: 'Тигровые креветки, ананас, болгарский перец, соус ориентале',
      category: 'suvlaki',
      image: ImageType.OTHER,
      basePrice: 499,
      weight: 250,
      kcal: 380,
    },
    {
      slug: 'mixed-suvlaki-plate',
      name: 'Сувлаки-плат микс',
      description: 'Свинина + курица на тарелке с картофелем фри и соусами',
      category: 'suvlaki',
      image: ImageType.OTHER,
      basePrice: 549,
      weight: 420,
      kcal: 780,
      isFeatured: true,
    },
    {
      slug: 'falafel-wrap',
      name: 'Шаурма-фалафель',
      description: 'Хрустящий фалафель, хумус, салат табуле, маринованный лук',
      category: 'suvlaki',
      image: ImageType.OTHER,
      basePrice: 299,
      weight: 260,
      kcal: 420,
      vegan: true,
    },

    // ── Морепродукты и гриль ────────────────────────────────────────────────
    {
      slug: 'grilled-mix-plate',
      name: 'Гриль-плат морепродуктов',
      description: 'Креветки, мидии, кальмары, лимон, зелень',
      category: 'seafood',
      image: ImageType.OTHER,
      basePrice: 899,
      weight: 380,
      kcal: 320,
      isFeatured: true,
    },
    {
      slug: 'shrimp-pasta',
      name: 'Паста с креветками',
      description: 'Тальятелле, тигровые креветки, сливочный томатный соус',
      category: 'seafood',
      image: ImageType.OTHER,
      basePrice: 649,
      weight: 350,
      kcal: 580,
    },
    {
      slug: 'grilled-swordfish',
      name: 'Стейк из рыбы-меч',
      description: 'Рыба-меч на углях, соус верде, овощи гриль',
      category: 'seafood',
      image: ImageType.OTHER,
      basePrice: 799,
      weight: 300,
      kcal: 280,
      spicy: true,
    },
    {
      slug: 'seafood-pizza',
      name: 'Пицца с морепродуктами',
      description: 'Креветки, мидии, кальмар, моцарелла, сливочный соус',
      category: 'pizza',
      image: ImageType.PIZZA,
      basePrice: 649,
      weight: 450,
      kcal: 720,
      isFeatured: true,
    },
    {
      slug: 'mussels-in-cream',
      name: 'Мидии в сливочном соусе',
      description: 'Мидии, сливки, чеснок, петрушка, гренки',
      category: 'seafood',
      image: ImageType.OTHER,
      basePrice: 549,
      weight: 320,
      kcal: 380,
    },

    // ── Грузинская кухня ────────────────────────────────────────────────────
    {
      slug: 'khachapuri-adjarian',
      name: 'Хачапури по-аджарски',
      description: 'Лодочка с сыром сулугуни, маслом и желтком',
      category: 'georgian',
      image: ImageType.OTHER,
      basePrice: 399,
      weight: 320,
      kcal: 620,
      isFeatured: true,
    },
    {
      slug: 'khinkali',
      name: 'Хинкали (5 шт)',
      description: 'Сумочки с говядиной и свининой, кинза, чёрный перец',
      category: 'georgian',
      image: ImageType.OTHER,
      basePrice: 449,
      weight: 500,
      kcal: 720,
      spicy: true,
    },
    {
      slug: 'khinkali-cheese',
      name: 'Хинкали сырные (5 шт)',
      description: 'Сумочки с сыром сулугуни и аджьарули',
      category: 'georgian',
      image: ImageType.OTHER,
      basePrice: 379,
      weight: 480,
      kcal: 650,
    },
    {
      slug: 'khachapuri-mixed',
      name: 'Хачапури «Мегрельский»',
      description: 'Открытый пирог с сыром, яйцом и маслом',
      category: 'georgian',
      image: ImageType.OTHER,
      basePrice: 429,
      weight: 380,
      kcal: 680,
    },
    {
      slug: 'lobio',
      name: 'Лобио',
      description: 'Фасоль с грецким орехом, кинзой и специями',
      category: 'georgian',
      image: ImageType.OTHER,
      basePrice: 299,
      weight: 300,
      kcal: 340,
      vegan: true,
    },
    {
      slug: 'pkhali',
      name: 'Пхлаги микс (6 шт)',
      description: 'Шпинат, свёкла, фасоль — с грецким орехом',
      category: 'georgian',
      image: ImageType.OTHER,
      basePrice: 349,
      weight: 270,
      kcal: 310,
      vegan: true,
    },
    {
      slug: 'adjap-sandal',
      name: 'Аджапсандал',
      description: 'Баклажан, картофель, перец, томат, ореховый соус',
      category: 'georgian',
      image: ImageType.OTHER,
      basePrice: 319,
      weight: 320,
      kcal: 290,
      vegan: true,
    },
    {
      slug: 'mchadi-with-cheese',
      name: 'Мчади с сыром и зеленью',
      description: 'Кукурузная лепёшка, сулугуни, кинза, базилик',
      category: 'georgian',
      image: ImageType.OTHER,
      basePrice: 349,
      weight: 280,
      kcal: 420,
    },

    // ── Салаты ──────────────────────────────────────────────────────────────
    {
      slug: 'mediteranean-salad',
      name: 'Средиземноморский',
      description: 'Руккола, моцарелла, вяленые томаты, кедровый орех, бальзамик',
      category: 'salads',
      image: ImageType.SALAD,
      basePrice: 389,
      weight: 250,
      kcal: 280,
      isFeatured: true,
    },
    {
      slug: 'greek-salad',
      name: 'Греческий',
      description: 'Овечий сыр, томаты, огурцы, оливки, каперсы',
      category: 'salads',
      image: ImageType.SALAD,
      basePrice: 329,
      weight: 280,
      kcal: 260,
      vegan: true,
    },
    {
      slug: 'tuna-salad',
      name: 'Салат с тунцом',
      description: 'Тунец, микс салатов, авокадо, тайский соус',
      category: 'salads',
      image: ImageType.SALAD,
      basePrice: 429,
      weight: 260,
      kcal: 240,
    },
    {
      slug: 'cobb-salad',
      name: 'Кобб',
      description: 'Курица, бекон, яйцо, авокадо, голубой сыр',
      category: 'salads',
      image: ImageType.SALAD,
      basePrice: 449,
      weight: 300,
      kcal: 480,
    },

    // ── Супы ────────────────────────────────────────────────────────────────
    {
      slug: 'churchkhela-soup',
      name: 'Чирбуладжи',
      description: 'Грузинский суп с яйцом и айраном',
      category: 'soups',
      image: ImageType.SOUP,
      basePrice: 289,
      weight: 350,
      kcal: 220,
    },
    {
      slug: 'tomato-soup',
      name: 'Томатный суп-крем',
      description: 'Печёные томаты, базилик, сливки, гренки',
      category: 'soups',
      image: ImageType.SOUP,
      basePrice: 259,
      weight: 300,
      kcal: 210,
      vegan: true,
    },
    {
      slug: 'lobster-soup',
      name: 'Суп из морепродуктов',
      description: 'Креветки, мидии, рыба, томатный бульон, шафран',
      category: 'soups',
      image: ImageType.SOUP,
      basePrice: 499,
      weight: 380,
      kcal: 280,
      isFeatured: true,
    },

    // ── Детские блюда ───────────────────────────────────────────────────────
    {
      slug: 'kids-nuggets',
      name: 'Наггетсы детские',
      description: '5 шт куриных наггетсов с картофелем фри и соусом',
      category: 'kids',
      image: ImageType.SNACK,
      basePrice: 299,
      weight: 220,
      kcal: 420,
    },
    {
      slug: 'kids-mac-cheese',
      name: 'Макароны с сыром детские',
      description: 'Макароны, сливочный сыр, гренки',
      category: 'kids',
      image: ImageType.OTHER,
      basePrice: 279,
      weight: 200,
      kcal: 380,
    },
    {
      slug: 'kids-suvlaki',
      name: 'Мини-сувлаки',
      description: 'Нежная курица в лаваше с детским соусом',
      category: 'kids',
      image: ImageType.OTHER,
      basePrice: 319,
      weight: 180,
      kcal: 300,
    },

    // ── Десерты ─────────────────────────────────────────────────────────────
    {
      slug: 'churchkhela',
      name: 'Чурчхела',
      description: 'Грузинская чурчхела с грецким орехом и виноградным соком',
      category: 'desserts',
      image: ImageType.DESSERT,
      basePrice: 199,
      weight: 80,
      kcal: 340,
      isFeatured: true,
    },
    {
      slug: 'basbousa',
      name: 'Басбуса',
      description: 'Восточный десерт из манки с кокосом и сиропом',
      category: 'desserts',
      image: ImageType.DESSERT,
      basePrice: 219,
      weight: 120,
      kcal: 380,
    },
    {
      slug: 'baklava',
      name: 'Баглава',
      description: 'Слоёное тесто с орехами и мёдом',
      category: 'desserts',
      image: ImageType.DESSERT,
      basePrice: 249,
      weight: 150,
      kcal: 420,
    },

    // ── Напитки ─────────────────────────────────────────────────────────────
    {
      slug: 'compote-grape',
      name: 'Компот виноградный',
      description: 'Домашний, 0.7 л',
      category: 'drinks',
      image: ImageType.DRINK,
      basePrice: 199,
      weight: 700,
      kcal: 120,
      vegan: true,
    },
    {
      slug: 'tarhun',
      name: 'Тархун домашний',
      description: 'Свежий тархун с мятой, 0.5 л',
      category: 'drinks',
      image: ImageType.DRINK,
      basePrice: 179,
      weight: 500,
      kcal: 80,
      vegan: true,
    },
    {
      slug: 'fruit-juice',
      name: 'Сок натуральный',
      description: 'Апельсин / яблоко / виноград',
      category: 'drinks',
      image: ImageType.DRINK,
      basePrice: 149,
      weight: 330,
      kcal: 150,
      vegan: true,
    },
    {
      slug: 'cola',
      name: 'Кола 0.5',
      description: 'Освежающий газированный напиток',
      category: 'drinks',
      image: ImageType.DRINK,
      basePrice: 129,
      weight: 500,
      kcal: 210,
    },
    {
      slug: 'lemonade',
      name: 'Лимонад домашний',
      description: 'Лимон-мято-имбирь, 0.5 л',
      category: 'drinks',
      image: ImageType.DRINK,
      basePrice: 169,
      weight: 500,
      kcal: 90,
      vegan: true,
    },

    // ── Остальные (пицца, бургеры, закуски — из Crudo) ─────────────────────
    {
      slug: 'margherita',
      name: 'Маргарита',
      description: 'Томатный соус, моцарелла, базилик',
      category: 'pizza',
      image: ImageType.PIZZA,
      basePrice: 549,
      weight: 480,
      kcal: 980,
      isFeatured: true,
      variants: [
        { name: '25 см', price: 549 },
        { name: '30 см', price: 749, isDefault: true },
        { name: '35 см', price: 949 },
      ],
    },
    {
      slug: 'pepperoni',
      name: 'Пепперони',
      description: 'Острая пепперони, моцарелла, томатный соус',
      category: 'pizza',
      image: ImageType.PIZZA,
      basePrice: 649,
      weight: 510,
      kcal: 1100,
      spicy: true,
      isFeatured: true,
      variants: [
        { name: '25 см', price: 649 },
        { name: '30 см', price: 849, isDefault: true },
        { name: '35 см', price: 1049 },
      ],
    },
    {
      slug: 'quattro-formaggi',
      name: 'Четыре сыра',
      description: 'Моцарелла, дорблю, пармезан, чеддер',
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
      slug: 'classic-burger',
      name: 'Классический бургер',
      description: 'Говяжья котлета, чеддер, салат, соус',
      category: 'burgers',
      image: ImageType.BURGER,
      basePrice: 389,
      weight: 240,
      kcal: 620,
      isFeatured: true,
    },
    {
      slug: 'double-cheese',
      name: 'Двойной чизбургер',
      description: 'Две котлеты, двойной чеддер, бекон',
      category: 'burgers',
      image: ImageType.BURGER,
      basePrice: 459,
      weight: 300,
      kcal: 820,
    },
    {
      slug: 'fries',
      name: 'Картофель фри',
      description: 'Хрустящий картофель с солью',
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
      description: '6 шт. с соусом на выбор',
      category: 'snacks',
      image: ImageType.SNACK,
      basePrice: 219,
      weight: 180,
      kcal: 410,
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
  console.log('\n🍽  Меню кафе «Рица» — Сочи успешно загружено!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
