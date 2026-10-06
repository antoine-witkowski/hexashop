import { describe, expect, it } from "vitest";
import { Order } from "../domain/order.js";
import { OrderLine } from "../domain/order-line.js";
import { InMemoryOrderRepository } from "./in-memory-order-repository.js";

function anOrder(id: string): Order {
  return Order.place({
    id,
    customerId: "customer-1",
    lines: [
      OrderLine.create({ sku: "BOOK-1", quantity: 1, unitPriceCents: 1000 }),
    ],
    placedAt: new Date("2026-01-01T10:00:00Z"),
  });
}

describe("InMemoryOrderRepository", () => {
  it("finds a saved order", async () => {
    const repository = new InMemoryOrderRepository();
    const order = anOrder("order-1");

    await repository.save(order);

    await expect(repository.findById("order-1")).resolves.toBe(order);
  });

  it("returns undefined for an unknown id", async () => {
    const repository = new InMemoryOrderRepository();

    await expect(repository.findById("unknown")).resolves.toBeUndefined();
  });

  it("replaces an order saved twice with the same id", async () => {
    const repository = new InMemoryOrderRepository();
    const first = anOrder("order-1");
    const second = anOrder("order-1");

    await repository.save(first);
    await repository.save(second);

    await expect(repository.findById("order-1")).resolves.toBe(second);
  });
});
