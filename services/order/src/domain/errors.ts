export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class EmptyOrderError extends DomainError {
  constructor() {
    super("An order must contain at least one line");
  }
}

export class InvalidQuantityError extends DomainError {
  constructor(quantity: number) {
    super("Quantity must be a positive integer, got " + String(quantity));
  }
}

export class InvalidStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super("Cannot transition order from " + from + " to " + to);
  }
}
