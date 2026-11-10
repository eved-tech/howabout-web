"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createIdea, voteIdea, checkSimilarIdea } from "@/app/actions";

const CATEGORIES = ["Product", "Service", "Store experience"];

const HEADLINE_MAX = 60;
const BODY_MAX = 240;

export function SubmitForm({ brandSlug, brandName }: { brandSlug: string; brandName: string }) {
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ id: string; headline: string; votes: number } | null>(null);
  const [checkedText, setCheckedText] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [pending, startTransition] = useTransition();
  const checkId = useRef(0);

  const combined = `${headline} ${body}`;
  const tooShortToCheck = combined.trim().length < 8;

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
      const match = await checkSimilarIdea(brandSlug, headline, body);
      if (checkId.current === id) {
        setDuplicate(match);
        setCheckedText(combined);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [combined, headline, body, brandSlug, tooShortToCheck]);

  const showDuplicate = !tooShortToCheck && duplicate;
  const showChecking = !tooShortToCheck && !duplicate && checkedText !== combined;

  function submit(force: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await createIdea({ brandSlug, headline, body, category: category ?? undefined, force });
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
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>Thanks — that&apos;s in.</p>
        <p style={{ margin: "0 0 20px", fontSize: 15, color: "#6b5f55" }}>
          Your idea is live on {brandName}&apos;s page now.
        </p>
        <Link className="hb-link" href={`/brands/${brandSlug}`}>
          Back to {brandName}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {needsAuth && (
        <div className="hb-notice" style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 8px" }}>Sign in to submit an idea — your draft is still here.</p>
          <Link className="hb-link" href={`/auth/sign-in?redirectTo=${encodeURIComponent(`/brands/${brandSlug}/submit`)}`}>
            Sign in or create an account
          </Link>
        </div>
      )}
      <label className="hb-field-label">What should {brandName} do differently? (headline)</label>
      <input
        type="text"
        value={headline}
        maxLength={HEADLINE_MAX}
        onChange={(e) => {
          setHeadline(e.target.value);
          setError(null);
        }}
        placeholder="Sell fresh milk in smaller boxes"
        className="hb-field-input"
      />
      <p className="hb-field-count">{headline.length}/{HEADLINE_MAX}</p>

      <label className="hb-field-label" style={{ marginTop: 16 }}>A bit more detail</label>
      <textarea
        value={body}
        maxLength={BODY_MAX}
        onChange={(e) => {
          setBody(e.target.value);
          setError(null);
        }}
        placeholder="250ml boxes so it doesn't go off before I finish a litre..."
        className="hb-field-textarea"
      />
      <p className="hb-field-count">{body.length}/{BODY_MAX}</p>
      {error && <p className="hb-field-error">{error}</p>}
      {showChecking && <p className="hb-field-count" style={{ textAlign: "left" }}>Checking for similar ideas…</p>}

      {showDuplicate && duplicate && (
        <div className="hb-notice-info" style={{ marginTop: 16 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Similar idea already posted</p>
          <p style={{ margin: "0 0 12px" }}>
            &quot;{duplicate.headline}&quot; · {duplicate.votes} votes
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={upvoteExisting}
              disabled={pending}
              className="hb-btn hb-btn-c hb-btn-s"
            >
              Upvote this instead
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={pending}
              className="hb-link"
              style={{ background: "none", border: "none", font: "inherit", cursor: "pointer" }}
            >
              Submit mine anyway
            </button>
          </div>
        </div>
      )}

      <label className="hb-field-label" style={{ marginTop: 20 }}>Category</label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8, marginBottom: 24 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            className="hb-chip-toggle"
            onClick={() => setCategory(c === category ? null : c)}
          >
            {c}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => submit(false)}
        disabled={pending}
        className="hb-btn hb-btn-o hb-btn-l"
        style={{ opacity: pending ? 0.6 : 1 }}
      >
        {pending ? "Checking…" : "Go on, say it"}
      </button>
    </div>
  );
}
