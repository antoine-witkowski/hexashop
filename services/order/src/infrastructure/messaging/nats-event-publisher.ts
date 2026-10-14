import type { JetStreamClient } from "@nats-io/jetstream";
import type { EventPublisher } from "../../application/ports/event-publisher.js";
import type { OrderEvent } from "../../domain/events.js";
import { toEnvelope } from "./order-event-envelope.js";

export class NatsEventPublisher implements EventPublisher {
  constructor(private readonly js: JetStreamClient) {}

  async publish(events: readonly OrderEvent[]): Promise<void> {
    for (const event of events) {
      const { subject, envelope } = toEnvelope(event);
      await this.js.publish(subject, JSON.stringify(envelope), {
        msgID: envelope.eventId,
      });
    }
  }
}
