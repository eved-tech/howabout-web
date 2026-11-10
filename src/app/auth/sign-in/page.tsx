"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInWithEmail } from "./actions";
import { VerifyCodeForm } from "../VerifyCodeForm";
import { AuthShell } from "../AuthShell";

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const [state, formAction, isPending] = useActionState(signInWithEmail, null);
  const redirectTo = useSearchParams().get("redirectTo") ?? "/";

  if (state && "status" in state && state.status === "verify") {
    return (
      <AuthShell title="Verify your email">
        <VerifyCodeForm email={state.email} redirectTo={state.redirectTo} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Welcome back">
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
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
          <input id="password" name="password" type="password" required className="hb-field-input" />
        </div>
        {state && "error" in state && <p className="hb-field-error">{state.error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="hb-btn hb-btn-o hb-btn-l"
          style={{ opacity: isPending ? 0.6 : 1, marginTop: 4 }}
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p style={{ marginTop: 24, fontSize: 15 }}>
        No account yet?{" "}
        <Link className="hb-auth-link" href={`/auth/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`}>
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
