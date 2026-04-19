"use server";

import { prisma } from "@/lib/prisma";
import { ImportLogType } from "@prisma/client";

// ============================================
// TYPES
// ============================================

interface CreateImportLogData {
  type: ImportLogType;
  total: number;
  succeeded: number;
  failed: number;
  duration: number;
  payloadSize: number;
}

// ============================================
// LEITURA
// ============================================

interface FindManyImportLogsOptions {
  type?: ImportLogType | "all";
  take?: number;
  skip?: number;
}

/**
 * Lista logs paginados, opcionalmente filtrados por tipo
 */
export async function findManyImportLogs({
  type,
  take = 50,
  skip = 0,
}: FindManyImportLogsOptions = {}) {
  const where = type && type !== "all" ? { type } : undefined;

  const [data, count] = await Promise.all([
    prisma.importLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.importLog.count({ where }),
  ]);

  return {
    data,
    count,
    page: Math.floor(skip / take) + 1,
    totalPages: Math.max(1, Math.ceil(count / take)),
  };
}

/**
 * Busca o último log de um tipo específico
 */
export async function findLastImportLog(type: ImportLogType) {
  return prisma.importLog.findFirst({
    where: { type },
    orderBy: { createdAt: "desc" },
  });
}

// ============================================
// ESCRITA
// ============================================

/**
 * Cria um log de importação ao final de cada job
 */
export async function createImportLog(data: CreateImportLogData) {
  return prisma.importLog.create({
    data: {
      type: data.type,
      total: data.total,
      succeeded: data.succeeded,
      failed: data.failed,
      duration: data.duration,
      payloadSize: data.payloadSize,
    },
  });
}
