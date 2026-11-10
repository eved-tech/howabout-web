"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { toggleCheer, reportIdea } from "./actions";
import { colorFor, initialFor } from "@/lib/palette";

export type IdeaVM = {
  id: string;
  headline: string;
  body: string;
  category: string | null;
  brandName: string;
  brandSlug: string;
  brandClaimed: boolean;
  responded: boolean;
  authorName: string;
  votes: number;
  voted: boolean;
  commentsCount: number;
  reportable: boolean;
  reported: boolean;
};

export type IdeaOrders = {
  latest: string[];
  popular: string[];
  comments: string[];
  growing: string[];
  cheering: string[];
};

const TABS: { key: keyof IdeaOrders; label: string }[] = [
  { key: "latest", label: "Latest" },
  { key: "popular", label: "Most popular" },
  { key: "comments", label: "Most comments" },
  { key: "growing", label: "Growing" },
  { key: "cheering", label: "Ideas you are cheering" },
];

const PAGE_SIZE = 6;

function formatVotes(n: number) {
  return n.toLocaleString("en-US").replace(/,/g, " ");
}

export function IdeaFeed({ ideas, orders, signedIn }: { ideas: IdeaVM[]; orders: IdeaOrders; signedIn: boolean }) {
  const [tab, setTab] = useState<keyof IdeaOrders>("popular");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [optimisticIdeas, cheerOptimistically] = useOptimistic(
    ideas,
    (state, ideaId: string) =>
      state.map((idea) =>
        idea.id === ideaId
          ? { ...idea, voted: !idea.voted, votes: idea.votes + (idea.voted ? -1 : 1) }
          : idea
      )
  );
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  const byId = useMemo(() => new Map(optimisticIdeas.map((idea) => [idea.id, idea])), [optimisticIdeas]);

  const q = query.trim().toLowerCase();
  const filtered = orders[tab]
    .map((id) => byId.get(id))
    .filter((idea): idea is IdeaVM => !!idea)
    .filter(
      (idea) =>
        !q ||
        idea.headline.toLowerCase().includes(q) ||
        idea.body.toLowerCase().includes(q) ||
        idea.brandName.toLowerCase().includes(q)
    );

  const visible = filtered.slice(0, visibleCount);

  function cheer(ideaId: string) {
    startTransition(async () => {
      cheerOptimistically(ideaId);
      await toggleCheer(ideaId);
    });
  }

  function report(ideaId: string) {
    setReportedIds((prev) => new Set(prev).add(ideaId));
    startTransition(async () => {
      await reportIdea(ideaId);
    });
  }

  // Ideas don't have their own page yet, so the closest shareable link is
  // the brand page — see the "Up next" item in the feature wish-list doc.
  async function share(idea: IdeaVM) {
    const url = `${window.location.origin}/brands/${idea.brandSlug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: idea.headline, url });
        return;
      } catch {
        // user cancelled the share sheet — fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId((id) => (id === idea.id ? null : id)), 2000);
  }

  return (
    <div>
      <div
        style={{
          marginTop: 32,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px 24px",
          borderBottom: "2px solid var(--hb-ink)",
        }}
      >
        <div className="hb-tabs" role="tablist" aria-label="Sort ideas">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              className="hb-tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="hb-searchwrap">
          <label className="hb-sr" htmlFor="idea-search">
            Search ideas
          </label>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#1F1A17" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <circle cx="9.5" cy="9.5" r="6.5" />
            <path d="M14.5 14.5 19 19" />
          </svg>
          <input
            id="idea-search"
            type="search"
            placeholder="Search ideas or brands"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {visible.map((idea, i) => (
          <article className="hb-row" key={idea.id}>
            <div className="hb-row-vote" role="group" aria-label="Cheer on this idea">
              <div className="hb-countbox">
                <div className="hb-num">{formatVotes(idea.votes)}</div>
                <div className="hb-lbl">votes</div>
              </div>
              <div className="hb-btns">
                <button
                  type="button"
                  className={`hb-upbtn ${i < 3 ? "hb-up-dark" : ""}`}
                  aria-pressed={idea.voted}
                  onClick={() => cheer(idea.id)}
                >
                  {idea.voted ? (
                    <span aria-hidden="true">🙌</span>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M10 16V4M4.5 9.5 10 4l5.5 5.5" />
                    </svg>
                  )}
                  {idea.voted ? "Cheered" : "Cheer on"}
                </button>
              </div>
            </div>
            <div className="hb-row-div" aria-hidden="true"></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, flexGrow: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px 14px" }}>
                <Link href={`/brands/${idea.brandSlug}`} className="hb-chip hb-chip-ph" style={{ textDecoration: "none" }}>
                  <span className="hb-initial" style={{ background: colorFor(idea.brandName) }} aria-hidden="true">
                    {initialFor(idea.brandName)}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{idea.brandName}</span>
                  {idea.brandClaimed && (
                    <span title="Claimed by this brand" aria-label="Claimed by this brand">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="#2563eb" aria-hidden="true">
                        <circle cx="10" cy="10" r="10" />
                        <path d="M6 10.2l2.4 2.4L14 7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </Link>
                <span
                  title={idea.responded ? `${idea.brandName} has responded` : "No response yet"}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: idea.responded ? "#166534" : "#9a9086" }}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 5.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2v-6z" />
                  </svg>
                  {idea.responded ? "Responded" : "No response yet"}
                </span>
              </div>
              <h3
                className="hb-heading"
                style={{ margin: 0, fontWeight: 600, fontSize: "clamp(28px, 3.4vw, 40px)", lineHeight: 1.1, letterSpacing: "-0.01em" }}
              >
                {idea.headline}
              </h3>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.45, color: "#3A322C" }}>{idea.body}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px 14px", flexWrap: "wrap", fontSize: 16, color: "#3A322C" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <span
                    className="hb-initial"
                    style={{ background: colorFor(idea.authorName), width: 32, height: 32 }}
                    aria-hidden="true"
                  >
                    {initialFor(idea.authorName)}
                  </span>
                  <span>
                    Suggested by <strong>{idea.authorName}</strong>
                  </span>
                </span>
                <span aria-hidden="true">•</span>
                <span>Comments: {idea.commentsCount}</span>
                <span aria-hidden="true">•</span>
                <button
                  type="button"
                  onClick={() => share(idea)}
                  style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", textDecoration: "underline", cursor: "pointer" }}
                >
                  {copiedId === idea.id ? "Link copied!" : "Share"}
                </button>
                {idea.reportable && (
                  <>
                    <span aria-hidden="true">•</span>
                    {idea.reported || reportedIds.has(idea.id) ? (
                      <span>Reported — awaiting review</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => report(idea.id)}
                        style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", textDecoration: "underline", cursor: "pointer" }}
                      >
                        Report as complaint
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {tab === "cheering" && !signedIn ? (
        <p style={{ margin: 0, padding: "48px 0", fontSize: 20, fontWeight: 700, textAlign: "center" }}>
          <Link href="/auth/sign-in" style={{ textDecoration: "underline" }}>Sign in</Link> to see the ideas you&apos;re cheering.
        </p>
      ) : (
        filtered.length === 0 && (
          <p style={{ margin: 0, padding: "48px 0", fontSize: 20, fontWeight: 700, textAlign: "center" }}>
            {tab === "cheering"
              ? "You haven't cheered any ideas yet."
              : "No ideas match that search yet. How about submitting one?"}
          </p>
        )
      )}

      {visibleCount < filtered.length && (
        <div style={{ marginTop: 56, display: "flex", justifyContent: "center" }}>
          <button type="button" className="hb-btn hb-btn-o hb-btn-xl" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            See every idea
          </button>
        </div>
      )}
    </div>
  );
}
