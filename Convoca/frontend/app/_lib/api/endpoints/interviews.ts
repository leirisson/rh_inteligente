import "server-only";
import { companyFetch } from "@/app/_lib/api/authed-fetch";
import type { Interview } from "@/app/_lib/api/types";

export function scheduleInterview(
  applicationId: string,
  input: { scheduledAt: string; location?: string; notes?: string },
) {
  return companyFetch<Interview>(`/applications/${applicationId}/interviews`, {
    method: "POST",
    body: input,
  });
}

export function rescheduleInterview(
  applicationId: string,
  input: { scheduledAt: string; location?: string; notes?: string },
) {
  return companyFetch<Interview>(`/applications/${applicationId}/interviews/reschedule`, {
    method: "PATCH",
    body: input,
  });
}

export function cancelInterview(applicationId: string) {
  return companyFetch<Interview>(`/applications/${applicationId}/interviews/cancel`, {
    method: "PATCH",
  });
}
