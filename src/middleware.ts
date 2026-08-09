import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const pathname = req.nextUrl.pathname;

  // Unauthenticated → login (preserve intended destination)
  if (!isLoggedIn) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const toDashboard = () => {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  };

  // Role-gated top-level sections (PRD §2 / RBAC documentation)
  if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
    return toDashboard();
  }
  if (
    pathname.startsWith("/mechanic") &&
    userRole !== "MECHANIC" &&
    userRole !== "ADMIN"
  ) {
    return toDashboard();
  }
  if (
    pathname.startsWith("/owner") &&
    userRole !== "OWNER" &&
    userRole !== "ADMIN"
  ) {
    return toDashboard();
  }

  // Admin/Owner-only dashboard pages (PRD §2: intake & billing)
  const adminOnlyDashboard = ["/dashboard/walkin", "/dashboard/billing"];
  if (
    userRole !== "ADMIN" &&
    userRole !== "OWNER" &&
    adminOnlyDashboard.some((p) => pathname.startsWith(p))
  ) {
    return toDashboard();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/mechanic/:path*",
    "/owner/:path*",
    "/dashboard/:path*",
  ],
};
