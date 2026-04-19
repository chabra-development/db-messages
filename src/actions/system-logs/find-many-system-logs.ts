"use server";

import { prisma } from "@/lib/prisma";

interface FindManySystemLogsOptions {
  level?: "all" | "INFO" | "WARN" | "ERROR";
  category?: "all" | "IMPORT" | "JOB" | "USER_MANAGEMENT" | "AUTH" | "SYSTEM";
  action?: string;
  from?: Date;
  to?: Date;
  take?: number;
  skip?: number;
}

export async function findManySystemLogs({
  level,
  category,
  action,
  from,
  to,
  take = 50,
  skip = 0,
}: FindManySystemLogsOptions = {}) {
  const where = {
    ...(level && level !== "all" && { level }),
    ...(category && category !== "all" && { category }),
    ...(action && { action: { contains: action } }),
    ...((from || to) && {
      createdAt: {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      },
    }),
  };

  const [data, count] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.systemLog.count({ where }),
  ]);

  const page = Math.floor(skip / take) + 1;
  const totalPages = Math.ceil(count / take);

  return { data, count, page, totalPages };
}
