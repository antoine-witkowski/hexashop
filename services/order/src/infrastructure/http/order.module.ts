import { Module, type DynamicModule } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { GetOrder } from "../../application/get-order.js";
import { PlaceOrder } from "../../application/place-order.js";
import type { Clock } from "../../application/ports/clock.js";
import type { EventPublisher } from "../../application/ports/event-publisher.js";
import type { IdGenerator } from "../../application/ports/id-generator.js";
import type { OrderRepository } from "../../application/ports/order-repository.js";
import { RandomIdGenerator } from "../random-id-generator.js";
import { SystemClock } from "../system-clock.js";
import { ErrorFilter } from "./error.filter.js";
import { OrderController } from "./order.controller.js";

const ORDER_REPOSITORY = Symbol("OrderRepository");
const CLOCK = Symbol("Clock");
const ID_GENERATOR = Symbol("IdGenerator");
const EVENT_PUBLISHER = Symbol("EventPublisher");

export interface OrderModuleOptions {
  orderRepository: OrderRepository;
  eventPublisher: EventPublisher;
}

@Module({})
export class OrderModule {
  static register(options: OrderModuleOptions): DynamicModule {
    return {
      module: OrderModule,
      controllers: [OrderController],
      providers: [
        { provide: ORDER_REPOSITORY, useValue: options.orderRepository },
        { provide: CLOCK, useClass: SystemClock },
        { provide: ID_GENERATOR, useClass: RandomIdGenerator },
        { provide: EVENT_PUBLISHER, useValue: options.eventPublisher },
        {
          provide: PlaceOrder,
          inject: [ORDER_REPOSITORY, CLOCK, ID_GENERATOR, EVENT_PUBLISHER],
          useFactory: (
            orders: OrderRepository,
            clock: Clock,
            ids: IdGenerator,
            events: EventPublisher,
          ) => new PlaceOrder(orders, clock, ids, events),
        },
        {
          provide: GetOrder,
          inject: [ORDER_REPOSITORY],
          useFactory: (orders: OrderRepository) => new GetOrder(orders),
        },
        { provide: APP_FILTER, useClass: ErrorFilter },
      ],
    };
  }
}
