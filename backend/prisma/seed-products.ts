/** Create 3 test products directly in the database. */
import { PrismaClient, ImageType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find categories
  const suvlaki = await prisma.category.findUnique({ where: { slug: 'suvlaki' } });
  const seafood = await prisma.category.findUnique({ where: { slug: 'seafood' } });
  const georgian = await prisma.category.findUnique({ where: { slug: 'georgian' } });

  if (!suvlaki || !seafood || !georgian) {
    console.error('ERROR: categories not found. Run prisma db seed first.');
    process.exit(1);
  }

  const testProducts = [
    {
      slug: 'test-pork-suvlaki',
      name: 'Сувлаки из свинины',
      description: 'Сочная свинина, запечённая в сувлаке, с хрустящей корочкой и секретным соусом',
      categoryId: suvlaki.id,
      imageType: ImageType.OTHER,
      isVegan: false,
      isSpicy: false,
      isFeatured: true,
      isAvailable: true,
      basePrice: '390',
      weight: 250,
      kcal: 420,
      sortOrder: 1,
    },
    {
      slug: 'test-khinkali',
      name: 'Хинкали мясные',
      description: 'Грузинские хинкали с сочной мясной начинкой — 3 штуки в порции',
      categoryId: georgian.id,
      imageType: ImageType.OTHER,
      isVegan: false,
      isSpicy: true,
      isFeatured: true,
      isAvailable: true,
      basePrice: '520',
      weight: 300,
      kcal: 380,
      sortOrder: 2,
    },
    {
      slug: 'test-grilled-shrimp',
      name: 'Креветки гриль',
      description: 'Тигровые креветки на гриле с ароматным маслом и лимоном — подача с овощами',
      categoryId: seafood.id,
      imageType: ImageType.OTHER,
      isVegan: false,
      isSpicy: false,
      isFeatured: true,
      isAvailable: true,
      basePrice: '890',
      weight: 200,
      kcal: 260,
      sortOrder: 3,
    },
  ];

  for (const p of testProducts) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`✔ Товар уже существует: ${p.name}`);
      continue;
    }
    const created = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        categoryId: p.categoryId,
        imageType: p.imageType,
        isVegan: p.isVegan,
        isSpicy: p.isSpicy,
        isFeatured: p.isFeatured,
        isAvailable: p.isAvailable,
        basePrice: p.basePrice,
        weight: p.weight,
        kcal: p.kcal,
        sortOrder: p.sortOrder,
        variants: {
          create: [{ name: 'Стандарт', price: p.basePrice, isDefault: true }],
        },
      },
      include: { variants: true },
    });
    console.log(`✔ Создан товар: ${created.name} (${created.slug}) — ${created.basePrice}₽`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
