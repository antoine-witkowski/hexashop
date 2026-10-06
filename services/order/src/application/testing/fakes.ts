import type { Order } from "../../domain/order.js";
import type { Clock } from "../ports/clock.js";
import type { IdGenerator } from "../ports/id-generator.js";
import type { OrderRepository } from "../ports/order-repository.js";

export class FakeOrderRepository implements OrderRepository {
  readonly orders = new Map<string, Order>();

  save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
    return Promise.resolve();
  }

  findById(id: string): Promise<Order | undefined> {
    return Promise.resolve(this.orders.get(id));
  }
}

export class FixedClock implements Clock {
  constructor(private readonly date: Date) {}

  now(): Date {
    return this.date;
  }
}

export class FixedIdGenerator implements IdGenerator {
  constructor(private readonly id: string) {}

  generate(): string {
    return this.id;
  }
}
