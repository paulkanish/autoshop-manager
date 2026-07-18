import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");

  // 1. If it's an API route, let it pass through. 
  // The API route itself will check auth and return a 401 JSON if needed.
  if (isApiRoute) {
    return NextResponse.next();
  }

  // 2. If not logged in and not on the login page, redirect to login
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

// 3. Configure the middleware to run on all paths except static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
