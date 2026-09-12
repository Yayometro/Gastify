import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// A fast, cookie-presence-only redirect - NOT a verified session check (see
// Better Auth's own docs: this can be spoofed). Every dashboard page.jsx
// still does its own real `auth.api.getSession()` check, exactly like it
// did with NextAuth's own `getServerSession()` before - this middleware is
// only here to bounce an obviously-logged-out visitor before the page even
// renders, same as the old `next-auth/middleware` default export did.
export function middleware(request) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
