import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";
import { config } from "../config/index";

export function errorHandlerPlugin(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const isProduction = config.NODE_ENV === "production";

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (hasZodFastifySchemaValidationErrors(error)) {
      void reply.status(400).send({
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: isProduction ? undefined : error.validation,
        },
      });
      return;
    }

    if (error.statusCode) {
      void reply.status(error.statusCode).send({
        error: {
          message: error.message,
          code: error.code ?? `HTTP_${error.statusCode}`,
        },
      });
      return;
    }

    request.log.error({ err: error }, "Unhandled error");

    void reply.status(500).send({
      error: {
        message: isProduction ? "Internal server error" : error.message,
        code: "INTERNAL_ERROR",
      },
    });
  });

  app.setNotFoundHandler((request, reply) => {
    void reply.status(404).send({
      error: {
        message: `Route ${request.method} ${request.url} not found`,
        code: "NOT_FOUND",
      },
    });
  });
}
