import { z } from "zod";

/**
 * Shared password validation.
 *
 * Every place that accepts a password should build its schema from these
 * building blocks so the policy lives in exactly one place. The module is
 * intentionally free of framework/DB imports so it can be used by edge code
 * (e.g. the auth config) as well as server actions and route handlers.
 */

/** Minimum length required for any new password. */
export const PASSWORD_MIN_LENGTH = 8;

const PASSWORD_MIN_LENGTH_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
const PASSWORD_REQUIRED_MESSAGE = "Password is required";
const PASSWORDS_DO_NOT_MATCH_MESSAGE = "Passwords do not match";

/**
 * A new password the user is setting (register, reset, change). Enforces the
 * shared password policy.
 */
export const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE);

/**
 * A password the user is only proving they know (e.g. sign-in). Length is not
 * enforced here because it is checked against the stored hash instead.
 */
export const requiredPasswordField = z
  .string()
  .min(1, PASSWORD_REQUIRED_MESSAGE);

/** The current password on the change-password form. */
export const currentPasswordField = z
  .string()
  .min(1, "Enter your current password");

/**
 * Wraps an object shape with a `confirmPassword` field and verifies it matches
 * the password field.
 *
 * @param shape       The base fields (must contain `passwordKey`).
 * @param passwordKey Key of the password field, e.g. `"password"` or
 *                    `"newPassword"`.
 */
export function withPasswordConfirmation<TShape extends z.ZodRawShape>(
  shape: TShape,
  passwordKey: keyof TShape & string,
) {
  return z
    .object({ ...shape, confirmPassword: z.string() })
    .refine(
      (data) => {
        const values = data as Record<string, unknown>;
        return values[passwordKey] === values.confirmPassword;
      },
      { message: PASSWORDS_DO_NOT_MATCH_MESSAGE, path: ["confirmPassword"] },
    );
}
