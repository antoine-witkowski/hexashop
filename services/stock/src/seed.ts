import { createPrismaClient } from "./infrastructure/persistence/prisma-client.js";

const prisma = createPrismaClient(process.env.DATABASE_URL ?? "");

const items = [
  { sku: "BOOK-1", available: 10 },
  { sku: "BOOK-2", available: 20 },
  { sku: "BOOK-3", available: 30 },
  { sku: "PEN-1", available: 10 },
  { sku: "RARE-1", available: 1 },
];

for (const item of items) {
  await prisma.stockItem.upsert({
    where: { sku: item.sku },
    create: {
      sku: item.sku,
      available: item.available,
      reserved: 0,
    },
    update: { reserved: 0 },
  });
}

console.log(`Seeded ${String(items.length)} stock items`);
await prisma.$disconnect();
