import { prisma } from "../../lib/prisma.js";

function jobNotFoundError() {
  return Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
}

interface JobMatchRow {
  candidate_id: string;
  name: string;
  email: string | null;
  score: number;
}

export interface JobMatch {
  candidateId: string;
  name: string;
  email: string | null;
  score: number;
}

export async function getJobMatches(
  tenantId: string,
  jobId: string,
  threshold: number,
): Promise<JobMatch[]> {
  const job = await prisma.job.findFirst({ where: { id: jobId, tenantId } });
  if (!job) throw jobNotFoundError();

  const rows = await prisma.$queryRaw<JobMatchRow[]>`
    SELECT
      c.id AS candidate_id,
      c.name AS name,
      c.email AS email,
      AVG(1 - (c.embedding <=> r.embedding)) AS score
    FROM "candidates" c
    JOIN "job_requirements" r ON r."job_id" = ${jobId}::uuid
    WHERE c.embedding IS NOT NULL AND r.embedding IS NOT NULL
    GROUP BY c.id, c.name, c.email
    HAVING AVG(1 - (c.embedding <=> r.embedding)) >= ${threshold}
    ORDER BY score DESC
  `;

  return rows.map((row) => ({
    candidateId: row.candidate_id,
    name: row.name,
    email: row.email,
    score: Number(row.score),
  }));
}
