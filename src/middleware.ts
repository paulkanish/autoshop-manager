import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;

  if (!isLoggedIn) {
    // Clone req.nextUrl to safely modify properties without instantiating new URL(string)
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// STRICT Matcher: Only run middleware on protected routes.
// This drastically reduces the Edge Function bundle size.
export const config = {
  matcher: [
    "/admin/:path*",
    "/mechanic/:path*",
    "/owner/:path*",
    "/dashboard/:path*",
  ],
};
