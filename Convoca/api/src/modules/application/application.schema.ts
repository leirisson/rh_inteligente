import { z } from "zod";

export const applicationParamsSchema = z.object({
  id: z.string().uuid(),
});

export const candidateMessageBodySchema = z.object({
  content: z.string().min(1),
});

export const applicationResponseSchema = z.object({
  id: z.string().uuid(),
  candidateId: z.string().uuid(),
  jobId: z.string().uuid(),
  status: z.enum([
    "PENDING_CONTACT",
    "IN_SCREENING",
    "APPROVED",
    "REJECTED",
    "INTERVIEW_SCHEDULED",
    "HIRED",
    "WITHDRAWN",
  ]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CandidateMessageBody = z.infer<typeof candidateMessageBodySchema>;

export const funnelParamsSchema = z.object({
  jobId: z.string().uuid(),
});

export const funnelResponseSchema = z.object({
  PENDING_CONTACT: z.number().int(),
  IN_SCREENING: z.number().int(),
  APPROVED: z.number().int(),
  REJECTED: z.number().int(),
  INTERVIEW_SCHEDULED: z.number().int(),
  HIRED: z.number().int(),
  WITHDRAWN: z.number().int(),
});
