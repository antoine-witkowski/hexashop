import { describe, expect, it } from "vitest";
import { InvalidQuantityError } from "./errors.js";
import { OrderLine } from "./order-line.js";

describe("OrderLine", () => {
  it("computes its subtotal", () => {
    const line = OrderLine.create({
      sku: "BOOK-1",
      quantity: 3,
      unitPriceCents: 1250,
    });
    expect(line.subtotalCents).toBe(3750);
  });

  it.each([0, -1, 1.5])("rejects quantity %s", (quantity) => {
    expect(() =>
      OrderLine.create({ sku: "BOOK-1", quantity, unitPriceCents: 1250 }),
    ).toThrow(InvalidQuantityError);
  });
});
