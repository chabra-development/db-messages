"use server"

import { prisma } from "@/lib/prisma"

export async function getImportJob(jobId: string) {
    return prisma.importJob.findUnique({
        where: { id: jobId },
    })
}