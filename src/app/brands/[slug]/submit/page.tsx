import { notFound } from "next/navigation";
import { getBrandSummary } from "@/app/actions";
import { SubmitForm } from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await getBrandSummary(slug);
  if (!brand) notFound();

  return (
    <main className="mx-auto max-w-xl w-full px-4 py-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium">
          {brand.name[0]}
        </div>
        <div>
          <h1 className="font-medium text-lg">Submit an idea for {brand.name}</h1>
          {brand.description && (
            <p className="text-sm text-neutral-500">{brand.description}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-neutral-500 mb-6">
        {brand.claimed ? "Claimed by this brand" : "Not claimed yet"} ·{" "}
        {brand.ideaCount} {brand.ideaCount === 1 ? "idea" : "ideas"} ·{" "}
        {brand.voteCount} {brand.voteCount === 1 ? "vote" : "votes"} ·{" "}
        {brand.responseRate === null
          ? "no ideas answered yet"
          : `responds to ${brand.responseRate}% of ideas`}
      </p>

      <SubmitForm brandSlug={brand.slug} brandName={brand.name} />
    </main>
  );
}
