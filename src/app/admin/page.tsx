import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { listBrandsForAdmin } from "@/app/actions";
import { GrantOwnerForm } from "./GrantOwnerForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect(`/auth/sign-in?redirectTo=${encodeURIComponent("/admin")}`);
  }
  if (session.user.email !== process.env.ADMIN_EMAIL) {
    return (
      <main className="mx-auto max-w-xl w-full px-4 py-16 text-center">
        <p className="text-sm text-neutral-500">You don&apos;t have access to this page.</p>
      </main>
    );
  }

  const brands = await listBrandsForAdmin();

  return (
    <main className="mx-auto max-w-2xl w-full px-4 py-8">
      <Link href="/admin/moderation" className="text-sm underline">
        Moderation queue →
      </Link>
      <h1 className="font-medium text-lg mt-3 mb-1">Brand dashboard access</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Grant someone access to a brand&apos;s dashboard by email. They&apos;ll need to sign in
        with that same email to use it.
      </p>

      <div className="border-t border-neutral-200">
        {brands.map((brand) => (
          <div key={brand.id} className="py-3 border-b border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {brand.name}
                {!brand.approved && (
                  <span className="ml-2 text-xs text-amber-600">(pending approval)</span>
                )}
              </span>
              {brand.claimed && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md">
                  Claimed
                </span>
              )}
            </div>
            {brand.owners.length > 0 && (
              <p className="text-xs text-neutral-500 mb-2">
                Access: {brand.owners.map((o) => o.user.email).join(", ")}
              </p>
            )}
            <GrantOwnerForm brandSlug={brand.slug} />
          </div>
        ))}
      </div>
    </main>
  );
}
