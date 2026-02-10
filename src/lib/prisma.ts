export const runtime = "nodejs"

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
})

export const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV !== "production" ? ["error", "query"] : ["error"]
})

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma
}
