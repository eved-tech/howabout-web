"use client";

import { useState, useTransition } from "react";
import { moderateIdea } from "@/app/actions";

export function ModerationRow({
  idea,
}: {
  idea: { id: string; headline: string; body: string; brandName: string; reported: boolean };
}) {
  const [ruled, setRuled] = useState(false);
  const [pending, startTransition] = useTransition();

  function rule(status: "CLEAR" | "COMPLAINT") {
    startTransition(async () => {
      await moderateIdea(idea.id, status);
      setRuled(true);
    });
  }

  if (ruled) return null;

  return (
    <div className="py-3 border-b border-neutral-200">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-neutral-400">{idea.brandName}</span>
        {idea.reported && (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
            Reported
          </span>
        )}
      </div>
      <p className="text-sm font-medium mb-1">{idea.headline}</p>
      <p className="text-sm text-neutral-600 mb-2">{idea.body}</p>
      <div className="flex gap-2">
        <button
          onClick={() => rule("CLEAR")}
          disabled={pending}
          className="text-sm border border-neutral-300 rounded-md px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-50"
        >
          Mark clear
        </button>
        <button
          onClick={() => rule("COMPLAINT")}
          disabled={pending}
          className="text-sm border border-neutral-300 rounded-md px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-50"
        >
          Mark complaint
        </button>
      </div>
    </div>
  );
}
