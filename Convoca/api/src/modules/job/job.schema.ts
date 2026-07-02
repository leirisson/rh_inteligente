import { z } from "zod";
import { JobStatus } from "@prisma/client";

export const jobParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createJobBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const updateJobBodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

export const updateJobStatusBodySchema = z.object({
  status: z.nativeEnum(JobStatus),
});

export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const jobResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: z.nativeEnum(JobStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const listJobsResponseSchema = z.object({
  data: z.array(jobResponseSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export type CreateJobBody = z.infer<typeof createJobBodySchema>;
export type UpdateJobBody = z.infer<typeof updateJobBodySchema>;
export type UpdateJobStatusBody = z.infer<typeof updateJobStatusBodySchema>;
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
