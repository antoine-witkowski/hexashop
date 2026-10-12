import type { OrderEvent } from "../../domain/events.js";

export interface EventPublisher {
  publish(events: readonly OrderEvent[]): Promise<void>;
}
