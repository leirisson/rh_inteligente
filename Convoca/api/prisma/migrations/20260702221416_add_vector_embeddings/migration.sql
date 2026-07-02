-- Manual migration: add pgvector embedding columns + HNSW indexes for cosine similarity search
-- Dimension 1536 matches text-embedding-3-small (OpenAI)
-- DO NOT change this dimension after data has been inserted — it requires dropping and recreating the column

ALTER TABLE "candidates" ADD COLUMN "embedding" vector(1536);
ALTER TABLE "job_requirements" ADD COLUMN "embedding" vector(1536);

CREATE INDEX "candidates_embedding_idx" ON "candidates" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "job_requirements_embedding_idx" ON "job_requirements" USING hnsw ("embedding" vector_cosine_ops);
