-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'RESCHEDULED', 'CANCELLED');

-- DropIndex
DROP INDEX "candidates_embedding_idx";

-- DropIndex
DROP INDEX "interview_schedules_application_id_key";

-- DropIndex
DROP INDEX "job_requirements_embedding_idx";

-- AlterTable
ALTER TABLE "interview_schedules" ADD COLUMN     "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED';

-- CreateIndex
CREATE INDEX "interview_schedules_application_id_idx" ON "interview_schedules"("application_id");

-- Recreate HNSW indexes dropped above: Prisma's diff engine doesn't track indexes on
-- Unsupported("vector(N)") columns, so every `migrate dev` run treats them as unmanaged
-- and drops them. Re-created here to avoid silently losing the pgvector similarity index
-- (see add_vector_embeddings migration and CLAUDE.md 5.11).
CREATE INDEX "candidates_embedding_idx" ON "candidates" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "job_requirements_embedding_idx" ON "job_requirements" USING hnsw ("embedding" vector_cosine_ops);
