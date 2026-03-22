"use server"

import { getPublicUrl } from "./get-public-url"

export async function getFileSize(uri: string): Promise<number | null> {
    try {
        const url = await getPublicUrl(uri)
        const res = await fetch(url, { method: "HEAD" })
        const size = res.headers.get("content-length")
        return size ? parseInt(size, 10) : null
    } catch {
        return null
    }
}
