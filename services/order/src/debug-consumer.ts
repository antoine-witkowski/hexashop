import { OrderPlaced, ORDERS_STREAM } from "@hexashop/contracts";
import {
  AckPolicy,
  DeliverPolicy,
  jetstream,
  jetstreamManager,
} from "@nats-io/jetstream";
import { connect } from "@nats-io/transport-node";
import { z } from "zod";

const CONSUMER_NAME = "debug-consumer";

const config = z
  .object({ NATS_URL: z.url({ protocol: /^nats$/ }) })
  .parse(process.env);

const nats = await connect({
  servers: config.NATS_URL,
  maxReconnectAttempts: -1,
});

const jsm = await jetstreamManager(nats);
await jsm.consumers.add(ORDERS_STREAM, {
  durable_name: CONSUMER_NAME,
  ack_policy: AckPolicy.Explicit,
  deliver_policy: DeliverPolicy.All,
});

const consumer = await jetstream(nats).consumers.get(
  ORDERS_STREAM,
  CONSUMER_NAME,
);
const messages = await consumer.consume();

async function shutdown(): Promise<void> {
  await messages.close();
  await nats.drain();
}
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

console.log(`Listening on ${ORDERS_STREAM} as "${CONSUMER_NAME}"...`);

// Runs forever: one turn per message, waits for the next one.
for await (const message of messages) {
  const result = OrderPlaced.safeParse(message.json());

  if (!result.success) {
    console.error("invalid event:\n" + z.prettifyError(result.error));
    message.term();
    continue;
  }

  const event = result.data;

  const { seq } = message;
  const { type, aggregateId, payload } = event;

  console.log(
    `[seq=${String(seq)}] ${type} | aggregate=${aggregateId} | totalCents=${String(payload.totalCents)} | lines=${String(payload.lines.length)}`,
  );

  message.ack();
}
