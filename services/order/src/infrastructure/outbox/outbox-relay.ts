import type { JetStreamClient } from "@nats-io/jetstream";
import type { PrismaClient } from "../persistence/generated/client.js";

interface OutboxRow {
  id: string;
  subject: string;
  payload: unknown;
}

export class OutboxRelay {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly js: JetStreamClient,
    private readonly batchSize = 100,
  ) {}

  async publishBatch(): Promise<number> {
    return this.prisma.$transaction(
      async (tx) => {
        const rows = await tx.$queryRaw<OutboxRow[]>`
          SELECT id, subject, payload FROM outbox
          WHERE published_at IS NULL
          ORDER BY created_at
          LIMIT ${this.batchSize}
          FOR UPDATE SKIP LOCKED`;

        if (rows.length === 0) return 0;

        for (const row of rows) {
          await this.js.publish(row.subject, JSON.stringify(row.payload), {
            msgID: row.id,
          });
        }

        await tx.outboxMessage.updateMany({
          where: {
            id: { in: rows.map((row) => row.id) },
          },
          data: { publishedAt: new Date() },
        });

        return rows.length;
      },
      { timeout: 30_000 },
    );
  }

  async deletePublishedBefore(cutoff: Date): Promise<number> {
    const { count } = await this.prisma.outboxMessage.deleteMany({
      where: { publishedAt: { lt: cutoff } },
    });

    return count;
  }
}
