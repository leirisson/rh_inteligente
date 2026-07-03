import "server-only";
import { companyFetch } from "@/app/_lib/api/authed-fetch";
import type { ScreeningQuestion } from "@/app/_lib/api/types";

export function listScreeningQuestions(jobId: string) {
  return companyFetch<ScreeningQuestion[]>(`/jobs/${jobId}/screening-questions`);
}

export function createScreeningQuestion(
  jobId: string,
  input: { question: string; expectedAnswer?: string; order: number; weight?: number },
) {
  return companyFetch<ScreeningQuestion>(`/jobs/${jobId}/screening-questions`, {
    method: "POST",
    body: input,
  });
}

export function updateScreeningQuestion(
  jobId: string,
  questionId: string,
  input: { question?: string; expectedAnswer?: string; order?: number; weight?: number },
) {
  return companyFetch<ScreeningQuestion>(`/jobs/${jobId}/screening-questions/${questionId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteScreeningQuestion(jobId: string, questionId: string) {
  return companyFetch<void>(`/jobs/${jobId}/screening-questions/${questionId}`, {
    method: "DELETE",
  });
}
