-- Enable pgvector extension
-- Required for embedding columns in Spec 04 (JobRequirement, Candidate).
-- The pgvector/pgvector:pg16 Docker image has the extension compiled;
-- this SQL registers it in the database.
CREATE EXTENSION IF NOT EXISTS vector;
