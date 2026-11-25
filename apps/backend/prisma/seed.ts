import { prisma } from "../src/config/database.js";

async function main() {
  const pashmina = await prisma.category.upsert({
    where: { slug: "pashmina" },
    update: {},
    create: {
      name: "Pashmina",
      slug: "pashmina",
      description: "Premium Nepalese shawls and cashmere products",
    },
  });

  const handicrafts = await prisma.category.upsert({
    where: { slug: "handicrafts" },
    update: {},
    create: {
      name: "Handicrafts",
      slug: "handicrafts",
      description: "Traditional Nepalese handmade products",
    },
  });

  const artisan = await prisma.artisan.upsert({
    where: { slug: "himalayan-artisan-collective" },
    update: {},
    create: {
      name: "Himalayan Artisan Collective",
      slug: "himalayan-artisan-collective",
      location: "Kathmandu, Nepal",
      bio: "Demonstration artisan profile for HimaCraft.",
      isVerified: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: "classic-pashmina-shawl" },
    update: {},
    create: {
      name: "Classic Pashmina Shawl",
      slug: "classic-pashmina-shawl",
      description: "A demonstration premium Nepalese shawl.",
      material: "Cashmere blend",
      categoryId: pashmina.id,
      artisanId: artisan.id,
      status: "ACTIVE",
      variants: {
        create: {
          sku: "HIMA-PASH-001",
          name: "Classic - Beige",
          color: "Beige",
          price: 850000,
          currency: "NPR",
          inventory: {
            create: {
              quantity: 20,
            },
          },
        },
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "traditional-handcrafted-bowl" },
    update: {},
    create: {
      name: "Traditional Handcrafted Bowl",
      slug: "traditional-handcrafted-bowl",
      description: "A demonstration Nepalese handicraft product.",
      material: "Handcrafted wood",
      categoryId: handicrafts.id,
      artisanId: artisan.id,
      status: "ACTIVE",
      variants: {
        create: {
          sku: "HIMA-HAND-001",
          name: "Natural Wood",
          price: 250000,
          currency: "NPR",
          inventory: {
            create: {
              quantity: 15,
            },
          },
        },
      },
    },
  });

  console.log("HimaCraft seed completed");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });