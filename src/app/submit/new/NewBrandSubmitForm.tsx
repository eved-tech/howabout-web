"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createBrandAndIdea } from "@/app/actions";

const CATEGORIES = ["Product", "Service", "Store experience"];

export function NewBrandSubmitForm({ brandName }: { brandName: string }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createBrandAndIdea({ name: brandName, text, category: category ?? undefined });
      if (result.status === "error") {
        setError(result.message);
      } else if (result.status === "unauthenticated") {
        setNeedsAuth(true);
      } else {
        setDone(true);
      }
    });
  }

  if (done) {
    return (
      <div className="text-center py-10">
        <p className="text-green-700 font-medium mb-2">
          We don&apos;t have {brandName} yet, so your idea is in review.
        </p>
        <p className="text-sm text-neutral-500 mb-4">
          Once {brandName} is approved, your idea will be the first one on its
          page.
        </p>
        <Link href="/submit" className="text-sm underline">
          Submit another idea
        </Link>
      </div>
    );
  }

  return (
    <div>
      {needsAuth && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm mb-2">Sign in to submit an idea — your draft is still here.</p>
          <Link
            href={`/auth/sign-in?redirectTo=${encodeURIComponent(`/submit/new?name=${encodeURIComponent(brandName)}`)}`}
            className="text-sm underline"
          >
            Sign in or create an account
          </Link>
        </div>
      )}
      <label className="block text-xs text-neutral-500 mb-1">
        What should {brandName} do differently?
      </label>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        placeholder="Sell fresh milk in 250ml boxes for..."
        className="w-full min-h-[90px] border border-neutral-300 rounded-md px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      <label className="block text-xs text-neutral-500 mt-4 mb-1.5">Category</label>
      <div className="flex gap-2 flex-wrap mb-5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c === category ? null : c)}
            className={`text-sm px-3 py-1.5 rounded-md border ${
              category === c
                ? "bg-neutral-100 border-neutral-300"
                : "border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={pending}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Go on, say it"}
      </button>
    </div>
  );
}
