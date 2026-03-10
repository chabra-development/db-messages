"use server"

import {
    extractNameFromBlipIdentity
} from "@/functions/extract-name-from-blip-identity"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ImportAttendantsProps } from "@/schemas/import-attendants-schema"
import { randomUUID } from "crypto"

export async function importAttendants({ attendents }: ImportAttendantsProps) {

    const job = await prisma.import_jobs.create({
        data: {
            id: randomUUID(),
            total: attendents.length,
            status: "pending",
            updated_at: new Date(),
        },
    })

        ; (async () => {
            try {

                await prisma.import_jobs.update({
                    where: { id: job.id },
                    data: { status: "running", started_at: new Date(), updated_at: new Date() },
                })

                for (const { identity, email, teams } of attendents) {
                    try {

                        const exists = await prisma.user.findUnique({
                            where: { identity },
                        })

                        if (!exists) {
                            await auth.api.signUpEmail({
                                body: {
                                    email,
                                    name: extractNameFromBlipIdentity(identity),
                                    password: "Chabra@123",
                                    identity,
                                    teams,
                                },
                            })
                        }

                        await prisma.import_jobs.update({
                            where: { id: job.id },
                            data: { succeeded: { increment: 1 }, updated_at: new Date() },
                        })

                    } catch (itemError) {

                        await prisma.import_jobs.update({
                            where: { id: job.id },
                            data: {
                                failed_count: { increment: 1 },
                                failed: {
                                    push: {
                                        identity,
                                        email,
                                        reason: (itemError as Error).message,
                                    },
                                },
                                updated_at: new Date(),
                            },
                        })

                    } finally {

                        await prisma.import_jobs.update({
                            where: { id: job.id },
                            data: {
                                processed: { increment: 1 },
                                updated_at: new Date(),
                            },
                        })
                    }
                }

                await prisma.import_jobs.update({
                    where: { id: job.id },
                    data: { status: "completed", completed_at: new Date(), updated_at: new Date() },
                })

            } catch {

                await prisma.import_jobs.update({
                    where: { id: job.id },
                    data: { status: "failed", updated_at: new Date() },
                })

            } finally {

                setTimeout(async () => {
                    try {

                        await prisma.import_jobs.delete({
                            where: { id: job.id },
                        })

                    } catch {}
                }, 10_000)
            }
        })()

    return { jobId: job.id }
}
