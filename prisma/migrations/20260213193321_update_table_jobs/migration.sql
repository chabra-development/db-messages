/*
  Warnings:

  - The `failed` column on the `import_job` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "import_job" ALTER COLUMN "status" DROP DEFAULT,
DROP COLUMN "failed",
ADD COLUMN     "failed" JSONB[] DEFAULT ARRAY[]::JSONB[];
