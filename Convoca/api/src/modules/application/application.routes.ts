import type { FastifyInstance } from "fastify";
import { UserRole } from "@prisma/client";
import { requireRoles } from "../../lib/rbac.js";
import {
  applicationParamsSchema,
  candidateMessageBodySchema,
  applicationResponseSchema,
} from "./application.schema.js";
import type { CandidateMessageBody } from "./application.schema.js";
import { processCandidateMessage } from "./application.service.js";

const manageRoles = requireRoles(UserRole.TENANT_ADMIN, UserRole.RECRUITER);

export function applicationRoutes(app: FastifyInstance): void {
  app.addHook("onRequest", app.authenticate);

  app.post(
    "/:id/messages",
    {
      preHandler: manageRoles,
      schema: {
        params: applicationParamsSchema,
        body: candidateMessageBodySchema,
        response: { 200: applicationResponseSchema },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const { content } = request.body as CandidateMessageBody;
      return processCandidateMessage(request.tenantId as string, id, content);
    },
  );
}
