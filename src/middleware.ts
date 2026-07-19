import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // 1. Lightweight token check (does NOT import heavy Prisma/Auth config)
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  const isLoggedIn = !!token;

  // 2. If not logged in, redirect to login page
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    // Optional: remember where they were trying to go
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 3. STRICT Matcher: Only run middleware on protected routes.
// This drastically reduces the Edge Function bundle size.
export const config = {
  matcher: [
    "/admin/:path*",
    "/mechanic/:path*",
    "/owner/:path*",
    "/dashboard/:path*",
  ],
};
