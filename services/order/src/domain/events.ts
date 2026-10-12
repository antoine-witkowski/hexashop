export interface OrderPlacedEvent {
  readonly type: "OrderPlaced";
  readonly orderId: string;
  readonly customerId: string;
  readonly lines: readonly {
    readonly sku: string;
    readonly quantity: number;
  }[];
  readonly totalCents: number;
  readonly occurredAt: Date;
}

export type OrderEvent = OrderPlacedEvent;
