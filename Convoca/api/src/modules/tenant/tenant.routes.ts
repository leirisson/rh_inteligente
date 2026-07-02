import type { FastifyInstance } from "fastify";
import { onboardTenantBodySchema, onboardTenantResponseSchema } from "./tenant.schema.js";
import { onboardTenant } from "./tenant.service.js";

export function tenantRoutes(app: FastifyInstance): void {
  app.post(
    "/",
    {
      schema: {
        body: onboardTenantBodySchema,
        response: { 201: onboardTenantResponseSchema },
      },
    },
    async (request, reply) => {
      const { tenantName, adminEmail, adminName, adminPassword } = request.body as {
        tenantName: string;
        adminEmail: string;
        adminName: string;
        adminPassword: string;
      };
      const result = await onboardTenant(app, tenantName, adminEmail, adminName, adminPassword);
      return reply.status(201).send(result);
    },
  );
}
