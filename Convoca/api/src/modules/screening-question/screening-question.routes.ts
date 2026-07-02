import type { FastifyInstance } from "fastify";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { requireRoles } from "../../lib/rbac.js";
import {
  screeningQuestionParamsSchema,
  screeningQuestionItemParamsSchema,
  createScreeningQuestionBodySchema,
  updateScreeningQuestionBodySchema,
  screeningQuestionResponseSchema,
} from "./screening-question.schema.js";
import {
  createScreeningQuestion,
  listScreeningQuestions,
  updateScreeningQuestion,
  deleteScreeningQuestion,
} from "./screening-question.service.js";
import type { CreateScreeningQuestionBody, UpdateScreeningQuestionBody } from "./screening-question.schema.js";

const manageRoles = requireRoles(UserRole.TENANT_ADMIN, UserRole.RECRUITER);

export function screeningQuestionRoutes(app: FastifyInstance): void {
  app.addHook("onRequest", app.authenticate);

  app.post(
    "/:jobId/screening-questions",
    {
      preHandler: manageRoles,
      schema: {
        params: screeningQuestionParamsSchema,
        body: createScreeningQuestionBodySchema,
        response: { 201: screeningQuestionResponseSchema },
      },
    },
    async (request, reply) => {
      const { jobId } = request.params as { jobId: string };
      const body = request.body as CreateScreeningQuestionBody;
      const question = await createScreeningQuestion(request.tenantId as string, jobId, body);
      return reply.status(201).send(question);
    },
  );

  app.get(
    "/:jobId/screening-questions",
    {
      schema: {
        params: screeningQuestionParamsSchema,
        response: { 200: z.array(screeningQuestionResponseSchema) },
      },
    },
    async (request) => {
      const { jobId } = request.params as { jobId: string };
      return listScreeningQuestions(request.tenantId as string, jobId);
    },
  );

  app.patch(
    "/:jobId/screening-questions/:questionId",
    {
      preHandler: manageRoles,
      schema: {
        params: screeningQuestionItemParamsSchema,
        body: updateScreeningQuestionBodySchema,
        response: { 200: screeningQuestionResponseSchema },
      },
    },
    async (request) => {
      const { jobId, questionId } = request.params as { jobId: string; questionId: string };
      const body = request.body as UpdateScreeningQuestionBody;
      return updateScreeningQuestion(request.tenantId as string, jobId, questionId, body);
    },
  );

  app.delete(
    "/:jobId/screening-questions/:questionId",
    {
      preHandler: manageRoles,
      schema: { params: screeningQuestionItemParamsSchema },
    },
    async (request, reply) => {
      const { jobId, questionId } = request.params as { jobId: string; questionId: string };
      await deleteScreeningQuestion(request.tenantId as string, jobId, questionId);
      return reply.status(204).send();
    },
  );
}
