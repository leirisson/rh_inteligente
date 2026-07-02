import { JobStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { runScreeningAgent } from "../../agent/graph.js";

function notFoundError() {
  return Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
}

export async function createJob(tenantId: string, title: string, description: string) {
  return prisma.job.create({
    data: { tenantId, title, description },
  });
}

export async function listJobs(tenantId: string, page: number, pageSize: number) {
  const [data, total] = await Promise.all([
    prisma.job.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.job.count({ where: { tenantId } }),
  ]);

  return { data, page, pageSize, total };
}

export async function getJob(tenantId: string, jobId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, tenantId } });
  if (!job) throw notFoundError();
  return job;
}

export async function updateJob(
  tenantId: string,
  jobId: string,
  data: { title?: string; description?: string },
) {
  await getJob(tenantId, jobId);
  return prisma.job.update({ where: { id: jobId }, data });
}

export async function updateJobStatus(tenantId: string, jobId: string, status: JobStatus) {
  const job = await getJob(tenantId, jobId);
  const isFirstActivation = job.status === JobStatus.DRAFT && status === JobStatus.ACTIVE;
  const isBecomingActive = job.status !== JobStatus.ACTIVE && status === JobStatus.ACTIVE;

  if (isFirstActivation) {
    const questionCount = await prisma.screeningQuestion.count({ where: { jobId } });
    if (questionCount === 0) {
      throw Object.assign(new Error("Job cannot be activated without screening questions"), {
        statusCode: 422,
        code: "JOB_MISSING_SCREENING_QUESTIONS",
      });
    }
  }

  const updated = await prisma.job.update({ where: { id: jobId }, data: { status } });

  if (isBecomingActive) {
    await runScreeningAgent(tenantId, jobId);
  }

  return updated;
}

export async function deleteJob(tenantId: string, jobId: string) {
  await getJob(tenantId, jobId);
  await prisma.job.delete({ where: { id: jobId } });
}
