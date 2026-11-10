"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { searchBrands } from "@/app/actions";

type BrandResult = {
  slug: string;
  name: string;
  claimed: boolean;
  ideaCount: number;
};

export function BrandSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BrandResult[]>([]);
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);
  const searchId = useRef(0);

  const tooShortToSearch = query.trim().length < 2;
  const searching = !tooShortToSearch && searchedQuery !== query;

  useEffect(() => {
    searchId.current++;
    if (tooShortToSearch) return;

    const id = searchId.current;
    const timer = setTimeout(async () => {
      const matches = await searchBrands(query);
      if (searchId.current === id) {
        setResults(matches);
        setSearchedQuery(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, tooShortToSearch]);

  const showResults = !tooShortToSearch && !searching;

  return (
    <div>
      <label htmlFor="brand-search" className="hb-field-label">
        Which business or brand?
      </label>
      <input
        id="brand-search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Start typing a brand name…"
        className="hb-field-input"
        autoComplete="off"
      />

      {searching && <p className="hb-field-count" style={{ textAlign: "left" }}>Searching…</p>}

      {showResults && results.length > 0 && (
        <div
          style={{
            marginTop: 20,
            border: "2.5px solid var(--hb-ink)",
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          {results.map((brand) => (
            <Link key={brand.slug} href={`/brands/${brand.slug}/submit`} className="hb-result-row">
              <span style={{ fontWeight: 700, fontSize: 16 }}>{brand.name}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#6b5f55" }}>
                {brand.claimed ? "Claimed" : "Not claimed"} · {brand.ideaCount}{" "}
                {brand.ideaCount === 1 ? "idea" : "ideas"}
              </span>
            </Link>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ margin: "0 0 10px", fontSize: 15 }}>
            Can&apos;t find &quot;{query}&quot; on How about yet.
          </p>
          <Link className="hb-link" href={`/submit/new?name=${encodeURIComponent(query.trim())}`}>
            Add &quot;{query.trim()}&quot; and submit your idea
          </Link>
        </div>
      )}
    </div>
  );
}
