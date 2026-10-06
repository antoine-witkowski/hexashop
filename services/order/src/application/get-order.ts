import type { Order } from "../domain/order.js";
import { OrderNotFoundError } from "./errors.js";
import type { OrderRepository } from "./ports/order-repository.js";

export class GetOrder {
  constructor(private readonly orders: OrderRepository) {}

  async execute(id: string): Promise<Order> {
    const order = await this.orders.findById(id);
    if (order === undefined) {
      throw new OrderNotFoundError(id);
    }
    return order;
  }
}
