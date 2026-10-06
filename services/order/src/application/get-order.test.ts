import { describe, expect, it } from "vitest";
import { Order } from "../domain/order.js";
import { OrderLine } from "../domain/order-line.js";
import { OrderNotFoundError } from "./errors.js";
import { GetOrder } from "./get-order.js";
import { FakeOrderRepository } from "./testing/fakes.js";

describe("GetOrder", () => {
  it("returns an existing order", async () => {
    const orders = new FakeOrderRepository();
    const order = Order.place({
      id: "order-1",
      customerId: "customer-1",
      lines: [
        OrderLine.create({ sku: "BOOK-1", quantity: 1, unitPriceCents: 1000 }),
      ],
      placedAt: new Date("2026-01-01T10:00:00Z"),
    });
    await orders.save(order);

    await expect(new GetOrder(orders).execute("order-1")).resolves.toBe(order);
  });

  it("throws OrderNotFoundError for an unknown id", async () => {
    const getOrder = new GetOrder(new FakeOrderRepository());

    await expect(getOrder.execute("unknown")).rejects.toThrow(
      OrderNotFoundError,
    );
  });
});
