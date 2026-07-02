import type { FastifyInstance } from "fastify";
import { UserRole, JobStatus } from "@prisma/client";
import { requireRoles } from "../../lib/rbac.js";
import {
  jobParamsSchema,
  createJobBodySchema,
  updateJobBodySchema,
  updateJobStatusBodySchema,
  listJobsQuerySchema,
  jobResponseSchema,
  listJobsResponseSchema,
} from "./job.schema.js";
import { createJob, listJobs, getJob, updateJob, updateJobStatus, deleteJob } from "./job.service.js";

const manageRoles = requireRoles(UserRole.TENANT_ADMIN, UserRole.RECRUITER);

export function jobRoutes(app: FastifyInstance): void {
  app.addHook("onRequest", app.authenticate);

  app.post(
    "/",
    {
      preHandler: manageRoles,
      schema: { body: createJobBodySchema, response: { 201: jobResponseSchema } },
    },
    async (request, reply) => {
      const { title, description } = request.body as { title: string; description: string };
      const job = await createJob(request.tenantId as string, title, description);
      return reply.status(201).send(job);
    },
  );

  app.get(
    "/",
    {
      schema: { querystring: listJobsQuerySchema, response: { 200: listJobsResponseSchema } },
    },
    async (request) => {
      const { page, pageSize } = request.query as { page: number; pageSize: number };
      return listJobs(request.tenantId as string, page, pageSize);
    },
  );

  app.get(
    "/:id",
    {
      schema: { params: jobParamsSchema, response: { 200: jobResponseSchema } },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      return getJob(request.tenantId as string, id);
    },
  );

  app.patch(
    "/:id",
    {
      preHandler: manageRoles,
      schema: { params: jobParamsSchema, body: updateJobBodySchema, response: { 200: jobResponseSchema } },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { title?: string; description?: string };
      return updateJob(request.tenantId as string, id, body);
    },
  );

  app.patch(
    "/:id/status",
    {
      preHandler: manageRoles,
      schema: {
        params: jobParamsSchema,
        body: updateJobStatusBodySchema,
        response: { 200: jobResponseSchema },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: JobStatus };
      return updateJobStatus(request.tenantId as string, id, status);
    },
  );

  app.delete(
    "/:id",
    {
      preHandler: manageRoles,
      schema: { params: jobParamsSchema },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await deleteJob(request.tenantId as string, id);
      return reply.status(204).send();
    },
  );
}
