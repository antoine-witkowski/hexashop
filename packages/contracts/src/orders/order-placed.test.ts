import { describe, expect, it } from "vitest";
import { OrderPlaced } from "./order-placed.js";

const validEvent = {
  eventId: "3b241101-e2bb-4255-8caf-4136c566a962",
  type: "OrderPlaced",
  version: 1,
  occurredAt: "2026-01-01T10:00:00.000Z",
  aggregateId: "9f1c2b7e-0c1a-4f5e-9d2a-6b7c8d9e0f12",
  payload: {
    orderId: "9f1c2b7e-0c1a-4f5e-9d2a-6b7c8d9e0f12",
    customerId: "customer-1",
    totalCents: 2500,
    lines: [{ sku: "BOOK-1", quantity: 2 }],
  },
};

describe("OrderPlaced contract", () => {
  it("accepts a valid event", () => {
    expect(OrderPlaced.parse(validEvent)).toEqual(validEvent);
  });

  it("rejects another event type", () => {
    expect(() =>
      OrderPlaced.parse({ ...validEvent, type: "OrderCancelled" }),
    ).toThrow();
  });

  it("rejects a payload without lines", () => {
    const payload = { ...validEvent.payload, lines: undefined };
    expect(() => OrderPlaced.parse({ ...validEvent, payload })).toThrow();
  });

  it("ignores unknown fields", () => {
    const parsed = OrderPlaced.parse({
      ...validEvent,
      payload: { ...validEvent.payload, coupon: "X" },
    });
    expect(parsed.payload).not.toHaveProperty("coupon");
  });
});
