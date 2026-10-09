import { NestFactory } from "@nestjs/core";
import { loadConfig } from "./infrastructure/config.js";
import { OrderModule } from "./infrastructure/http/order.module.js";

const config = loadConfig(process.env);

const app = await NestFactory.create(OrderModule);

app.enableShutdownHooks();

await app.listen(config.PORT);
