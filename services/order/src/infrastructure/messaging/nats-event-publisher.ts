import { randomUUID } from "node:crypto";
import { orderEventSubject, OrderPlaced } from "@hexashop/contracts";
import type { JetStreamClient } from "@nats-io/jetstream";
import type { EventPublisher } from "../../application/ports/event-publisher.js";
import type { OrderEvent } from "../../domain/events.js";

export class NatsEventPublisher implements EventPublisher {
  constructor(private readonly js: JetStreamClient) {}

  async publish(events: readonly OrderEvent[]): Promise<void> {
    for (const event of events) {
      const envelope = OrderPlaced.parse({
        eventId: randomUUID(),
        occurredAt: event.occurredAt.toISOString(),
        aggregateId: event.orderId,
        type: event.type,
        version: 1,
        payload: {
          orderId: event.orderId,
          customerId: event.customerId,
          lines: event.lines,
          totalCents: event.totalCents,
        },
      });

      await this.js.publish(
        orderEventSubject(envelope.type, envelope.aggregateId),
        JSON.stringify(envelope),
        { msgID: envelope.eventId },
      );
    }
  }
}
