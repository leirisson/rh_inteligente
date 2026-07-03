import type { FastifyInstance } from "fastify";
import { UserRole } from "@prisma/client";
import { requireRoles } from "../../lib/rbac.js";
import {
  interviewParamsSchema,
  scheduleInterviewBodySchema,
  rescheduleInterviewBodySchema,
  interviewResponseSchema,
} from "./interview.schema.js";
import type { ScheduleInterviewBody, RescheduleInterviewBody } from "./interview.schema.js";
import { scheduleInterview, rescheduleInterview, cancelInterview } from "./interview.service.js";

const manageRoles = requireRoles(
  UserRole.TENANT_ADMIN,
  UserRole.RECRUITER,
  UserRole.DEPARTMENT_LEAD,
);

export function interviewRoutes(app: FastifyInstance): void {
  app.addHook("onRequest", app.authenticate);

  app.post(
    "/:id/interviews",
    {
      preHandler: manageRoles,
      schema: {
        params: interviewParamsSchema,
        body: scheduleInterviewBodySchema,
        response: { 201: interviewResponseSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as ScheduleInterviewBody;
      const interview = await scheduleInterview(request.tenantId as string, id, body);
      return reply.status(201).send(interview);
    },
  );

  app.patch(
    "/:id/interviews/reschedule",
    {
      preHandler: manageRoles,
      schema: {
        params: interviewParamsSchema,
        body: rescheduleInterviewBodySchema,
        response: { 200: interviewResponseSchema },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as RescheduleInterviewBody;
      return rescheduleInterview(request.tenantId as string, id, body);
    },
  );

  app.patch(
    "/:id/interviews/cancel",
    {
      preHandler: manageRoles,
      schema: {
        params: interviewParamsSchema,
        response: { 200: interviewResponseSchema },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      return cancelInterview(request.tenantId as string, id);
    },
  );
}
