import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "~/env";
import { Role } from "@prisma/client";

const publicPaths = ["/auth/signin", "/auth/signup", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path)) || 
                      pathname.includes(".");
  
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check authentication
  const token = await getToken({
    req: request,
    secret: env.AUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Role-based access control
  const userRole = token.role as Role;
  const redirectUrl = new URL("/dashboard", request.url);

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (userRole !== Role.ADMIN) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Teacher routes
  if (pathname.startsWith("/teacher")) {
    if (userRole !== Role.TEACHER && userRole !== Role.ADMIN) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Student routes
  if (pathname.startsWith("/dashboard") || /^\/courses\/\d+/.test(pathname)) {
    if (userRole !== Role.STUDENT) {
      const roleHome = userRole === Role.ADMIN ? "/admin/dashboard" : "/teacher/dashboard";
      return NextResponse.redirect(new URL(roleHome, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
