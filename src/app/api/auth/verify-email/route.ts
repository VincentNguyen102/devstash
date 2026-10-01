import { NextResponse } from "next/server";

import { verifyEmailToken } from "@/lib/email-verification";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?status=invalid", origin));
  }

  try {
    const { status, email } = await verifyEmailToken(token);
    const redirectUrl = new URL(`/verify-email?status=${status}`, origin);

    if (email) {
      redirectUrl.searchParams.set("email", email);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Email verification failed", error);

    return NextResponse.redirect(new URL("/verify-email?status=error", origin));
  }
}
