import { describe, expect, it } from "vitest";
import { EmptyOrderError } from "../domain/errors.js";
import { PlaceOrder } from "./place-order.js";
import {
  FakeEventPublisher,
  FakeOrderRepository,
  FixedClock,
  FixedIdGenerator,
} from "./testing/fakes.js";

const placedAt = new Date("2026-01-01T10:00:00Z");

function setup() {
  const orders = new FakeOrderRepository();
  const events = new FakeEventPublisher();
  const placeOrder = new PlaceOrder(
    orders,
    new FixedClock(placedAt),
    new FixedIdGenerator("order-1"),
    events,
  );
  return { orders, events, placeOrder };
}

describe("PlaceOrder", () => {
  it("places a pending order and saves it", async () => {
    const { orders, placeOrder } = setup();

    const order = await placeOrder.execute({
      customerId: "customer-1",
      lines: [{ sku: "BOOK-1", quantity: 2, unitPriceCents: 1250 }],
    });

    expect(order.id).toBe("order-1");
    expect(order.status).toBe("PENDING");
    expect(order.totalCents).toBe(2500);
    expect(order.placedAt).toEqual(placedAt);
    expect(orders.orders.get("order-1")).toBe(order);
  });

  it("does not save an invalid order", async () => {
    const { orders, placeOrder } = setup();

    await expect(
      placeOrder.execute({ customerId: "customer-1", lines: [] }),
    ).rejects.toThrow(EmptyOrderError);
    expect(orders.orders.size).toBe(0);
  });

  it("publishes an OrderPlaced event after saving", async () => {
    const { events, placeOrder } = setup();
    await placeOrder.execute({
      customerId: "customer-1",
      lines: [{ sku: "BOOK-1", quantity: 2, unitPriceCents: 1250 }],
    });

    expect(events.published).toEqual([
      expect.objectContaining({ type: "OrderPlaced", orderId: "order-1" }),
    ]);
  });

  it("does not publish anything for an invalid order", async () => {
    const { events, placeOrder } = setup();

    await expect(
      placeOrder.execute({
        customerId: "customer-1",
        lines: [],
      }),
    ).rejects.toThrow(EmptyOrderError);

    expect(events.published).toEqual([]);
  });
});
