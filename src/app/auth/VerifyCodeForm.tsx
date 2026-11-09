"use client";

import { useActionState, useState, useTransition } from "react";
import { verifyEmailOtp, resendVerificationOtp } from "./actions";

export function VerifyCodeForm({ email, redirectTo }: { email: string; redirectTo: string }) {
  const [state, formAction, isPending] = useActionState(verifyEmailOtp, null);
  const [resent, setResent] = useState(false);
  const [resending, startTransition] = useTransition();

  function resend() {
    startTransition(async () => {
      await resendVerificationOtp(email);
      setResent(true);
    });
  }

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-4">
        We&apos;ve sent a 6-digit code to{" "}
        <span className="font-medium text-neutral-900">{email}</span>. Enter it
        below to verify your email.
      </p>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <label htmlFor="otp" className="block text-xs text-neutral-500 mb-1">
            Verification code
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm tracking-widest"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50 mt-2"
        >
          {isPending ? "Verifying…" : "Verify email"}
        </button>
      </form>
      <button
        onClick={resend}
        disabled={resending}
        className="text-sm underline mt-3 disabled:opacity-50"
      >
        {resending ? "Sending…" : resent ? "Code resent — check your email" : "Resend code"}
      </button>
    </div>
  );
}
