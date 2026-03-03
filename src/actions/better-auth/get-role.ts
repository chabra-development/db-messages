"use server"

import { auth } from "@/lib/auth"
import type { AppRole } from "@/lib/permissions"
import { headers } from "next/headers"

export async function getUserRole() {
    
    const session = await auth.api.getSession({ 
        headers: await headers() 
    })

    if (!session) return null

    return session.user.role as AppRole
}