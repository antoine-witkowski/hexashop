import { NestFactory } from "@nestjs/core";
import { OrderModule } from "./infrastructure/http/order.module.js";

const port = Number(process.env.PORT) || 3000;

const app = await NestFactory.create(OrderModule);

app.enableShutdownHooks();

await app.listen(port);
