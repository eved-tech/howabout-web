"use server";

import { auth } from "@/lib/auth/server";

type SignUpState =
  | { error: string }
  | { status: "verify"; email: string; redirectTo: string }
  | null;

export async function signUpWithEmail(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!email || !password || !name) {
    return { error: "Fill in your name, email, and password." };
  }

  const { error } = await auth.signUp.email({ email, name, password });

  if (error) {
    return { error: error.message || "Couldn't create that account." };
  }

  // Email + password sign-up requires verification before a session exists —
  // the account is created, but the person still needs to enter the code
  // Neon just emailed them.
  return { status: "verify", email, redirectTo };
}
