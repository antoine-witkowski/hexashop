import { setTimeout as sleep } from "node:timers/promises";
import { jetstream } from "@nats-io/jetstream";
import { connect } from "@nats-io/transport-node";
import { loadConfig } from "./infrastructure/config.js";
import { OutboxRelay } from "./infrastructure/outbox/outbox-relay.js";
import { createPrismaClient } from "./infrastructure/persistence/prisma-client.js";

const config = loadConfig(process.env);

const prisma = createPrismaClient(config.DATABASE_URL);
const nats = await connect({
  servers: config.NATS_URL,
  maxReconnectAttempts: -1,
});

const stop = new AbortController();
process.once("SIGINT", () => {
  stop.abort();
});
process.once("SIGTERM", () => {
  stop.abort();
});

const relay = new OutboxRelay(prisma, jetstream(nats));

console.log("Outbox relay started");

while (!stop.signal.aborted) {
  try {
    const count = await relay.publishBatch();
    if (count > 0) {
      console.log(`Published ${String(count)} event(s)`);
    }
  } catch (error) {
    console.error("Outbox batch failed, will retry:", error);
  }
  await sleep(500);
}

await nats.drain();
await prisma.$disconnect();
