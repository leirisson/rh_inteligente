import { z } from "zod";

export const screeningQuestionParamsSchema = z.object({
  jobId: z.string().uuid(),
});

export const screeningQuestionItemParamsSchema = z.object({
  jobId: z.string().uuid(),
  questionId: z.string().uuid(),
});

export const createScreeningQuestionBodySchema = z.object({
  question: z.string().min(1),
  expectedAnswer: z.string().optional(),
  order: z.number().int().min(0),
  weight: z.number().min(0).default(1),
});

export const updateScreeningQuestionBodySchema = z.object({
  question: z.string().min(1).optional(),
  expectedAnswer: z.string().optional(),
  order: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
});

export const screeningQuestionResponseSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  tenantId: z.string().uuid(),
  question: z.string(),
  expectedAnswer: z.string().nullable(),
  order: z.number(),
  weight: z.number(),
  createdAt: z.date(),
});

export type CreateScreeningQuestionBody = z.infer<typeof createScreeningQuestionBodySchema>;
export type UpdateScreeningQuestionBody = z.infer<typeof updateScreeningQuestionBodySchema>;
