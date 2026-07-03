import type { FastifyInstance } from "fastify";
import { UserRole } from "@prisma/client";
import { requireRoles } from "../../lib/rbac.js";
import { updateUserBodySchema, userResponseSchema } from "./user.schema.js";
import type { UpdateUserBody } from "./user.schema.js";
import { getUser, updateUser } from "./user.service.js";

const anyCompanyRole = requireRoles(
  UserRole.SUPER_ADMIN,
  UserRole.TENANT_ADMIN,
  UserRole.RECRUITER,
  UserRole.DEPARTMENT_LEAD,
);

export function userRoutes(app: FastifyInstance): void {
  app.addHook("onRequest", app.authenticate);
  app.addHook("preHandler", anyCompanyRole);

  app.get("/me", { schema: { response: { 200: userResponseSchema } } }, async (request) => {
    const userId = (request.user as { user_id: string }).user_id;
    return getUser(userId);
  });

  app.patch(
    "/me",
    { schema: { body: updateUserBodySchema, response: { 200: userResponseSchema } } },
    async (request) => {
      const userId = (request.user as { user_id: string }).user_id;
      const body = request.body as UpdateUserBody;
      return updateUser(userId, body);
    },
  );
}
