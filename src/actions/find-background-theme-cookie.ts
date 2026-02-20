"use server"

import { cookies } from "next/headers"

export async function findBackgroundThemeCookie() {
    
    const cookie = await cookies()

    const backgroundTheme = cookie.get("background-theme") ?? undefined

    if (!backgroundTheme) throw new Error("Background theme cookie not found")

    return backgroundTheme
}