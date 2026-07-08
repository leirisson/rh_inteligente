import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireCandidate } from "../../lib/rbac.js";
import {
  signupCandidateBodySchema,
  loginCandidateBodySchema,
  candidateAuthResponseSchema,
  candidateResponseSchema,
  updateCandidateBodySchema,
  createContactMethodBodySchema,
  contactMethodParamsSchema,
  contactMethodResponseSchema,
  applicationResponseSchema,
} from "./candidate.schema.js";
import type {
  SignupCandidateBody,
  LoginCandidateBody,
  UpdateCandidateBody,
  CreateContactMethodBody,
} from "./candidate.schema.js";
import {
  signupCandidate,
  loginCandidate,
  getCandidate,
  updateCandidate,
  createContactMethod,
  listContactMethods,
  deleteContactMethod,
  listCandidateApplications,
} from "./candidate.service.js";
import { candidateResumeRoutes } from "../candidate-resume/candidate-resume.routes.js";

export function candidateRoutes(app: FastifyInstance): void {
  app.post(
    "/signup",
    {
      schema: { body: signupCandidateBodySchema, response: { 201: candidateAuthResponseSchema } },
    },
    async (request, reply) => {
      const { name, email, password } = request.body as SignupCandidateBody;
      const result = await signupCandidate(app, name, email, password);
      return reply.status(201).send(result);
    },
  );

  app.post(
    "/login",
    {
      schema: { body: loginCandidateBodySchema, response: { 200: candidateAuthResponseSchema } },
    },
    async (request) => {
      const { email, password } = request.body as LoginCandidateBody;
      return loginCandidate(app, email, password);
    },
  );

  void app.register((protectedApp) => {
    protectedApp.addHook("onRequest", protectedApp.authenticate);
    protectedApp.addHook("preHandler", requireCandidate);

    protectedApp.get(
      "/me",
      { schema: { response: { 200: candidateResponseSchema } } },
      async (request) => {
        const candidateId = (request.user as { candidate_id: string }).candidate_id;
        return getCandidate(candidateId);
      },
    );

    protectedApp.patch(
      "/me",
      { schema: { body: updateCandidateBodySchema, response: { 200: candidateResponseSchema } } },
      async (request) => {
        const candidateId = (request.user as { candidate_id: string }).candidate_id;
        const body = request.body as UpdateCandidateBody;
        return updateCandidate(candidateId, body);
      },
    );

    protectedApp.post(
      "/me/contact-methods",
      {
        schema: {
          body: createContactMethodBodySchema,
          response: { 201: contactMethodResponseSchema },
        },
      },
      async (request, reply) => {
        const candidateId = (request.user as { candidate_id: string }).candidate_id;
        const { channel, value } = request.body as CreateContactMethodBody;
        const contactMethod = await createContactMethod(candidateId, channel, value);
        return reply.status(201).send(contactMethod);
      },
    );

    protectedApp.get(
      "/me/contact-methods",
      { schema: { response: { 200: z.array(contactMethodResponseSchema) } } },
      async (request) => {
        const candidateId = (request.user as { candidate_id: string }).candidate_id;
        return listContactMethods(candidateId);
      },
    );

    protectedApp.delete(
      "/me/contact-methods/:contactMethodId",
      { schema: { params: contactMethodParamsSchema } },
      async (request, reply) => {
        const candidateId = (request.user as { candidate_id: string }).candidate_id;
        const { contactMethodId } = request.params as { contactMethodId: string };
        await deleteContactMethod(candidateId, contactMethodId);
        return reply.status(204).send();
      },
    );

    protectedApp.get(
      "/me/applications",
      { schema: { response: { 200: z.array(applicationResponseSchema) } } },
      async (request) => {
        const candidateId = (request.user as { candidate_id: string }).candidate_id;
        return listCandidateApplications(candidateId);
      },
    );

    candidateResumeRoutes(protectedApp);
  });
}
