import Fastify, { FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { config } from "./config/index";
import { corsPlugin } from "./plugins/cors";
import { errorHandlerPlugin } from "./plugins/error-handler";
import { healthRoutes } from "./routes/health";
import { jwtPlugin } from "./plugins/jwt";
import { tenantScopePlugin } from "./plugins/tenant-scope";
import { authRoutes } from "./modules/auth/auth.routes";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug",
      transport:
        config.NODE_ENV !== "production"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
    genReqId: () => crypto.randomUUID(),
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(corsPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(jwtPlugin);
  await app.register(tenantScopePlugin);

  await app.register(healthRoutes, { prefix: "/health" });
  await app.register(authRoutes, { prefix: "/auth" });

  return app;
}
