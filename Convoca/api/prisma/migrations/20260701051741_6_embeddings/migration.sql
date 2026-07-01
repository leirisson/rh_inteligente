-- Manual migration: add pgvector embedding columns
-- Dimension 1536 is locked to match text-embedding-3-small (OpenAI / OpenRouter)
-- DO NOT change this dimension after data has been inserted — it requires dropping and recreating the column

ALTER TABLE "candidates" ADD COLUMN "embedding" vector(1536);
ALTER TABLE "job_requirements" ADD COLUMN "embedding" vector(1536);
