import { describe, expect, it } from "vitest";
import { EmptyOrderError, InvalidStatusTransitionError } from "./errors.js";
import { Order } from "./order.js";
import { OrderLine } from "./order-line.js";

const placedAt = new Date("2026-01-01T10:00:00Z");

function line(quantity: number, unitPriceCents: number): OrderLine {
  return OrderLine.create({ sku: "SKU-1", quantity, unitPriceCents });
}

function placeOrder(lines: OrderLine[] = [line(2, 1000), line(1, 500)]): Order {
  return Order.place({
    id: "order-1",
    customerId: "customer-1",
    lines,
    placedAt,
  });
}

describe("Order.place", () => {
  it("creates a pending order with its total", () => {
    const order = placeOrder();

    expect(order.id).toBe("order-1");
    expect(order.customerId).toBe("customer-1");
    expect(order.status).toBe("PENDING");
    expect(order.totalCents).toBe(2500);
    expect(order.placedAt).toEqual(placedAt);
  });

  it("rejects an order without lines", () => {
    expect(() => placeOrder([])).toThrow(EmptyOrderError);
  });
});

describe("Order status transitions", () => {
  it("confirms a pending order", () => {
    const order = placeOrder();
    order.confirm();
    expect(order.status).toBe("CONFIRMED");
  });

  it("cancels a pending order", () => {
    const order = placeOrder();
    order.cancel();
    expect(order.status).toBe("CANCELLED");
  });

  it.each([
    ["confirm", "confirm"],
    ["confirm", "cancel"],
    ["cancel", "confirm"],
    ["cancel", "cancel"],
  ] as const)("forbids %s then %s", (first, second) => {
    const order = placeOrder();
    order[first]();
    expect(() => {
      order[second]();
    }).toThrow(InvalidStatusTransitionError);
  });

  it("ships a confirmed order", () => {
    const order = placeOrder();
    order.confirm();
    order.ship();
    expect(order.status).toBe("SHIPPED");
  });

  it("forbids shipping a pending order", () => {
    const order = placeOrder();
    expect(() => {
      order.ship();
    }).toThrow(InvalidStatusTransitionError);
  });

  it.each([
    [["cancel"], "ship"],
    [["confirm", "ship"], "confirm"],
    [["confirm", "ship"], "cancel"],
    [["confirm", "ship"], "ship"],
  ] as const)("after %j, forbids %s", (history, action) => {
    const order = placeOrder();
    for (const step of history) {
      order[step]();
    }
    expect(() => {
      order[action]();
    }).toThrow(InvalidStatusTransitionError);
  });
});
