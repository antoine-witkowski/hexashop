import { InvalidQuantityError } from "./errors.js";

export class OrderLine {
  private constructor(
    readonly sku: string,
    readonly quantity: number,
    readonly unitPriceCents: number,
  ) {}

  static create(props: {
    sku: string;
    quantity: number;
    unitPriceCents: number;
  }): OrderLine {
    const { sku, quantity, unitPriceCents } = props;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidQuantityError(quantity);
    }
    return new OrderLine(sku, quantity, unitPriceCents);
  }

  get subtotalCents(): number {
    return this.quantity * this.unitPriceCents;
  }
}
