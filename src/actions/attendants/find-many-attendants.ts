"use server"

import { prisma } from "@/lib/prisma"
import { findManyAttendantsSchema } from "@/schemas/find-many-attendants-schema"
import { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"

type FindManyAttendantsProps = Omit<Prisma.UserFindManyArgs, "take" | "skip"> & {
    take: string | null
    skip: string | null
}

export async function findManyAttendants({
    skip, take, ...props
}: FindManyAttendantsProps) {

    const { data, error } = findManyAttendantsSchema.safeParse({ skip, take })

    if (error) redirect("/attendants?skip=0&take=20")

    const attendants = await prisma.user.findMany({
        take: data.take,
        skip: data.skip,
        ...props
    })

    const count = await prisma.user.count()

    const page = Math.floor(data.skip / data.take) + 1
    const totalPages = Math.ceil(count / data.take)

    console.log(totalPages)

    return {
        count,
        data: attendants,
        page,
        totalPages
    }
}