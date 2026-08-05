/**
 * Seed-скрипт: наполняет БД меню кафе «Рица» (Сочи).
 * Запуск:  npx prisma db push && npx prisma db seed (из frontend/)
 */
import { PrismaClient, Role, ImageType } from '@prisma/client';
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

  // ── Категории ─────────────────────────────────────────────────────────────
  const categories = await Promise.all(
    [
      { slug: 'breakfast', name: 'Завтрак', icon: 'breakfast', sortOrder: 1 },
      { slug: 'snacks', name: 'Закуски', icon: 'snack', sortOrder: 2 },
      { slug: 'salads', name: 'Салаты', icon: 'salad', sortOrder: 3 },
      { slug: 'soups', name: 'Супы', icon: 'soup', sortOrder: 4 },
      { slug: 'pasta', name: 'Паста', icon: null, sortOrder: 5 },
      { slug: 'meat', name: 'Мясные блюда', icon: null, sortOrder: 6 },
      { slug: 'fish', name: 'Блюда из рыбы и морепродуктов', icon: 'fish', sortOrder: 7 },
      { slug: 'pizza', name: 'Пицца 35см', icon: null, sortOrder: 8 },
      { slug: 'burgers', name: 'Бургеры и хот-доги', icon: 'burger', sortOrder: 9 },
      { slug: 'caucasian-pastry', name: 'Выпечка из кавказской кухни', icon: null, sortOrder: 10 },
      { slug: 'sauces', name: 'Соусы', icon: null, sortOrder: 11 },
      { slug: 'desserts', name: 'Десерты', icon: 'dessert', sortOrder: 12 },
      { slug: 'bar', name: 'Бар Меню', icon: 'drink', sortOrder: 13 },
      { slug: 'drinks', name: 'Напитки', icon: 'drink', sortOrder: 14 },
    ].map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      }),
    ),
  );
  const cat = (slug: string) => categories.find((c) => c.slug === slug)!;
  console.log(`✔ Создано категорий: ${categories.length}`);

  // ── Завтраки ──────────────────────────────────────────────────────────────
  const breakfast = [
    { slug: 'kruassan-s-maslom', name: 'Круассан с маслом', description: 'Свежий круассан, подаётся только из духовки', price: 250 },
    { slug: 'kruassan-s-semgoy-ss', name: 'Круассан с семгой с.с', description: 'Круассан с слабосолёной семгой', price: 550 },
    { slug: 'kruassan-s-vetchinoi', name: 'Круассан с ветчиной', description: 'Сытный круассан с начинкой из ветчины', price: 515 },
    { slug: 'kruassan-na-desert', name: 'Круассан на десерт', description: 'Сладкий десертный вариант круассана', price: 450 },
    { slug: 'belgiiskie-vafli-s-semgoy-i-yaytsom-pashot', name: 'Бельгийские вафли с семгой и яйцом пашот', description: 'Вафли с слабосолёной семгой и яйцом пашот', price: 650 },
    { slug: 'belgiiskie-vafli-s-yagodoy-i-morozhenym', name: 'Бельгийские вафли с ягодой и мороженым', description: 'Вафли с ягодами и шариком мороженого', price: 510 },
    { slug: 'sirniki', name: 'Сырники', description: 'Творожные сырники с джемом и сметаной', price: 370 },
    { slug: 'blinchiki', name: 'Блинчики', description: 'Тонкие блинчики со сметаной и джемом', price: 340 },
    { slug: 'blinchiki-s-lososem', name: 'Блинчики с лососем и сливочным сыром', description: 'Блинчики с лососем и нежным сливочным сыром', price: 640 },
    { slug: 'draniki-so-smetanoy', name: 'Драники со сметаной', description: 'Картофельные драники со сметаной', price: 350 },
    { slug: 'draniki-s-semgoy-i-yaytsom-pashot', name: 'Драники с семгой и яйцом пашот', description: 'Драники с слабосолёной семгой и яйцом пашот', price: 680 },
    { slug: 'grenki-s-parmezanom', name: 'Гренки с пармезаном', description: 'Хрустящие гренки с тёртым пармезаном', price: 390 },
    { slug: 'kasha-na-vibor', name: 'Каша на выбор', description: 'Овсяная, манная, рисовая или злаковая каша на выбор', price: 300 },
    { slug: 'kukuruznaya-s-parmezanom', name: 'Кукурузная с пармезаном', description: 'Кукурузная каша с добавлением пармезана', price: 360 },
    { slug: 'shakshuka', name: 'Шакшука', description: 'Яйца, запечённые в пряном томатном соусе с овощами', price: 430 },
    { slug: 'glazunya', name: 'Глазунья', description: 'Классическая яичница-глазунья', price: 290 },
    { slug: 'skrembl-s-tomatami', name: 'Скрембл с томатами', description: 'Мягкий яичный скрэмбл с помидорами, из 3 яиц', price: 350 },
    { slug: 'fritatta', name: 'Фритатта', description: 'Итальянский омлет с фасолью', price: 410 },
  ];

  // ── Закуски ───────────────────────────────────────────────────────────────
  const snacks = [
    { slug: 'zharenniy-suluguni', name: 'Жареный сулугуни', description: 'Обжаренный кавказский сыр сулугуни', price: 520 },
    { slug: 'krevetka-tigrovaya', name: 'Креветка тигровая', description: 'Порция тигровых креветок (горячая закуска)', price: 680 },
    { slug: 'kurinie-stripsy', name: 'Куриные стрипсы', description: 'Обжаренные полоски куриного филе в панировке', price: 480 },
    { slug: 'solenie-', name: 'Соленье', description: 'Ассорти домашних солений', price: 380 },
    { slug: 'semga-ss', name: 'Семга с.с', description: 'Слабосолёная сёмга', price: 720 },
    { slug: 'seledochka-s-kartofelem', name: 'Селёдочка с картофелем', description: 'Сельдь с отварным картофелем', price: 390 },
    { slug: 'myasnoe-assorti', name: 'Мясное ассорти', description: 'Буженина, сырокопчёная колбаса, бастурма, суджук, хрен', price: 750 },
    { slug: 'syrnoe-plato-kavkaz', name: 'Сырное плато «Кавказ»', description: 'Чанах, мёд, адыгейский, молочный, сулугуни, пармезан', price: 750 },
    { slug: 'maslini-olivki', name: 'Маслины-оливки', description: 'Порция маслин и оливок, 100 г', price: 250 },
  ];

  // ── Салаты ────────────────────────────────────────────────────────────────
  const salads = [
    { slug: 'salat-letniy', name: 'Салат «Летний»', description: 'Лёгкий овощной салат с авокадо', price: 380 },
    { slug: 'tsezar-s-kurinoy-grudkoy', name: 'Цезарь с куриной грудкой', description: 'Классический салат Цезарь с куриной грудкой', price: 460 },
    { slug: 'tsezar-s-semgoy-ss', name: 'Цезарь с семгой с.с', description: 'Цезарь с слабосолёной сёмгой', price: 590 },
    { slug: 'tsezar-s-krevetkoy', name: 'Цезарь с креветкой', description: 'Цезарь с добавлением креветок', price: 610 },
    { slug: 'lazzat-s-hrustyaschim-baklazhanom', name: 'Лаззат с хрустящим баклажаном', description: 'Салат с хрустящим баклажаном в восточном стиле', price: 580 },
    { slug: 'tepliy-s-mramornoy-govyadinoy', name: 'Тёплый с мраморной говядиной', description: 'Тёплый салат с кусочками мраморной говядины', price: 680 },
    { slug: 'rukola-s-krevetkoy', name: 'Руккола с креветкой', description: 'Салат на основе рукколы с креветками', price: 690 },
    { slug: 's-semgoy-kinoa-i-apelsinom', name: 'С сёмгой, киноа и апельсином', description: 'Салат с сёмгой, киноа и цитрусовыми нотами апельсина', price: 720 },
  ];

  // ── Супы ──────────────────────────────────────────────────────────────────
  const soups = [
    { slug: 'borsch-s-govyadinoy', name: 'Борщ с говядиной', description: 'Классический борщ с говядиной', price: 520 },
  ];

  // ── Соусы ─────────────────────────────────────────────────────────────────
  const sauces = [
    { slug: 'barbekyu-heinz', name: 'Барбикю Heinz', description: 'Фирменный соус барбекю от Heinz', price: 99 },
    { slug: 'ketchup', name: 'Кетчуп', description: 'Классический томатный кетчуп', price: 99 },
    { slug: 'slivochno-gorchichniy', name: 'Сливочно-горчичный', description: 'Нежный соус на основе сливок и горчицы', price: 99 },
    { slug: 'syrniy-heinz', name: 'Сырный Heinz', description: 'Сливочно-сырный соус от Heinz', price: 99 },
    { slug: 'tzakhton', name: 'Цахтон', description: 'Кавказский соус на основе кисломолочных продуктов с зеленью и специями', price: 99 },
  ];

  // ── Десерты ───────────────────────────────────────────────────────────────
  const desserts = [
    { slug: 'napoleon', name: 'Наполеон', description: 'Классический слоёный торт «Наполеон» с заварным кремом', price: 350 },
  ];

  // ── Напитки ───────────────────────────────────────────────────────────────
  const drinks = [
    { slug: 'borzhomi', name: 'Боржоми', description: 'Минеральная газированная вода «Боржоми»', price: 250 },
  ];

  // ── Объединяем все блюда ──────────────────────────────────────────────────
  const allProducts: Array<{
    slug: string; name: string; description: string; category: string; price: number;
  }> = [
    ...breakfast.map((p) => ({ ...p, category: 'breakfast' })),
    ...snacks.map((p) => ({ ...p, category: 'snacks' })),
    ...salads.map((p) => ({ ...p, category: 'salads' })),
    ...soups.map((p) => ({ ...p, category: 'soups' })),
    ...sauces.map((p) => ({ ...p, category: 'sauces' })),
    ...desserts.map((p) => ({ ...p, category: 'desserts' })),
    ...drinks.map((p) => ({ ...p, category: 'drinks' })),
  ];

  console.log(`\n📋 Всего блюд для загрузки: ${allProducts.length}`);

  // ── Загружаем блюда ───────────────────────────────────────────────────────
  let created = 0;
  for (const p of allProducts) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  ⏭ Пропущен (уже есть): ${p.name}`);
      continue;
    }

    const createdProduct = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        basePrice: money(p.price),
        imageType: ImageType.OTHER,
        category: { connect: { slug: p.category } },
      },
    });

    // Создаём стандартную вариацию
    await prisma.productVariant.create({
      data: {
        productId: createdProduct.id,
        name: 'Стандарт',
        price: money(p.price),
        isDefault: true,
      },
    });

    created++;
    console.log(`  ✔ Создан: ${p.name} — ${p.price}р`);
  }

  console.log(`\n✔ Создано товаров: ${created} из ${allProducts.length}`);

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
      { type: 'TRADITIONAL' as any, name: 'Традиционное', price: money(0) },
      { type: 'THIN' as any, name: 'Тонкое', price: money(49) },
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
    { name: 'Пепперони', price: 119 },
    { name: 'Шампиньоны', price: 79 },
    { name: 'Бекон', price: 129 },
    { name: 'Ветчина', price: 109 },
    { name: 'Лук', price: 49 },
    { name: 'Перец халапеньо', price: 69 },
    { name: 'Оливки', price: 79 },
    { name: 'Томаты', price: 69 },
    { name: 'Болгарский перец', price: 69 },
    { name: 'Ананас', price: 89 },
    { name: 'Пармезан', price: 139 },
  ];
  await prisma.ingredient.createMany({
    data: ingredients.map((i, idx) => ({
      name: i.name,
      price: money(i.price),
      isVegan: false,
      isSpicy: false,
      sortOrder: idx,
    })),
    skipDuplicates: true,
  });
  console.log('✔ Опции конструктора пиццы готовы');

  console.log('\n🍽  Меню кафе «Рица» успешно загружено!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
