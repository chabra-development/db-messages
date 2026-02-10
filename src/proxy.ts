import  { type NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL("/contacts", request.url))
}

export const config = {
  matcher: "/",
}