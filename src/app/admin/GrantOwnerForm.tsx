"use client";

import { useState, useTransition } from "react";
import { grantBrandOwnership } from "@/app/actions";

export function GrantOwnerForm({ brandSlug }: { brandSlug: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await grantBrandOwnership(brandSlug, email);
      if (result.status === "error") {
        setMessage(result.message);
      } else {
        setMessage("Access granted.");
        setEmail("");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="brand-contact@example.com"
        className="flex-1 border border-neutral-300 rounded-md px-2 py-1.5 text-sm"
      />
      <button
        onClick={submit}
        disabled={pending || !email.trim()}
        className="text-sm border border-neutral-300 rounded-md px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? "Granting…" : "Grant access"}
      </button>
      {message && <span className="text-xs text-neutral-500">{message}</span>}
    </div>
  );
}
