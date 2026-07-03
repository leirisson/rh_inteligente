import "server-only";
import { companyFetch } from "@/app/_lib/api/authed-fetch";
import type { Job, ListJobsResponse, JobStatus, JobMatch } from "@/app/_lib/api/types";

export function listJobs(page = 1, pageSize = 20) {
  return companyFetch<ListJobsResponse>("/jobs", { searchParams: { page, pageSize } });
}

export function getJob(id: string) {
  return companyFetch<Job>(`/jobs/${id}`);
}

export function createJob(input: { title: string; description: string }) {
  return companyFetch<Job>("/jobs", { method: "POST", body: input });
}

export function updateJob(id: string, input: { title?: string; description?: string }) {
  return companyFetch<Job>(`/jobs/${id}`, { method: "PATCH", body: input });
}

export function updateJobStatus(id: string, status: JobStatus) {
  return companyFetch<Job>(`/jobs/${id}/status`, { method: "PATCH", body: { status } });
}

export function deleteJob(id: string) {
  return companyFetch<void>(`/jobs/${id}`, { method: "DELETE" });
}

export function getJobMatches(jobId: string, threshold = 0.5) {
  return companyFetch<JobMatch[]>(`/jobs/${jobId}/matches`, { searchParams: { threshold } });
}
