import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { listModerationQueue } from "@/app/actions";
import { ModerationRow } from "./ModerationRow";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect(`/auth/sign-in?redirectTo=${encodeURIComponent("/admin/moderation")}`);
  }
  if (session.user.email !== process.env.ADMIN_EMAIL) {
    return (
      <main className="mx-auto max-w-xl w-full px-4 py-16 text-center">
        <p className="text-sm text-neutral-500">You don&apos;t have access to this page.</p>
      </main>
    );
  }

  const ideas = await listModerationQueue();

  return (
    <main className="mx-auto max-w-2xl w-full px-4 py-8">
      <Link href="/admin" className="text-sm underline">
        ← Back to admin
      </Link>
      <h1 className="font-medium text-lg mt-3 mb-1">Moderation queue</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Every idea that hasn&apos;t been ruled on yet, reported ones first. Mark it clear to let
        it stay visible, or complaint to hide it from the public site.
      </p>

      <div className="border-t border-neutral-200">
        {ideas.map((idea) => (
          <ModerationRow
            key={idea.id}
            idea={{
              id: idea.id,
              headline: idea.headline,
              body: idea.body,
              brandName: idea.brand.name,
              reported: idea.reportedAt !== null,
            }}
          />
        ))}
        {ideas.length === 0 && (
          <p className="py-6 text-sm text-neutral-500">Nothing waiting on a ruling.</p>
        )}
      </div>
    </main>
  );
}
