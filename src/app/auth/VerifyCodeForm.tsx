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
      <p style={{ margin: "0 0 20px", fontSize: 15, lineHeight: 1.5 }}>
        We&apos;ve sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your email.
      </p>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <label htmlFor="otp" className="hb-field-label">
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
            className="hb-field-input"
            style={{ letterSpacing: "0.3em", fontSize: 20, textAlign: "center" }}
          />
        </div>
        {state?.error && <p className="hb-field-error">{state.error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="hb-btn hb-btn-o hb-btn-l"
          style={{ opacity: isPending ? 0.6 : 1, marginTop: 4 }}
        >
          {isPending ? "Verifying…" : "Verify email"}
        </button>
      </form>
      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="hb-auth-link"
        style={{ background: "none", border: "none", padding: 0, marginTop: 16, font: "inherit", cursor: "pointer", opacity: resending ? 0.6 : 1 }}
      >
        {resending ? "Sending…" : resent ? "Code resent — check your email" : "Resend code"}
      </button>
    </div>
  );
}
