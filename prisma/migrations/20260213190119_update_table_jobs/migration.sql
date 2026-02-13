-- AlterTable
ALTER TABLE "import_job" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "failed_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "succeeded" INTEGER NOT NULL DEFAULT 0;
