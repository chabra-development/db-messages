/*
  Warnings:

  - You are about to drop the column `completedAt` on the `import_job` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `import_job` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `import_job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "import_job" DROP COLUMN "completedAt",
DROP COLUMN "createdAt",
DROP COLUMN "startedAt",
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "started_at" TIMESTAMP(3);
