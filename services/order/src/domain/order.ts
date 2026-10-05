import { EmptyOrderError, InvalidStatusTransitionError } from "./errors.js";
import type { OrderLine } from "./order-line.js";

export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "SHIPPED";

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED"],
  CANCELLED: [],
  SHIPPED: [],
};

export class Order {
  #status: OrderStatus;

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

    let totalCents: number = 0;
    lines.forEach((line) => {
      totalCents += line.subtotalCents;
    });

    return new Order(id, customerId, status, [...lines], totalCents, placedAt);
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
}
