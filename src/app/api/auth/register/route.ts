import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sendVerificationEmail } from "@/lib/email";
import {
  buildVerificationUrl,
  createEmailVerificationToken,
  isEmailVerificationEnabled,
} from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid input",
        },
        { status: 400 },
      );
    }

    const { name, password } = parsed.data;
    const email = parsed.data.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await hash(password, 12);
    const verificationEnabled = isEmailVerificationEnabled();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // When verification is disabled the account is immediately usable. It
        // stays consistent if verification is re-enabled later.
        emailVerified: verificationEnabled ? null : new Date(),
      },
    });

    if (verificationEnabled) {
      // Send the verification email. A delivery failure should not roll back
      // the account — the user can request a new link from the check-email page.
      try {
        const token = await createEmailVerificationToken(email);
        await sendVerificationEmail({
          to: email,
          name: user.name,
          url: buildVerificationUrl(token),
        });
      } catch (error) {
        console.error("Failed to send verification email", error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration failed", error);

    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
