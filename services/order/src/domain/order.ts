import { EmptyOrderError, InvalidStatusTransitionError } from "./errors.js";
import type { OrderEvent } from "./events.js";
import type { OrderLine } from "./order-line.js";

export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "SHIPPED";

// For each status, the statuses an order may move to next.
const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED"],
  CANCELLED: [],
  SHIPPED: [],
};

function totalOf(lines: readonly OrderLine[]): number {
  let total: number = 0;
  lines.forEach((line) => {
    total += line.subtotalCents;
  });

  return total;
}

export class Order {
  // Private state: only the methods below can change it.
  #status: OrderStatus;
  #events: OrderEvent[] = [];

  // Private: use Order.place() or Order.reconstitute() instead.
  private constructor(
    readonly id: string,
    readonly customerId: string,
    status: OrderStatus,
    readonly lines: readonly OrderLine[],
    readonly totalCents: number,
    readonly placedAt: Date,
  ) {
    this.#status = status;
  }

  // Creates a new order: applies the creation rules and records OrderPlaced.
  static place(props: {
    id: string;
    customerId: string;
    lines: readonly OrderLine[];
    placedAt: Date;
  }): Order {
    const { id, customerId, lines, placedAt } = props;
    const status = "PENDING";

    if (lines.length === 0) {
      throw new EmptyOrderError();
    }

    const totalCents: number = totalOf(lines);

    const order = new Order(
      id,
      customerId,
      status,
      [...lines],
      totalCents,
      placedAt,
    );

    order.#events.push({
      type: "OrderPlaced",
      orderId: order.id,
      customerId: order.customerId,
      lines: order.lines.map((line) => {
        return { sku: line.sku, quantity: line.quantity };
      }),
      totalCents: order.totalCents,
      occurredAt: order.placedAt,
    });

    return order;
  }

  // Rebuilds an order that already exists (e.g. loaded from the database):
  // no creation rules, no event.
  static reconstitute(props: {
    id: string;
    customerId: string;
    status: OrderStatus;
    lines: readonly OrderLine[];
    placedAt: Date;
  }): Order {
    const { id, customerId, status, lines, placedAt } = props;
    const totalCents: number = totalOf(lines);
    return new Order(id, customerId, status, [...lines], totalCents, placedAt);
  }

  // Read-only access to the private status.
  get status(): OrderStatus {
    return this.#status;
  }

  confirm(): void {
    this.#transitionTo("CONFIRMED");
  }

  cancel(): void {
    this.#transitionTo("CANCELLED");
  }

  ship(): void {
    this.#transitionTo("SHIPPED");
  }

  // Returns the recorded events once, then forgets them.
  pullEvents(): readonly OrderEvent[] {
    const events = this.#events;
    this.#events = [];
    return events;
  }

  #transitionTo(next: OrderStatus): void {
    if (!allowedTransitions[this.#status].includes(next)) {
      throw new InvalidStatusTransitionError(this.#status, next);
    }
    this.#status = next;
  }
}
