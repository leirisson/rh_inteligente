import { z } from "zod";

export const interviewParamsSchema = z.object({
  id: z.string().uuid(),
});

export const scheduleInterviewBodySchema = z.object({
  scheduledAt: z.coerce.date(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const rescheduleInterviewBodySchema = z.object({
  scheduledAt: z.coerce.date(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const interviewResponseSchema = z.object({
  id: z.string().uuid(),
  applicationId: z.string().uuid(),
  status: z.enum(["SCHEDULED", "RESCHEDULED", "CANCELLED"]),
  scheduledAt: z.date(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ScheduleInterviewBody = z.infer<typeof scheduleInterviewBodySchema>;
export type RescheduleInterviewBody = z.infer<typeof rescheduleInterviewBodySchema>;
