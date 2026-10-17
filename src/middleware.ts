import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "cueclub_staff_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect staff dashboard routes (except /staff/login)
  if (pathname.startsWith("/staff") && !pathname.startsWith("/staff/login")) {
    const sessionCookie = request.cookies.get(COOKIE_NAME);

    // If no session cookie exists, redirect immediately to login
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL("/staff/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*"],
};
