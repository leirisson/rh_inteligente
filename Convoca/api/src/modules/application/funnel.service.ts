import { ApplicationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

function jobNotFoundError() {
  return Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
}

export type ApplicationFunnel = Record<ApplicationStatus, number>;

export async function getApplicationFunnel(
  tenantId: string,
  jobId: string,
): Promise<ApplicationFunnel> {
  const job = await prisma.job.findFirst({ where: { id: jobId, tenantId } });
  if (!job) throw jobNotFoundError();

  const grouped = await prisma.application.groupBy({
    by: ["status"],
    where: { jobId },
    _count: true,
  });

  const funnel = Object.fromEntries(
    Object.values(ApplicationStatus).map((status) => [status, 0]),
  ) as ApplicationFunnel;

  for (const row of grouped) {
    funnel[row.status] = row._count;
  }

  return funnel;
}
