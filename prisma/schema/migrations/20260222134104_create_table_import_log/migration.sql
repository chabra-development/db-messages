-- CreateEnum
CREATE TYPE "ImportLogType" AS ENUM ('CONTACTS', 'ATTENDANTS', 'MESSAGES');

-- CreateTable
CREATE TABLE "import_logs" (
    "id" TEXT NOT NULL,
    "type" "ImportLogType" NOT NULL,
    "total" INTEGER NOT NULL,
    "succeeded" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "pay_load_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_logs_type_idx" ON "import_logs"("type");

-- CreateIndex
CREATE INDEX "import_logs_created_at_idx" ON "import_logs"("created_at");
