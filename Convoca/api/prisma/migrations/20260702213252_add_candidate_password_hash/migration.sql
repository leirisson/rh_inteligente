/*
  Warnings:

  - You are about to drop the column `embedding` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `embedding` on the `job_requirements` table. All the data in the column will be lost.
  - Added the required column `password_hash` to the `candidates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "candidates" DROP COLUMN "embedding",
ADD COLUMN     "password_hash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "job_requirements" DROP COLUMN "embedding";
