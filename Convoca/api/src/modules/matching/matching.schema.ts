import { z } from "zod";

export const jobMatchesParamsSchema = z.object({
  jobId: z.string().uuid(),
});

export const jobMatchesQuerySchema = z.object({
  threshold: z.coerce.number().min(0).max(1).default(0.5),
});

export const jobMatchResponseSchema = z.object({
  candidateId: z.string().uuid(),
  name: z.string(),
  email: z.string().nullable(),
  score: z.number(),
});

export type JobMatchesQuery = z.infer<typeof jobMatchesQuerySchema>;
