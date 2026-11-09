import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/app/auth/actions";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { ideas: true } } },
  });
  const { data: session } = await auth.getSession();

  return (
    <main className="mx-auto max-w-xl w-full px-4 py-12">
      <div className="flex justify-end mb-3 text-sm text-neutral-500">
        {session?.user ? (
          <form action={signOut} className="flex items-center gap-2">
            <span>Signed in as {session.user.name ?? session.user.email}</span>
            <button type="submit" className="underline hover:text-neutral-700">
              Sign out
            </button>
          </form>
        ) : (
          <Link href="/auth/sign-in" className="underline hover:text-neutral-700">
            Sign in
          </Link>
        )}
      </div>
      <h1 className="text-2xl font-medium mb-1">How about</h1>
      <p className="text-neutral-500 mb-8">
        Ideas for how South African brands could do better — submitted and
        upvoted by the people who shop there.
      </p>

      <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/brands/${brand.slug}`}
            className="flex items-center justify-between py-3 hover:bg-neutral-50"
          >
            <span className="font-medium">{brand.name}</span>
            <span className="text-sm text-neutral-500">
              {brand._count.ideas} ideas
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
