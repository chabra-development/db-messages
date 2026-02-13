import { type NextRequest, NextResponse } from "next/server"
import { auth } from "./lib/auth"

export async function proxy(request: NextRequest) {
  
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ["/sign-in", "/sign-up"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Se for rota pública, permite acesso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Se não houver sessão, redireciona para login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Se for a raiz e tiver sessão, redireciona para contacts
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/contacts", request.url))
  }

  // Para outras rotas autenticadas, permite acesso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}