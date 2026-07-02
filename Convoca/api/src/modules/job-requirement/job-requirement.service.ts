import { prisma } from "../../lib/prisma.js";
import { generateEmbedding } from "../../lib/embeddings.js";
import { setJobRequirementEmbedding } from "../../lib/vector.js";

function jobNotFoundError() {
  return Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
}

function requirementNotFoundError() {
  return Object.assign(new Error("Job requirement not found"), {
    statusCode: 404,
    code: "JOB_REQUIREMENT_NOT_FOUND",
  });
}

async function assertJobInTenant(tenantId: string, jobId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, tenantId } });
  if (!job) throw jobNotFoundError();
}

export async function createJobRequirement(tenantId: string, jobId: string, text: string) {
  await assertJobInTenant(tenantId, jobId);
  const requirement = await prisma.jobRequirement.create({ data: { jobId, tenantId, text } });

  const embedding = await generateEmbedding(text);
  await setJobRequirementEmbedding(requirement.id, embedding);

  return requirement;
}

export async function listJobRequirements(tenantId: string, jobId: string) {
  await assertJobInTenant(tenantId, jobId);
  return prisma.jobRequirement.findMany({
    where: { jobId, tenantId },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteJobRequirement(tenantId: string, jobId: string, requirementId: string) {
  await assertJobInTenant(tenantId, jobId);
  const requirement = await prisma.jobRequirement.findFirst({
    where: { id: requirementId, jobId, tenantId },
  });
  if (!requirement) throw requirementNotFoundError();
  await prisma.jobRequirement.delete({ where: { id: requirementId } });
}
