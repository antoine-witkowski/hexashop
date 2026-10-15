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
const POLL_INTERVAL_MS = 1000; // 1 sec
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
let lastCleanupAt = 0;

console.log("Outbox relay started");

while (!stop.signal.aborted) {
  try {
    const count = await relay.publishBatch();
    if (count > 0) {
      console.log(`Published ${String(count)} event(s)`);
    }

    if (Date.now() - lastCleanupAt > CLEANUP_INTERVAL_MS) {
      const deleted = await relay.deletePublishedBefore(
        new Date(Date.now() - RETENTION_MS),
      );
      if (deleted > 0) {
        console.log(`Deleted ${String(deleted)} published event(s)`);
      }

      lastCleanupAt = Date.now();
    }
  } catch (error) {
    console.error("Outbox batch failed, will retry:", error);
  }
  await sleep(POLL_INTERVAL_MS);
}

await nats.drain();
await prisma.$disconnect();
