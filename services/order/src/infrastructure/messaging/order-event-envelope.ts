import { randomUUID } from "node:crypto";
import { orderEventSubject, OrderPlaced } from "@hexashop/contracts";
import type { OrderEvent } from "../../domain/events.js";

export function toEnvelope(event: OrderEvent): {
  subject: string;
  envelope: OrderPlaced;
} {
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

  return {
    subject: orderEventSubject(envelope.type, envelope.aggregateId),
    envelope: envelope,
  };
}
