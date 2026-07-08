import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createWorkExperienceBodySchema,
  workExperienceParamsSchema,
  workExperienceResponseSchema,
  createEducationBodySchema,
  educationParamsSchema,
  educationResponseSchema,
  createSkillBodySchema,
  skillParamsSchema,
  skillResponseSchema,
  createLanguageBodySchema,
  languageParamsSchema,
  languageResponseSchema,
  candidateResumeResponseSchema,
} from "./candidate-resume.schema.js";
import type {
  CreateWorkExperienceBody,
  CreateEducationBody,
  CreateSkillBody,
  CreateLanguageBody,
} from "./candidate-resume.schema.js";
import {
  createWorkExperience,
  listWorkExperiences,
  deleteWorkExperience,
  createEducation,
  listEducations,
  deleteEducation,
  createSkill,
  listSkills,
  deleteSkill,
  createLanguage,
  listLanguages,
  deleteLanguage,
  getCandidateResume,
} from "./candidate-resume.service.js";

function candidateId(request: { user: unknown }): string {
  return (request.user as { candidate_id: string }).candidate_id;
}

export function candidateResumeRoutes(app: FastifyInstance): void {
  app.get(
    "/me/resume",
    { schema: { response: { 200: candidateResumeResponseSchema } } },
    async (request) => getCandidateResume(candidateId(request)),
  );

  app.post(
    "/me/work-experiences",
    {
      schema: {
        body: createWorkExperienceBodySchema,
        response: { 201: workExperienceResponseSchema },
      },
    },
    async (request, reply) => {
      const body = request.body as CreateWorkExperienceBody;
      const workExperience = await createWorkExperience(candidateId(request), body);
      return reply.status(201).send(workExperience);
    },
  );

  app.get(
    "/me/work-experiences",
    { schema: { response: { 200: z.array(workExperienceResponseSchema) } } },
    async (request) => listWorkExperiences(candidateId(request)),
  );

  app.delete(
    "/me/work-experiences/:workExperienceId",
    { schema: { params: workExperienceParamsSchema } },
    async (request, reply) => {
      const { workExperienceId } = request.params as { workExperienceId: string };
      await deleteWorkExperience(candidateId(request), workExperienceId);
      return reply.status(204).send();
    },
  );

  app.post(
    "/me/educations",
    { schema: { body: createEducationBodySchema, response: { 201: educationResponseSchema } } },
    async (request, reply) => {
      const body = request.body as CreateEducationBody;
      const education = await createEducation(candidateId(request), body);
      return reply.status(201).send(education);
    },
  );

  app.get(
    "/me/educations",
    { schema: { response: { 200: z.array(educationResponseSchema) } } },
    async (request) => listEducations(candidateId(request)),
  );

  app.delete(
    "/me/educations/:educationId",
    { schema: { params: educationParamsSchema } },
    async (request, reply) => {
      const { educationId } = request.params as { educationId: string };
      await deleteEducation(candidateId(request), educationId);
      return reply.status(204).send();
    },
  );

  app.post(
    "/me/skills",
    { schema: { body: createSkillBodySchema, response: { 201: skillResponseSchema } } },
    async (request, reply) => {
      const body = request.body as CreateSkillBody;
      const skill = await createSkill(candidateId(request), body);
      return reply.status(201).send(skill);
    },
  );

  app.get(
    "/me/skills",
    { schema: { response: { 200: z.array(skillResponseSchema) } } },
    async (request) => listSkills(candidateId(request)),
  );

  app.delete(
    "/me/skills/:skillId",
    { schema: { params: skillParamsSchema } },
    async (request, reply) => {
      const { skillId } = request.params as { skillId: string };
      await deleteSkill(candidateId(request), skillId);
      return reply.status(204).send();
    },
  );

  app.post(
    "/me/languages",
    { schema: { body: createLanguageBodySchema, response: { 201: languageResponseSchema } } },
    async (request, reply) => {
      const body = request.body as CreateLanguageBody;
      const language = await createLanguage(candidateId(request), body);
      return reply.status(201).send(language);
    },
  );

  app.get(
    "/me/languages",
    { schema: { response: { 200: z.array(languageResponseSchema) } } },
    async (request) => listLanguages(candidateId(request)),
  );

  app.delete(
    "/me/languages/:languageId",
    { schema: { params: languageParamsSchema } },
    async (request, reply) => {
      const { languageId } = request.params as { languageId: string };
      await deleteLanguage(candidateId(request), languageId);
      return reply.status(204).send();
    },
  );
}
