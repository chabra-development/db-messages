"use server"

import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function findManyAttendants(props: Prisma.UserFindManyArgs = {}) {
    return await prisma.user.findMany(props)
}