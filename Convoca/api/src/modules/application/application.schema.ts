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
