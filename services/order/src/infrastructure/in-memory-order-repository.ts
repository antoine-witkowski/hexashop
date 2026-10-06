import type { OrderRepository } from "../application/ports/order-repository.js";
import type { Order } from "../domain/order.js";

export class InMemoryOrderRepository implements OrderRepository {
  readonly #orders = new Map<string, Order>();

  save(order: Order): Promise<void> {
    this.#orders.set(order.id, order);
    return Promise.resolve();
  }

  findById(id: string): Promise<Order | undefined> {
    return Promise.resolve(this.#orders.get(id));
  }
}
