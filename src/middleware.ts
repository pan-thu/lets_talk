import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "~/env";
import { Role } from "@prisma/client";

// This map defines which roles can access which URL path prefixes.
// It enforces a strict, siloed permission model.
const routePermissions: Record<string, Role[]> = {
  "/admin": [Role.ADMIN],
  "/teacher": [Role.TEACHER],
  "/student": [Role.STUDENT],
  // Student-specific top-level routes
  "/dashboard": [Role.STUDENT],
  "/courses": [Role.STUDENT],
  "/support": [Role.STUDENT],
  "/announcements": [Role.STUDENT],
  "/blog": [Role.STUDENT],
  "/calendar": [Role.STUDENT],
  // Teacher-specific routes (these will be handled by the /teacher prefix)
  // Admin-specific routes (these will be handled by the /admin prefix)
};

const publicPaths = ["/auth/signin", "/auth/signup", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public paths and static files
  if (
    publicPaths.some((path) => pathname.startsWith(path)) ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Get the session token
  const token = await getToken({
    req: request,
    secret: env.AUTH_SECRET,
  });

  // 3. If no token, redirect to sign-in
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 4. Enforce role-based access using the declarative map
  const userRole = token.role as Role;
  
  const matchedPath = Object.keys(routePermissions).find((path) =>
    pathname.startsWith(path),
  );

  if (matchedPath) {
    const allowedRoles = routePermissions[matchedPath];
    if (!allowedRoles || !allowedRoles.includes(userRole)) {
      // User is not authorized, redirect to their role's specific dashboard
      const roleDashboard =
        {
          [Role.ADMIN]: "/admin/dashboard",
          [Role.TEACHER]: "/teacher/dashboard",
          [Role.STUDENT]: "/dashboard",
        }[userRole] ?? "/";

      return NextResponse.redirect(new URL(roleDashboard, request.url));
    }
  }

  // 5. If all checks pass, allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
