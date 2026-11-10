"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createBrandAndIdea } from "@/app/actions";

const CATEGORIES = ["Product", "Service", "Store experience"];
const HEADLINE_MAX = 60;
const BODY_MAX = 240;

export function NewBrandSubmitForm({ brandName }: { brandName: string }) {
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createBrandAndIdea({ name: brandName, headline, body, category: category ?? undefined });
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
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
          We don&apos;t have {brandName} yet, so your idea is in review.
        </p>
        <p style={{ margin: "0 0 20px", fontSize: 15, color: "#6b5f55" }}>
          Once {brandName} is approved, your idea will be the first one on its page.
        </p>
        <Link className="hb-link" href="/submit">
          Submit another idea
        </Link>
      </div>
    );
  }

  return (
    <div>
      {needsAuth && (
        <div className="hb-notice" style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 8px" }}>Sign in to submit an idea — your draft is still here.</p>
          <Link
            className="hb-link"
            href={`/auth/sign-in?redirectTo=${encodeURIComponent(`/submit/new?name=${encodeURIComponent(brandName)}`)}`}
          >
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
        onClick={submit}
        disabled={pending}
        className="hb-btn hb-btn-o hb-btn-l"
        style={{ opacity: pending ? 0.6 : 1 }}
      >
        {pending ? "Submitting…" : "Go on, say it"}
      </button>
    </div>
  );
}
