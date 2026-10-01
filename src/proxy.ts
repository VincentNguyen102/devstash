import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Protect the dashboard by redirecting unauthenticated users to the default
// Auth.js sign-in page, preserving the original URL as the callback target.
export const proxy = auth((req) => {
  const { nextUrl } = req;

  if (!req.auth && nextUrl.pathname.startsWith("/dashboard")) {
    const signInUrl = new URL("/api/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.href);

    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
