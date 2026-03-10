"use server"

import { auth } from "@/lib/auth"
import { FormUpdatePasswordProps } from "@/schemas/update-password-schema"
import { headers } from "next/headers"

export async function changePassword({ currentPassword, newPassword }: FormUpdatePasswordProps) {
    await auth.api.changePassword({
        headers: await headers(),
        body: {
            currentPassword,
            newPassword,
            revokeOtherSessions: true
        }
    })
}