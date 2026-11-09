"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

type SignInState =
  | { error: string }
  | { status: "verify"; email: string; redirectTo: string }
  | null;

export async function signInWithEmail(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = formData.get("email") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  const { error } = await auth.signIn.email({
    email,
    password: formData.get("password") as string,
  });

  if (error) {
    const code = (error as { code?: string }).code;
    const message = error.message?.toLowerCase() ?? "";
    if (code === "email_not_confirmed" || message.includes("verification required")) {
      // Neon just emailed a fresh code (send-on-sign-in is on) — let them finish verifying here.
      return { status: "verify", email, redirectTo };
    }
    return { error: error.message || "Couldn't sign in. Check your email and password." };
  }

  redirect(redirectTo);
}
