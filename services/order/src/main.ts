import { jetstream } from "@nats-io/jetstream";
import { connect } from "@nats-io/transport-node";
import { NestFactory } from "@nestjs/core";
import { loadConfig } from "./infrastructure/config.js";
import { OrderModule } from "./infrastructure/http/order.module.js";
import { NatsEventPublisher } from "./infrastructure/messaging/nats-event-publisher.js";
import { createPrismaClient } from "./infrastructure/persistence/prisma-client.js";
import { PrismaOrderRepository } from "./infrastructure/persistence/prisma-order-repository.js";

const config = loadConfig(process.env);
const prisma = createPrismaClient(config.DATABASE_URL);
const nats = await connect({ servers: config.NATS_URL });

const app = await NestFactory.create(
  OrderModule.register({
    orderRepository: new PrismaOrderRepository(prisma),
    eventPublisher: new NatsEventPublisher(jetstream(nats)),
  }),
);

async function shutdown(): Promise<void> {
  await app.close();
  await nats.drain();
  await prisma.$disconnect();
}
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

await app.listen(config.PORT);
