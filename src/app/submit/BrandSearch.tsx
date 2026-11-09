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
      <label htmlFor="brand-search" className="block text-xs text-neutral-500 mb-1">
        Which business or brand?
      </label>
      <input
        id="brand-search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Start typing a brand name…"
        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
        autoComplete="off"
      />

      {searching && (
        <p className="text-xs text-neutral-400 mt-2">Searching…</p>
      )}

      {showResults && results.length > 0 && (
        <div className="mt-3 border border-neutral-200 rounded-lg divide-y divide-neutral-200">
          {results.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}/submit`}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-neutral-50"
            >
              <span className="text-sm font-medium">{brand.name}</span>
              <span className="text-xs text-neutral-500">
                {brand.claimed ? "Claimed" : "Not claimed"} · {brand.ideaCount}{" "}
                {brand.ideaCount === 1 ? "idea" : "ideas"}
              </span>
            </Link>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && (
        <p className="text-sm text-neutral-500 mt-3">
          Can&apos;t find &quot;{query}&quot; — adding new brands isn&apos;t open yet, but
          it&apos;s coming soon.
        </p>
      )}
    </div>
  );
}
