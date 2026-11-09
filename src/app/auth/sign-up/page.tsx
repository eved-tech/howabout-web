"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUpWithEmail } from "./actions";
import { VerifyCodeForm } from "../VerifyCodeForm";

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
      <main className="mx-auto max-w-sm w-full px-4 py-16">
        <h1 className="font-medium text-lg mb-6">Verify your email</h1>
        <VerifyCodeForm email={state.email} redirectTo={state.redirectTo} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm w-full px-4 py-16">
      <h1 className="font-medium text-lg mb-6">Create your account</h1>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <label htmlFor="name" className="block text-xs text-neutral-500 mb-1">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-xs text-neutral-500 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs text-neutral-500 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50 mt-2"
        >
          {isPending ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-neutral-500 mt-4">
        Already have an account?{" "}
        <Link href={`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`} className="underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
