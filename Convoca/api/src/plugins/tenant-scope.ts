import type { FastifyInstance, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    tenantId: string | null;
  }
}


export async function tenantScopePlugin(app: FastifyInstance) {
  // Injects tenantId from the JWT payload into every request after authentication.
  // Business services must read from request.tenantId — never from request.user directly —
  // so that isolation is enforced by this middleware, not by discipline.
  app.decorateRequest("tenantId", null);

  app.addHook("onRequest", async (request: FastifyRequest) => {
    if (request.user) {
      request.tenantId = request.user.tenant_id;
    }
  });
}
