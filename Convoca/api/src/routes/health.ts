import { FastifyInstance } from "fastify";
import { z } from "zod";

const healthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
  uptime: z.number(),
});

export function healthRoutes(app: FastifyInstance): void {
  app.get(
    "/",
    {
      schema: {
        response: { 200: healthResponseSchema },
      },
    },
    async (_request, _reply) => {
      return {
        status: "ok" as const,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    },
  );
}
