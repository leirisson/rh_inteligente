import type { FastifyInstance } from "fastify";
import { UserRole } from "@prisma/client";
import { requireRoles } from "../../lib/rbac.js";
import {
  tenantIntegrationParamsSchema,
  connectWhatsAppResponseSchema,
  whatsAppStatusResponseSchema,
  disconnectWhatsAppResponseSchema,
} from "./tenant-integration.schema.js";
import {
  connectWhatsApp,
  getWhatsAppStatus,
  disconnectWhatsApp,
  assertTenantMatch,
} from "./tenant-integration.service.js";

const manageIntegration = requireRoles(UserRole.TENANT_ADMIN);

export function tenantIntegrationRoutes(app: FastifyInstance): void {
  app.addHook("onRequest", app.authenticate);

  app.post(
    "/:id/integrations/whatsapp/connect",
    {
      preHandler: manageIntegration,
      schema: { params: tenantIntegrationParamsSchema, response: { 200: connectWhatsAppResponseSchema } },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      await assertTenantMatch(id, request.tenantId);
      return connectWhatsApp(id);
    },
  );

  app.get(
    "/:id/integrations/whatsapp/status",
    {
      schema: { params: tenantIntegrationParamsSchema, response: { 200: whatsAppStatusResponseSchema } },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      await assertTenantMatch(id, request.tenantId);
      return getWhatsAppStatus(id);
    },
  );

  app.post(
    "/:id/integrations/whatsapp/disconnect",
    {
      preHandler: manageIntegration,
      schema: { params: tenantIntegrationParamsSchema, response: { 200: disconnectWhatsAppResponseSchema } },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      await assertTenantMatch(id, request.tenantId);
      return disconnectWhatsApp(id);
    },
  );
}
