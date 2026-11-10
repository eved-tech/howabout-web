import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isWithinLastWeek } from "@/lib/time";
import { isBrandOwner } from "@/app/actions";
import { auth } from "@/lib/auth/server";
import { IdeaRow } from "./IdeaRow";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) notFound();

  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect(`/auth/sign-in?redirectTo=${encodeURIComponent(`/dashboard/${slug}`)}`);
  }

  if (!(await isBrandOwner(slug))) {
    return (
      <main className="mx-auto max-w-xl w-full px-4 py-16 text-center">
        <h1 className="font-medium text-lg mb-2">This dashboard belongs to {brand.name}</h1>
        <p className="text-sm text-neutral-500 mb-6">
          If that&apos;s you, get in touch and we&apos;ll set you up with access.
        </p>
        <Link href="/" className="text-sm underline">
          Back to How about
        </Link>
      </main>
    );
  }

  const ideas = await prisma.idea.findMany({
    where: { brandId: brand.id },
    include: { _count: { select: { votes: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalIdeas = ideas.length;
  const totalVotes = ideas.reduce((sum, i) => sum + i._count.votes, 0);
  const responded = ideas.filter((i) => i.status !== "NEW").length;
  const responseRate = totalIdeas === 0 ? 0 : Math.round((responded / totalIdeas) * 100);
  const newThisWeek = ideas.filter((i) => isWithinLastWeek(i.createdAt)).length;

  const sorted = [...ideas].sort((a, b) => b._count.votes - a._count.votes);

  return (
    <main className="mx-auto max-w-2xl w-full px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium">
          {brand.name[0]}
        </div>
        <div>
          <h1 className="font-medium text-lg">{brand.name} dashboard</h1>
          {brand.claimed && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md">
              Verified brand
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Metric label="Total ideas" value={totalIdeas} />
        <Metric label="Total votes" value={totalVotes} />
        <Metric label="Response rate" value={`${responseRate}%`} />
        <Metric label="New this week" value={newThisWeek} />
      </div>

      <div className="border-t border-neutral-200">
        {sorted.map((idea, i) => (
          <IdeaRow
            key={idea.id}
            idea={{
              id: idea.id,
              headline: idea.headline,
              body: idea.body,
              status: idea.status,
              votes: idea._count.votes,
              response: idea.response,
            }}
            brandSlug={brand.slug}
            startExpanded={i === 0 && idea.status === "NEW"}
          />
        ))}
        {sorted.length === 0 && (
          <p className="py-6 text-sm text-neutral-500">No ideas submitted yet.</p>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-neutral-100 rounded-lg p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-2xl font-medium">{value}</p>
    </div>
  );
}
