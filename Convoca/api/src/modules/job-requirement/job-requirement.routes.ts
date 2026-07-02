import type { FastifyInstance } from "fastify";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { requireRoles } from "../../lib/rbac.js";
import {
  jobRequirementParamsSchema,
  jobRequirementItemParamsSchema,
  createJobRequirementBodySchema,
  jobRequirementResponseSchema,
} from "./job-requirement.schema.js";
import { createJobRequirement, listJobRequirements, deleteJobRequirement } from "./job-requirement.service.js";

const manageRoles = requireRoles(UserRole.TENANT_ADMIN, UserRole.RECRUITER);

export function jobRequirementRoutes(app: FastifyInstance): void {
  app.addHook("onRequest", app.authenticate);

  app.post(
    "/:jobId/requirements",
    {
      preHandler: manageRoles,
      schema: {
        params: jobRequirementParamsSchema,
        body: createJobRequirementBodySchema,
        response: { 201: jobRequirementResponseSchema },
      },
    },
    async (request, reply) => {
      const { jobId } = request.params as { jobId: string };
      const { text } = request.body as { text: string };
      const requirement = await createJobRequirement(request.tenantId as string, jobId, text);
      return reply.status(201).send(requirement);
    },
  );

  app.get(
    "/:jobId/requirements",
    {
      schema: {
        params: jobRequirementParamsSchema,
        response: { 200: z.array(jobRequirementResponseSchema) },
      },
    },
    async (request) => {
      const { jobId } = request.params as { jobId: string };
      return listJobRequirements(request.tenantId as string, jobId);
    },
  );

  app.delete(
    "/:jobId/requirements/:requirementId",
    {
      preHandler: manageRoles,
      schema: { params: jobRequirementItemParamsSchema },
    },
    async (request, reply) => {
      const { jobId, requirementId } = request.params as { jobId: string; requirementId: string };
      await deleteJobRequirement(request.tenantId as string, jobId, requirementId);
      return reply.status(204).send();
    },
  );
}
