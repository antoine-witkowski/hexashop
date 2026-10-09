import { NestFactory } from "@nestjs/core";
import { loadConfig } from "./infrastructure/config.js";
import { OrderModule } from "./infrastructure/http/order.module.js";
import { createPrismaClient } from "./infrastructure/persistence/prisma-client.js";
import { PrismaOrderRepository } from "./infrastructure/persistence/prisma-order-repository.js";

const config = loadConfig(process.env);
const prisma = createPrismaClient(config.DATABASE_URL);

const app = await NestFactory.create(
  OrderModule.register({ orderRepository: new PrismaOrderRepository(prisma) }),
);
app.enableShutdownHooks();
await app.listen(config.PORT);
