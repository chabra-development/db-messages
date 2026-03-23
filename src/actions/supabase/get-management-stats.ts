"use server"

import { env } from "@/env"

const PROJECT_REF = "unmzkwhztyizitjletqg"
const BASE_URL = "https://api.supabase.com/v1"

async function managementFetch<T>(path: string): Promise<T | null> {
    if (!env.SUPABASE_MANAGEMENT_TOKEN) return null

    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${env.SUPABASE_MANAGEMENT_TOKEN}` },
        next: { revalidate: 60 },
    })

    if (!res.ok) return null

    return res.json() as Promise<T>
}

type ProjectInfo = {
    id: string
    name: string
    region: string
    status: string
    organization_id: string
    created_at: string
}

type HealthCheck = {
    name: string
    status: "HEALTHY" | "UNHEALTHY" | "COMING_UP" | string
    error?: string
}

export async function getManagementStats() {

    if (!env.SUPABASE_MANAGEMENT_TOKEN) {
        return { configured: false as const }
    }

    const [project, health] = await Promise.all([
        managementFetch<ProjectInfo>(`/projects/${PROJECT_REF}`),
        managementFetch<HealthCheck[]>(`/projects/${PROJECT_REF}/health`),
    ])

    return {
        configured: true as const,
        project,
        health,
    }
}

export type ManagementStats = Awaited<ReturnType<typeof getManagementStats>>
