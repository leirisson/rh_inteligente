import { z } from "zod";
import { LanguageProficiency } from "@prisma/client";

export const createWorkExperienceBodySchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().optional().default(false),
});

export const workExperienceResponseSchema = z.object({
  id: z.string().uuid(),
  candidateId: z.string().uuid(),
  company: z.string(),
  role: z.string(),
  description: z.string().nullable(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  isCurrent: z.boolean(),
  createdAt: z.date(),
});

export const workExperienceParamsSchema = z.object({
  workExperienceId: z.string().uuid(),
});

export const createEducationBodySchema = z.object({
  institution: z.string().min(1),
  course: z.string().min(1),
  level: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().optional().default(false),
});

export const educationResponseSchema = z.object({
  id: z.string().uuid(),
  candidateId: z.string().uuid(),
  institution: z.string(),
  course: z.string(),
  level: z.string(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  isCurrent: z.boolean(),
  createdAt: z.date(),
});

export const educationParamsSchema = z.object({
  educationId: z.string().uuid(),
});

export const createSkillBodySchema = z.object({
  name: z.string().min(1),
});

export const skillResponseSchema = z.object({
  id: z.string().uuid(),
  candidateId: z.string().uuid(),
  name: z.string(),
  createdAt: z.date(),
});

export const skillParamsSchema = z.object({
  skillId: z.string().uuid(),
});

export const createLanguageBodySchema = z.object({
  name: z.string().min(1),
  proficiency: z.nativeEnum(LanguageProficiency),
});

export const languageResponseSchema = z.object({
  id: z.string().uuid(),
  candidateId: z.string().uuid(),
  name: z.string(),
  proficiency: z.nativeEnum(LanguageProficiency),
  createdAt: z.date(),
});

export const languageParamsSchema = z.object({
  languageId: z.string().uuid(),
});

export const candidateResumeResponseSchema = z.object({
  workExperiences: z.array(workExperienceResponseSchema),
  educations: z.array(educationResponseSchema),
  skills: z.array(skillResponseSchema),
  languages: z.array(languageResponseSchema),
});

export type CreateWorkExperienceBody = z.infer<typeof createWorkExperienceBodySchema>;
export type CreateEducationBody = z.infer<typeof createEducationBodySchema>;
export type CreateSkillBody = z.infer<typeof createSkillBodySchema>;
export type CreateLanguageBody = z.infer<typeof createLanguageBodySchema>;
