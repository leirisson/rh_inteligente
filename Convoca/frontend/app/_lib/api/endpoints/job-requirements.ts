import "server-only";
import { companyFetch } from "@/app/_lib/api/authed-fetch";
import type { JobRequirement } from "@/app/_lib/api/types";

export function listJobRequirements(jobId: string) {
  return companyFetch<JobRequirement[]>(`/jobs/${jobId}/requirements`);
}

export function createJobRequirement(jobId: string, text: string) {
  return companyFetch<JobRequirement>(`/jobs/${jobId}/requirements`, {
    method: "POST",
    body: { text },
  });
}

export function deleteJobRequirement(jobId: string, requirementId: string) {
  return companyFetch<void>(`/jobs/${jobId}/requirements/${requirementId}`, {
    method: "DELETE",
  });
}
