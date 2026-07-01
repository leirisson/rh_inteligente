import type { FastifyInstance } from "fastify";
import { loginBodySchema, loginResponseSchema, refreshBodySchema, refreshResponseSchema } from "./auth.schema.js";
import { loginUser, refreshTokens } from "./auth.service.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/login",
    {
      schema: {
        body: loginBodySchema,
        response: { 200: loginResponseSchema },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as { email: string; password: string };
      const result = await loginUser(app, email, password);
      return reply.send(result);
    },
  );

  app.post(
    "/refresh",
    {
      schema: {
        body: refreshBodySchema,
        response: { 200: refreshResponseSchema },
      },
    },
    async (request, reply) => {
      const { refreshToken } = request.body as { refreshToken: string };
      const result = await refreshTokens(app, refreshToken);
      return reply.send(result);
    },
  );
}
