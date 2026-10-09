import { z } from "zod";
import { eventEnvelopeOf } from "../envelope.js";

export const OrderPlacedPayload = z.object({
  orderId: z.uuid(),
  customerId: z.string(),
  lines: z.array(
    z.object({
      sku: z.string(),
      quantity: z.number().int().positive(),
    }),
  ),
  totalCents: z.number().int().nonnegative(),
});

export const OrderPlaced = eventEnvelopeOf(
  "OrderPlaced",
  1,
  OrderPlacedPayload,
);

export type OrderPlaced = z.infer<typeof OrderPlaced>;
