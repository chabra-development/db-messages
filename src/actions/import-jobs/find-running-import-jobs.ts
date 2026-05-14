"use server";

import { prisma } from "@/lib/prisma";

export type RunningImportJob = {
  id: string;
  total: number;
  processed: number;
  succeeded: number;
  failedCount: number;
  startedAt: Date | null;
  status: string;
  metadata: Record<string, unknown> | null;
};

export async function findRunningImportJobs(): Promise<RunningImportJob[]> {
  const jobs = await prisma.$queryRaw<RunningImportJob[]>`
    SELECT
      id,
      total,
      processed,
      succeeded,
      failed_count AS "failedCount",
      started_at   AS "startedAt",
      status::text AS status,
      metadata
    FROM import_jobs
    WHERE status = 'running'::import_job_status
    ORDER BY started_at DESC NULLS LAST
    LIMIT 10
  `;
  return jobs;
}
