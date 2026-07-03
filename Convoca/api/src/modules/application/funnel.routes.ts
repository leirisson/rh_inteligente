import type { FastifyInstance } from "fastify";
import { funnelParamsSchema, funnelResponseSchema } from "./application.schema.js";
import { getApplicationFunnel } from "./funnel.service.js";

export function funnelRoutes(app: FastifyInstance): void {
  app.addHook("onRequest", app.authenticate);

  app.get(
    "/:jobId/funnel",
    {
      schema: {
        params: funnelParamsSchema,
        response: { 200: funnelResponseSchema },
      },
    },
    async (request) => {
      const { jobId } = request.params as { jobId: string };
      return getApplicationFunnel(request.tenantId as string, jobId);
    },
  );
}
