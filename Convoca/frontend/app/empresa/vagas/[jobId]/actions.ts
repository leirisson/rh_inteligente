"use server";

import { revalidatePath } from "next/cache";
import { updateJob, updateJobStatus } from "@/app/_lib/api/endpoints/jobs";
import { createJobRequirement, deleteJobRequirement } from "@/app/_lib/api/endpoints/job-requirements";
import {
  createScreeningQuestion,
  deleteScreeningQuestion,
} from "@/app/_lib/api/endpoints/screening-questions";
import type { JobStatus } from "@/app/_lib/api/types";

export async function updateJobDetailsAction(jobId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) return;

  await updateJob(jobId, { title, description });
  revalidatePath(`/empresa/vagas/${jobId}`);
}

export async function publishJobAction(jobId: string) {
  await updateJobStatus(jobId, "ACTIVE");
  revalidatePath(`/empresa/vagas/${jobId}`);
}

export async function setJobStatusAction(jobId: string, status: JobStatus) {
  await updateJobStatus(jobId, status);
  revalidatePath(`/empresa/vagas/${jobId}`);
}

export async function addRequirementAction(jobId: string, formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  await createJobRequirement(jobId, text);
  revalidatePath(`/empresa/vagas/${jobId}`);
}

export async function removeRequirementAction(jobId: string, requirementId: string) {
  await deleteJobRequirement(jobId, requirementId);
  revalidatePath(`/empresa/vagas/${jobId}`);
}

export async function addScreeningQuestionAction(
  jobId: string,
  nextOrder: number,
  formData: FormData,
) {
  const question = String(formData.get("question") ?? "").trim();
  const expectedAnswer = String(formData.get("expectedAnswer") ?? "").trim();
  if (!question) return;
  await createScreeningQuestion(jobId, {
    question,
    expectedAnswer: expectedAnswer || undefined,
    order: nextOrder,
  });
  revalidatePath(`/empresa/vagas/${jobId}`);
}

export async function removeScreeningQuestionAction(jobId: string, questionId: string) {
  await deleteScreeningQuestion(jobId, questionId);
  revalidatePath(`/empresa/vagas/${jobId}`);
}
