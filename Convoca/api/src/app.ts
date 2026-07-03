import Fastify, { FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { config } from "./config/index";
import { corsPlugin } from "./plugins/cors";
import { errorHandlerPlugin } from "./plugins/error-handler";
import { healthRoutes } from "./routes/health";
import { jwtPlugin } from "./plugins/jwt";
import { tenantScopePlugin } from "./plugins/tenant-scope";
import { authRoutes } from "./modules/auth/auth.routes";
import { tenantRoutes } from "./modules/tenant/tenant.routes";
import { jobRoutes } from "./modules/job/job.routes";
import { jobRequirementRoutes } from "./modules/job-requirement/job-requirement.routes";
import { screeningQuestionRoutes } from "./modules/screening-question/screening-question.routes";
import { candidateRoutes } from "./modules/candidate/candidate.routes";
import { matchingRoutes } from "./modules/matching/matching.routes";
import { applicationRoutes } from "./modules/application/application.routes";
import { funnelRoutes } from "./modules/application/funnel.routes";
import { interviewRoutes } from "./modules/interview/interview.routes";
import { whatsappWebhookRoutes } from "./modules/webhook/whatsapp.routes";

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
  await app.register(tenantRoutes, { prefix: "/tenants" });
  await app.register(jobRoutes, { prefix: "/jobs" });
  await app.register(jobRequirementRoutes, { prefix: "/jobs" });
  await app.register(screeningQuestionRoutes, { prefix: "/jobs" });
  await app.register(matchingRoutes, { prefix: "/jobs" });
  await app.register(funnelRoutes, { prefix: "/jobs" });
  await app.register(candidateRoutes, { prefix: "/candidates" });
  await app.register(applicationRoutes, { prefix: "/applications" });
  await app.register(interviewRoutes, { prefix: "/applications" });
  await app.register(whatsappWebhookRoutes, { prefix: "/webhooks/whatsapp" });

  return app;
}
