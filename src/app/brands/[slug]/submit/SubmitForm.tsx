"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createIdea, voteIdea, checkSimilarIdea } from "@/app/actions";

const CATEGORIES = ["Product", "Service", "Store experience"];

export function SubmitForm({ brandSlug, brandName }: { brandSlug: string; brandName: string }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ id: string; text: string; votes: number } | null>(null);
  const [checkedText, setCheckedText] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [pending, startTransition] = useTransition();
  const checkId = useRef(0);

  const tooShortToCheck = text.trim().length < 8;

  // Live dedupe-as-you-type: debounced so we're not hitting the server on
  // every keystroke, and guarded against out-of-order responses. "Checking"
  // is derived (checkedText lags text) rather than its own state, since
  // setState belongs in the timeout's callback, not synchronously in the
  // effect body.
  useEffect(() => {
    checkId.current++;
    if (tooShortToCheck) return;

    const id = checkId.current;
    const timer = setTimeout(async () => {
      const match = await checkSimilarIdea(brandSlug, text);
      if (checkId.current === id) {
        setDuplicate(match);
        setCheckedText(text);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [text, brandSlug, tooShortToCheck]);

  const showDuplicate = !tooShortToCheck && duplicate;
  const showChecking = !tooShortToCheck && !duplicate && checkedText !== text;

  function submit(force: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await createIdea({ brandSlug, text, category: category ?? undefined, force });
      if (result.status === "error") {
        setError(result.message);
      } else if (result.status === "duplicate") {
        setDuplicate(result.match);
      } else if (result.status === "unauthenticated") {
        setNeedsAuth(true);
      } else {
        setDuplicate(null);
        setDone(true);
      }
    });
  }

  function upvoteExisting() {
    if (!duplicate) return;
    startTransition(async () => {
      await voteIdea(duplicate.id, brandSlug);
      setDone(true);
      setDuplicate(null);
    });
  }

  if (done) {
    return (
      <div className="text-center py-10">
        <p className="text-green-700 font-medium mb-2">Thanks — that&apos;s in.</p>
        <p className="text-sm text-neutral-500 mb-4">
          Your idea is pending moderation before it appears on {brandName}&apos;s page.
        </p>
        <Link href={`/brands/${brandSlug}`} className="text-sm underline">
          Back to {brandName}
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
            href={`/auth/sign-in?redirectTo=${encodeURIComponent(`/brands/${brandSlug}/submit`)}`}
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
      {showChecking && (
        <p className="text-xs text-neutral-400 mt-1">Checking for similar ideas…</p>
      )}

      {showDuplicate && duplicate && (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-800 mb-1.5">
            Similar idea already posted
          </p>
          <p className="text-sm mb-2">
            &quot;{duplicate.text}&quot; · {duplicate.votes} votes
          </p>
          <div className="flex gap-2">
            <button
              onClick={upvoteExisting}
              disabled={pending}
              className="text-sm border border-neutral-300 rounded-md px-3 py-1.5 hover:bg-neutral-50"
            >
              Upvote this instead
            </button>
            <button
              onClick={() => submit(true)}
              disabled={pending}
              className="text-sm text-neutral-500 px-3 py-1.5 hover:underline"
            >
              Submit mine anyway
            </button>
          </div>
        </div>
      )}

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
        onClick={() => submit(false)}
        disabled={pending}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Checking…" : "Go on, say it"}
      </button>
    </div>
  );
}
