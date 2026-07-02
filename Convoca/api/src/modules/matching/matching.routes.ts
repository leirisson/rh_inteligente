import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  jobMatchesParamsSchema,
  jobMatchesQuerySchema,
  jobMatchResponseSchema,
} from "./matching.schema.js";
import { getJobMatches } from "./matching.service.js";
import type { JobMatchesQuery } from "./matching.schema.js";

export function matchingRoutes(app: FastifyInstance): void {
  app.addHook("onRequest", app.authenticate);

  app.get(
    "/:jobId/matches",
    {
      schema: {
        params: jobMatchesParamsSchema,
        querystring: jobMatchesQuerySchema,
        response: { 200: z.array(jobMatchResponseSchema) },
      },
    },
    async (request) => {
      const { jobId } = request.params as { jobId: string };
      const { threshold } = request.query as JobMatchesQuery;
      return getJobMatches(request.tenantId as string, jobId, threshold);
    },
  );
}
