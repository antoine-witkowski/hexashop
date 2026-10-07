import type { Server } from "node:http";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { OrderResponse } from "./order-presenter.js";
import { OrderModule } from "./order.module.js";

describe("Orders API", () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await NestFactory.create(OrderModule, { logger: false });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const validOrder = {
    customerId: "customer-1",
    lines: [{ sku: "BOOK-1", quantity: 2, unitPriceCents: 1250 }],
  };

  it("POST /orders creates a pending order", async () => {
    const response = await request(app.getHttpServer())
      .post("/orders")
      .send(validOrder);

    expect(response.status).toBe(201);
    const order = response.body as OrderResponse;
    expect(order.status).toBe("PENDING");
    expect(order.totalCents).toBe(2500);
    expect(order.id).toEqual(expect.any(String));
  });

  it("GET /orders/:id returns 404 for an unknown order", async () => {
    const response = await request(app.getHttpServer()).get("/orders/unknown");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ error: "OrderNotFoundError" });
  });

  it("GET /orders/:id returns a created order", async () => {
    const created = await request(app.getHttpServer())
      .post("/orders")
      .send(validOrder);
    expect(created.status).toBe(201);
    const postedOrder = created.body as OrderResponse;

    const response = await request(app.getHttpServer()).get(
      "/orders/" + postedOrder.id,
    );
    expect(response.status).toBe(200);
    const order = response.body as OrderResponse;

    expect(postedOrder).toStrictEqual(order);
  });

  it("returns 400 when a business rule is violated", async () => {
    const created = await request(app.getHttpServer())
      .post("/orders")
      .send({
        customerId: "customer-1",
        lines: [{ sku: "BOOK-1", quantity: 0, unitPriceCents: 1250 }],
      });

    expect(created.status).toBe(400);
    expect(created.body).toMatchObject({ error: "InvalidQuantityError" });
  });

  it("returns 400 when the body is malformed", async () => {
    const created = await request(app.getHttpServer()).post("/orders").send({});

    expect(created.status).toBe(400);
    expect(created.body).toMatchObject({ error: "ValidationError" });
  });
});
