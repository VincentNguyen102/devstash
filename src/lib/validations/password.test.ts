import { describe, expect, it } from "vitest";

import {
  currentPasswordField,
  passwordField,
  PASSWORD_MIN_LENGTH,
  requiredPasswordField,
  withPasswordConfirmation,
} from "@/lib/validations/password";

describe("passwordField", () => {
  it("rejects passwords shorter than the minimum length", () => {
    const result = passwordField.safeParse("a".repeat(PASSWORD_MIN_LENGTH - 1));

    expect(result.success).toBe(false);
  });

  it("accepts a password at the minimum length", () => {
    const result = passwordField.safeParse("a".repeat(PASSWORD_MIN_LENGTH));

    expect(result.success).toBe(true);
  });
});

describe("requiredPasswordField", () => {
  it("rejects an empty password", () => {
    expect(requiredPasswordField.safeParse("").success).toBe(false);
  });

  it("accepts a short non-empty password (checked against the hash)", () => {
    expect(requiredPasswordField.safeParse("x").success).toBe(true);
  });
});

describe("currentPasswordField", () => {
  it("rejects an empty current password", () => {
    expect(currentPasswordField.safeParse("").success).toBe(false);
  });
});

describe("withPasswordConfirmation", () => {
  const schema = withPasswordConfirmation(
    { password: passwordField },
    "password",
  );

  it("accepts matching passwords", () => {
    const result = schema.safeParse({
      password: "password123",
      confirmPassword: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords and reports it on confirmPassword", () => {
    const result = schema.safeParse({
      password: "password123",
      confirmPassword: "different123",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
      expect(result.error.issues[0]?.message).toBe("Passwords do not match");
    }
  });

  it("supports a custom password key", () => {
    const changeSchema = withPasswordConfirmation(
      { newPassword: passwordField },
      "newPassword",
    );

    const matching = changeSchema.safeParse({
      newPassword: "password123",
      confirmPassword: "password123",
    });
    const mismatched = changeSchema.safeParse({
      newPassword: "password123",
      confirmPassword: "different123",
    });

    expect(matching.success).toBe(true);
    expect(mismatched.success).toBe(false);
  });
});
