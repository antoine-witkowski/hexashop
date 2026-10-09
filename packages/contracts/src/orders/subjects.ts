export const ORDERS_STREAM = "ORDERS";

export function orderEventSubject(type: string, orderId: string): string {
  return `hexashop.orders.v1.${type}.${orderId}`;
}
