import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { PlaceOrder } from "../../application/place-order.js";
import type { Clock } from "../../application/ports/clock.js";
import type { IdGenerator } from "../../application/ports/id-generator.js";
import type { OrderRepository } from "../../application/ports/order-repository.js";
import { InMemoryOrderRepository } from "../in-memory-order-repository.js";
import { RandomIdGenerator } from "../random-id-generator.js";
import { SystemClock } from "../system-clock.js";
import { ErrorFilter } from "./error.filter.js";
import { OrderController } from "./order.controller.js";
import { GetOrder } from "../../application/get-order.js";

const ORDER_REPOSITORY = Symbol("OrderRepository");
const CLOCK = Symbol("Clock");
const ID_GENERATOR = Symbol("IdGenerator");

@Module({
  controllers: [OrderController],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: InMemoryOrderRepository },
    { provide: CLOCK, useClass: SystemClock },
    { provide: ID_GENERATOR, useClass: RandomIdGenerator },
    {
      provide: PlaceOrder,
      inject: [ORDER_REPOSITORY, CLOCK, ID_GENERATOR],
      useFactory: (orders: OrderRepository, clock: Clock, ids: IdGenerator) =>
        new PlaceOrder(orders, clock, ids),
    },
    {
      provide: GetOrder,
      inject: [ORDER_REPOSITORY],
      useFactory: (orders: OrderRepository) => new GetOrder(orders),
    },
    { provide: APP_FILTER, useClass: ErrorFilter },
  ],
})
export class OrderModule {}
