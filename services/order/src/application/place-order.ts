import { Order } from "../domain/order.js";
import { OrderLine } from "../domain/order-line.js";
import type { Clock } from "./ports/clock.js";
import type { IdGenerator } from "./ports/id-generator.js";
import type { OrderRepository } from "./ports/order-repository.js";

export interface PlaceOrderCommand {
  customerId: string;
  lines: readonly { sku: string; quantity: number; unitPriceCents: number }[];
}

export class PlaceOrder {
  constructor(
    private readonly orders: OrderRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<Order> {
    const orderLines = command.lines.map((line) => OrderLine.create(line));
    const order = Order.place({
      id: this.ids.generate(),
      customerId: command.customerId,
      lines: orderLines,
      placedAt: this.clock.now(),
    });
    await this.orders.save(order);
    return order;
  }
}
