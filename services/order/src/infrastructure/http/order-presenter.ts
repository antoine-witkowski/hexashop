import type { Order, OrderStatus } from "../../domain/order.js";

export interface OrderResponse {
  id: string;
  customerId: string;
  status: OrderStatus;
  totalCents: number;
  placedAt: string;
  lines: {
    sku: string;
    quantity: number;
    unitPriceCents: number;
    subtotalCents: number;
  }[];
}

export function toOrderResponse(order: Order): OrderResponse {
  return {
    id: order.id,
    customerId: order.customerId,
    status: order.status,
    totalCents: order.totalCents,
    placedAt: order.placedAt.toISOString(),
    lines: order.lines.map((line) => {
      return {
        sku: line.sku,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        subtotalCents: line.subtotalCents,
      };
    }),
  };
}
