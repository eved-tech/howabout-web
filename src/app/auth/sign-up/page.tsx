"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUpWithEmail } from "./actions";
import { VerifyCodeForm } from "../VerifyCodeForm";
import { AuthShell } from "../AuthShell";

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, null);
  const redirectTo = useSearchParams().get("redirectTo") ?? "/";

  if (state && "status" in state && state.status === "verify") {
    return (
      <AuthShell title="Verify your email">
        <VerifyCodeForm email={state.email} redirectTo={state.redirectTo} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Join How about">
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <label htmlFor="name" className="hb-field-label">
            Name
          </label>
          <input id="name" name="name" type="text" required className="hb-field-input" />
        </div>
        <div>
          <label htmlFor="email" className="hb-field-label">
            Email
          </label>
          <input id="email" name="email" type="email" required className="hb-field-input" />
        </div>
        <div>
          <label htmlFor="password" className="hb-field-label">
            Password
          </label>
          <input id="password" name="password" type="password" required minLength={8} className="hb-field-input" />
        </div>
        {state && "error" in state && <p className="hb-field-error">{state.error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="hb-btn hb-btn-o hb-btn-l"
          style={{ opacity: isPending ? 0.6 : 1, marginTop: 4 }}
        >
          {isPending ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p style={{ marginTop: 24, fontSize: 15 }}>
        Already have an account?{" "}
        <Link className="hb-auth-link" href={`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
