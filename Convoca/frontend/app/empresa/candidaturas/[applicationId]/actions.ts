"use server";

import { scheduleInterview } from "@/app/_lib/api/endpoints/interviews";

export async function scheduleInterviewAction(
  applicationId: string,
  input: { scheduledAt: string; location?: string; notes?: string },
) {
  await scheduleInterview(applicationId, input);
}
