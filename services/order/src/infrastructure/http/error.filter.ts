import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Inject,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { ZodError } from "zod";
import { OrderNotFoundError } from "../../application/errors.js";
import { DomainError } from "../../domain/errors.js";

@Catch()
export class ErrorFilter implements ExceptionFilter {
  readonly #logger = new Logger(ErrorFilter.name);

  constructor(
    @Inject(HttpAdapterHost) private readonly adapterHost: HttpAdapterHost,
  ) {}

  catch(error: unknown, host: ArgumentsHost): void {
    const response: unknown = host.switchToHttp().getResponse();
    const [status, body] = this.#toHttp(error);
    this.adapterHost.httpAdapter.reply(response, body, status);
  }

  #toHttp(error: unknown): [number, unknown] {
    if (error instanceof ZodError) {
      return [400, { error: "ValidationError", issues: error.issues }];
    }
    if (error instanceof DomainError) {
      return [400, { error: error.name, message: error.message }];
    }

    if (error instanceof OrderNotFoundError) {
      return [404, { error: error.name, message: error.message }];
    }

    if (error instanceof HttpException) {
      return [error.getStatus(), error.getResponse()];
    }
    this.#logger.error(error);
    return [500, { error: "InternalServerError" }];
  }
}
