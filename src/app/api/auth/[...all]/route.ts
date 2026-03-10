import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { NextRequest, NextResponse } from "next/server"

const handler = toNextJsHandler(auth)

const CORS_HEADERS = {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
}

function isExtensionOrigin(origin: string | null) {
    return origin?.startsWith("chrome-extension://") ?? false
}

function withCors(res: Response, origin: string): Response {
    const headers = new Headers(res.headers)
    headers.set("Access-Control-Allow-Origin", origin)
    Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v))
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}

export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get("origin") ?? ""
    if (!isExtensionOrigin(origin)) return new NextResponse(null, { status: 204 })

    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": origin,
            ...CORS_HEADERS,
            "Access-Control-Max-Age": "86400",
        },
    })
}

export async function GET(req: NextRequest) {
    const origin = req.headers.get("origin") ?? ""
    const res = await handler.GET(req)
    return isExtensionOrigin(origin) ? withCors(res, origin) : res
}

export async function POST(req: NextRequest) {
    const origin = req.headers.get("origin") ?? ""
    const res = await handler.POST(req)
    return isExtensionOrigin(origin) ? withCors(res, origin) : res
}
