import { z } from "zod";
import { Channel } from "@prisma/client";

export const signupCandidateBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  resumeText: z.string().optional(),
});

export const loginCandidateBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const candidateResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email().nullable(),
  resumeText: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const candidateAuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  candidate: candidateResponseSchema,
});

export const updateCandidateBodySchema = z.object({
  name: z.string().min(1).optional(),
  resumeText: z.string().optional(),
});

export const createContactMethodBodySchema = z.object({
  channel: z.nativeEnum(Channel),
  value: z.string().min(1),
});

export const contactMethodParamsSchema = z.object({
  contactMethodId: z.string().uuid(),
});

export const contactMethodResponseSchema = z.object({
  id: z.string().uuid(),
  candidateId: z.string().uuid(),
  channel: z.nativeEnum(Channel),
  value: z.string(),
  createdAt: z.date(),
});

export const applicationResponseSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SignupCandidateBody = z.infer<typeof signupCandidateBodySchema>;
export type LoginCandidateBody = z.infer<typeof loginCandidateBodySchema>;
export type UpdateCandidateBody = z.infer<typeof updateCandidateBodySchema>;
export type CreateContactMethodBody = z.infer<typeof createContactMethodBodySchema>;
