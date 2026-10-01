import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

// The matcher below limits this proxy to the authenticated area, so any request
// that reaches here without a session is redirected to the custom sign-in page.
export const proxy = auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);

    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/collections/:path*",
    "/items/:path*",
    "/profile",
  ],
};
