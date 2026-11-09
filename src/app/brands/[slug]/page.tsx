import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { voteIdea } from "@/app/actions";
import { signOut } from "@/app/auth/actions";
import { auth } from "@/lib/auth/server";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) notFound();

  const ideas = await prisma.idea.findMany({
    where: { brandId: brand.id },
    include: { _count: { select: { votes: true } } },
  });

  const sorted = ideas.sort((a, b) => b._count.votes - a._count.votes);
  const { data: session } = await auth.getSession();

  return (
    <main className="mx-auto max-w-xl w-full px-4 py-8">
      <div className="flex justify-end mb-3 text-sm text-neutral-500">
        {session?.user ? (
          <form action={signOut} className="flex items-center gap-2">
            <input type="hidden" name="redirectTo" value={`/brands/${brand.slug}`} />
            <span>Signed in as {session.user.name ?? session.user.email}</span>
            <button type="submit" className="underline hover:text-neutral-700">
              Sign out
            </button>
          </form>
        ) : (
          <Link
            href={`/auth/sign-in?redirectTo=${encodeURIComponent(`/brands/${brand.slug}`)}`}
            className="underline hover:text-neutral-700"
          >
            Sign in
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium">
          {brand.name[0]}
        </div>
        <div>
          <h1 className="font-medium text-lg">{brand.name}</h1>
          <p className="text-sm text-neutral-500">
            {ideas.length} ideas · {brand.claimed ? "claimed by this brand" : "not claimed yet"}
          </p>
        </div>
        <Link
          href={`/brands/${brand.slug}/submit`}
          className="ml-auto text-sm border border-neutral-300 rounded-md px-3 py-1.5 hover:bg-neutral-50"
        >
          Submit idea
        </Link>
      </div>

      <div className="border-t border-neutral-200">
        {sorted.map((idea) => {
          const vote = voteIdea.bind(null, idea.id, brand.slug);
          return (
            <div
              key={idea.id}
              className="flex gap-3 py-3 border-b border-neutral-200"
            >
              <form action={vote}>
                <button
                  type="submit"
                  className="flex flex-col items-center min-w-[40px] text-blue-700 hover:text-blue-900"
                >
                  <span aria-hidden>▲</span>
                  <span className="text-sm font-medium text-neutral-900">
                    {idea._count.votes}
                  </span>
                </button>
              </form>
              <div className="flex-1">
                <p className="text-sm mb-1.5">{idea.text}</p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={idea.status} />
                  {idea.category && (
                    <span className="text-xs text-neutral-400">{idea.category}</span>
                  )}
                </div>
                {idea.response && (
                  <p className="mt-2 text-sm text-neutral-600 border-l-2 border-neutral-200 pl-2">
                    {brand.name}: {idea.response}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="py-6 text-sm text-neutral-500">
            No ideas yet — be the first to submit one.
          </p>
        )}
      </div>
    </main>
  );
}
