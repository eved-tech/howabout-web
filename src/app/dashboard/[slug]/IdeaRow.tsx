"use client";

import { useState, useTransition } from "react";
import { respondToIdea } from "@/app/actions";
import { StatusBadge } from "@/components/StatusBadge";

type Status = "PLANNED" | "RESPONDED" | "DECLINED";

export function IdeaRow({
  idea,
  brandSlug,
  startExpanded = false,
}: {
  idea: { id: string; text: string; status: string; votes: number; response: string | null };
  brandSlug: string;
  startExpanded?: boolean;
}) {
  const [open, setOpen] = useState(startExpanded);
  const [response, setResponse] = useState(idea.response ?? "");
  const [status, setStatus] = useState<Status>(
    idea.status === "PLANNED" || idea.status === "RESPONDED" || idea.status === "DECLINED"
      ? idea.status
      : "RESPONDED"
  );
  const [pending, startTransition] = useTransition();

  function post() {
    startTransition(async () => {
      await respondToIdea({ ideaId: idea.id, brandSlug, response, status });
      setOpen(false);
    });
  }

  return (
    <div className="border-b border-neutral-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 py-3 text-left hover:bg-neutral-50"
      >
        <div className="flex flex-col items-center min-w-[40px]">
          <span aria-hidden className="text-blue-700">▲</span>
          <span className="text-sm font-medium">{idea.votes}</span>
        </div>
        <span className="flex-1 text-sm truncate">{idea.text}</span>
        <StatusBadge status={idea.status} />
      </button>

      {open && (
        <div className="bg-neutral-50 rounded-lg p-3 mb-4">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write a response to this idea..."
            className="w-full min-h-[60px] border border-neutral-300 rounded-md px-3 py-2 text-sm mb-2 bg-white"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="text-sm border border-neutral-300 rounded-md px-2 py-1.5 bg-white"
            >
              <option value="PLANNED">Mark as: planned</option>
              <option value="RESPONDED">Mark as: responded</option>
              <option value="DECLINED">Mark as: declined</option>
            </select>
            <button
              onClick={post}
              disabled={pending}
              className="ml-auto bg-neutral-900 text-white text-sm rounded-md px-3 py-1.5 disabled:opacity-50"
            >
              {pending ? "Posting…" : "Post response"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
