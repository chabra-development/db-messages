/*
  Warnings:

  - You are about to drop the column `created_by_id` on the `import_jobs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "import_jobs_created_by_id_idx";

-- AlterTable
ALTER TABLE "import_jobs" DROP COLUMN "created_by_id";
