import { prisma } from "../../lib/prisma.js";

function jobNotFoundError() {
  return Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
}

function questionNotFoundError() {
  return Object.assign(new Error("Screening question not found"), {
    statusCode: 404,
    code: "SCREENING_QUESTION_NOT_FOUND",
  });
}

async function assertJobInTenant(tenantId: string, jobId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, tenantId } });
  if (!job) throw jobNotFoundError();
}

export async function createScreeningQuestion(
  tenantId: string,
  jobId: string,
  data: { question: string; expectedAnswer?: string; order: number; weight: number },
) {
  await assertJobInTenant(tenantId, jobId);
  return prisma.screeningQuestion.create({ data: { jobId, tenantId, ...data } });
}

export async function listScreeningQuestions(tenantId: string, jobId: string) {
  await assertJobInTenant(tenantId, jobId);
  return prisma.screeningQuestion.findMany({ where: { jobId, tenantId }, orderBy: { order: "asc" } });
}

export async function updateScreeningQuestion(
  tenantId: string,
  jobId: string,
  questionId: string,
  data: { question?: string; expectedAnswer?: string; order?: number; weight?: number },
) {
  await assertJobInTenant(tenantId, jobId);
  const question = await prisma.screeningQuestion.findFirst({
    where: { id: questionId, jobId, tenantId },
  });
  if (!question) throw questionNotFoundError();
  return prisma.screeningQuestion.update({ where: { id: questionId }, data });
}

export async function deleteScreeningQuestion(tenantId: string, jobId: string, questionId: string) {
  await assertJobInTenant(tenantId, jobId);
  const question = await prisma.screeningQuestion.findFirst({
    where: { id: questionId, jobId, tenantId },
  });
  if (!question) throw questionNotFoundError();
  await prisma.screeningQuestion.delete({ where: { id: questionId } });
}
