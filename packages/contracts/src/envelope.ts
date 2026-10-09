import { z } from "zod";

export const EventEnvelope = z.object({
  eventId: z.uuid(),
  type: z.string(),
  version: z.number().int().positive(),
  occurredAt: z.iso.datetime(),
  aggregateId: z.string(),
  payload: z.unknown(),
});

export type EventEnvelope = z.infer<typeof EventEnvelope>;

export function eventEnvelopeOf<
  const Type extends string,
  const Version extends number,
  Payload extends z.ZodType,
>(type: Type, version: Version, payload: Payload) {
  return EventEnvelope.extend({
    type: z.literal(type),
    version: z.literal(version),
    payload,
  });
}
