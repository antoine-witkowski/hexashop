import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { GetOrder } from "../../application/get-order.js";
import { PlaceOrder } from "../../application/place-order.js";
import { type OrderResponse, toOrderResponse } from "./order-presenter.js";
import { ZodValidationPipe } from "./zod-validation.pipe.js";

const placeOrderBody = z.object({
  customerId: z.string().min(1),
  lines: z.array(
    z.object({
      sku: z.string().min(1),
      quantity: z.number(),
      unitPriceCents: z.number(),
    }),
  ),
});

type PlaceOrderBody = z.infer<typeof placeOrderBody>;

@Controller("orders")
export class OrderController {
  constructor(
    @Inject(PlaceOrder) private readonly placeOrder: PlaceOrder,
    @Inject(GetOrder) private readonly getOrder: GetOrder,
  ) {}

  @Post()
  async place(
    @Body(new ZodValidationPipe(placeOrderBody)) body: PlaceOrderBody,
  ): Promise<OrderResponse> {
    const order = await this.placeOrder.execute(body);
    return toOrderResponse(order);
  }

  @Get(":id")
  async get(@Param("id") id: string): Promise<OrderResponse> {
    const order = await this.getOrder.execute(id);
    return toOrderResponse(order);
  }
}
