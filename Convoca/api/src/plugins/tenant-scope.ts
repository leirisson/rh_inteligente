import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    tenantId: string | null;
  }
}

export const tenantScopePlugin = fp(async function tenantScopePlugin(app: FastifyInstance) {
  // Injects tenantId from the JWT payload into every request after authentication.
  // Business services must read from request.tenantId — never from request.user directly —
  // so that isolation is enforced by this middleware, not by discipline.
  app.decorateRequest("tenantId", null);

  // preHandler runs after each route's own onRequest hooks (e.g. app.authenticate),
  // so request.user is already populated by the time this reads it.
  app.addHook("preHandler", async (request: FastifyRequest) => {
    if (request.user && request.user.type === "company") {
      request.tenantId = request.user.tenant_id;
    }
  });
});
