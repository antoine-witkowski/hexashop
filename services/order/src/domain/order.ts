import { EmptyOrderError, InvalidStatusTransitionError } from "./errors.js";
import type { OrderEvent } from "./events.js";
import type { OrderLine } from "./order-line.js";

export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "SHIPPED";

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
  #status: OrderStatus;
  #events: OrderEvent[] = [];

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

  pullEvents(): readonly OrderEvent[] {
    const events = this.#events;
    this.#events = [];
    return events;
  }

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

  confirm(): void {
    this.#transitionTo("CONFIRMED");
  }

  cancel(): void {
    this.#transitionTo("CANCELLED");
  }

  ship(): void {
    this.#transitionTo("SHIPPED");
  }

  get status(): OrderStatus {
    return this.#status;
  }

  #transitionTo(next: OrderStatus): void {
    if (!allowedTransitions[this.#status].includes(next)) {
      throw new InvalidStatusTransitionError(this.#status, next);
    }
    this.#status = next;
  }

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
}
