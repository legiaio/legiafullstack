import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { UserRole } from "@prisma/client"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
    const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth")
    const isPublicApiRoute = req.nextUrl.pathname.startsWith("/api/public")
    
    // Allow auth routes and public API routes
    if (isApiAuthRoute || isPublicApiRoute) {
      return NextResponse.next()
    }

    // Redirect to signin if not authenticated and trying to access protected routes
    if (!isAuth && !isAuthPage) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/auth/signin?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // Redirect authenticated users away from auth pages
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Role-based access control
    const userRole = token?.role as UserRole

    // Admin routes
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (userRole !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Professional routes
    if (req.nextUrl.pathname.startsWith("/professional")) {
      if (userRole !== UserRole.PROFESSIONAL && userRole !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Finance routes
    if (req.nextUrl.pathname.startsWith("/finance")) {
      if (userRole !== UserRole.FINANCE && userRole !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Moderation routes
    if (req.nextUrl.pathname.startsWith("/moderation")) {
      if (userRole !== UserRole.MODERATION && userRole !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // This callback is called for every request
        // Return true to allow the request, false to redirect to signin
        return true // We handle auth logic in the middleware function above
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - api/public (public API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|api/public|_next/static|_next/image|favicon.ico|public).*)",
  ],
}