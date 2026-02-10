import "dotenv/config"
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL});
const prisma = new PrismaClient({ adapter });

async function main() {
  const cities = ["Chișinău", "Bălți"];
  const categories = [
    "Iluminat stradal",
    "Gropi / drumuri",
    "Gunoi / salubrizare",
    "Parcări / trafic",
    "Siguranță publică",
    "Zgomot",
    "Spații verzi",
    "Altele"
  ];

  await prisma.city.createMany({
    data: cities.map((name) => ({ name })),
    skipDuplicates: true
  });

  await prisma.category.createMany({
    data: categories.map((name) => ({ name })),
    skipDuplicates: true
  });

  const cityCount = await prisma.city.count();
  const catCount = await prisma.category.count();

  console.log(`Seed done: cities=${cityCount}, categories=${catCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
