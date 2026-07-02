import { prisma } from "./prisma.js";

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function setCandidateEmbedding(
  candidateId: string,
  embedding: number[],
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "candidates" SET "embedding" = ${toVectorLiteral(embedding)}::vector
    WHERE "id" = ${candidateId}::uuid
  `;
}

export async function setJobRequirementEmbedding(
  requirementId: string,
  embedding: number[],
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "job_requirements" SET "embedding" = ${toVectorLiteral(embedding)}::vector
    WHERE "id" = ${requirementId}::uuid
  `;
}
