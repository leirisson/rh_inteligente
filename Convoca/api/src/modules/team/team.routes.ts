import type { FastifyInstance } from "fastify";
import { UserRole } from "@prisma/client";
import { requireRoles } from "../../lib/rbac.js";
import { assertTenantMatch } from "../tenant/tenant-integration.service.js";
import {
  teamTenantParamsSchema,
  teamMemberParamsSchema,
  listTeamResponseSchema,
  createTeamMemberBodySchema,
  teamMemberSchema,
  updateTeamMemberRoleBodySchema,
} from "./team.schema.js";
import type { CreateTeamMemberBody, UpdateTeamMemberRoleBody } from "./team.schema.js";
import { listTeamMembers, createTeamMember, updateTeamMemberRole } from "./team.service.js";

const manageTeam = requireRoles(UserRole.TENANT_ADMIN);

export function teamRoutes(app: FastifyInstance): void {
  app.addHook("onRequest", app.authenticate);
  app.addHook("preHandler", manageTeam);

  app.get(
    "/:id/users",
    { schema: { params: teamTenantParamsSchema, response: { 200: listTeamResponseSchema } } },
    async (request) => {
      const { id } = request.params as { id: string };
      await assertTenantMatch(id, request.tenantId);
      return listTeamMembers(id);
    },
  );

  app.post(
    "/:id/users",
    {
      schema: {
        params: teamTenantParamsSchema,
        body: createTeamMemberBodySchema,
        response: { 201: teamMemberSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await assertTenantMatch(id, request.tenantId);
      const body = request.body as CreateTeamMemberBody;
      const member = await createTeamMember(id, body);
      return reply.status(201).send(member);
    },
  );

  app.patch(
    "/:id/users/:userId/role",
    {
      schema: {
        params: teamMemberParamsSchema,
        body: updateTeamMemberRoleBodySchema,
        response: { 200: teamMemberSchema },
      },
    },
    async (request) => {
      const { id, userId } = request.params as { id: string; userId: string };
      await assertTenantMatch(id, request.tenantId);
      const { role } = request.body as UpdateTeamMemberRoleBody;
      return updateTeamMemberRole(id, userId, role);
    },
  );
}
