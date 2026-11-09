"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export async function signOut(formData: FormData) {
  await auth.signOut();
  redirect((formData.get("redirectTo") as string) || "/");
}

// The email-otp client plugin's types don't resolve through Neon's generic
// server wrapper (collapses to `unknown`), even though the methods exist at
// runtime — narrow it by hand to what we actually call.
const emailOtp = auth.emailOtp as {
  verifyEmail(args: { email: string; otp: string }): Promise<{
    error: { message?: string } | null;
  }>;
  sendVerificationOtp(args: {
    email: string;
    type: "email-verification";
  }): Promise<{ error: { message?: string } | null }>;
};

export async function verifyEmailOtp(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const otp = formData.get("otp") as string;

  if (!otp) {
    return { error: "Enter the code from your email." };
  }

  const { error } = await emailOtp.verifyEmail({ email, otp });

  if (error) {
    return { error: error.message || "That code didn't work — check it and try again." };
  }

  redirect((formData.get("redirectTo") as string) || "/");
}

export async function resendVerificationOtp(email: string) {
  await emailOtp.sendVerificationOtp({ email, type: "email-verification" });
}
