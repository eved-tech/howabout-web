"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInWithEmail } from "./actions";

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

  return (
    <main className="mx-auto max-w-sm w-full px-4 py-16">
      <h1 className="font-medium text-lg mb-6">Sign in</h1>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="redirectTo" value={redirectTo} />
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
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50 mt-2"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-neutral-500 mt-4">
        No account yet?{" "}
        <Link href={`/auth/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`} className="underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
