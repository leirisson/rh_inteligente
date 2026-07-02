import { z } from "zod";

export const jobRequirementParamsSchema = z.object({
  jobId: z.string().uuid(),
});

export const jobRequirementItemParamsSchema = z.object({
  jobId: z.string().uuid(),
  requirementId: z.string().uuid(),
});

export const createJobRequirementBodySchema = z.object({
  text: z.string().min(1),
});

export const jobRequirementResponseSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  tenantId: z.string().uuid(),
  text: z.string(),
  createdAt: z.date(),
});

export type CreateJobRequirementBody = z.infer<typeof createJobRequirementBodySchema>;
