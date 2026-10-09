import type { OrderRepository } from "../../application/ports/order-repository.js";
import { Order } from "../../domain/order.js";
import { OrderLine } from "../../domain/order-line.js";
import type { PrismaClient } from "./generated/client.js";

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(order: Order): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.order.upsert({
        where: { id: order.id },
        create: {
          id: order.id,
          customerId: order.customerId,
          status: order.status,
          placedAt: order.placedAt,
          lines: {
            create: order.lines.map((line, index) => {
              return {
                position: index,
                sku: line.sku,
                quantity: line.quantity,
                unitPriceCents: line.unitPriceCents,
              };
            }),
          },
        },
        update: { status: order.status },
      });
    });
  }

  async findById(id: string): Promise<Order | undefined> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: { lines: { orderBy: { position: "asc" } } },
    });
    if (row === null) {
      return undefined;
    }
    return Order.reconstitute({
      id: row.id,
      customerId: row.customerId,
      status: row.status,
      placedAt: row.placedAt,
      lines: row.lines.map((line) => {
        return OrderLine.create({
          sku: line.sku,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
        });
      }),
    });
  }
}
