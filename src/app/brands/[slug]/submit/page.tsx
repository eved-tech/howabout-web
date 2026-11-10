import { notFound } from "next/navigation";
import { getBrandSummary } from "@/app/actions";
import { PageShell } from "@/components/PageShell";
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
    <PageShell
      title={`Submit an idea for ${brand.name}`}
      subtitle={
        <>
          {brand.description && <p style={{ margin: "0 0 8px" }}>{brand.description}</p>}
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#6b5f55" }}>
            {brand.claimed ? "Claimed by this brand" : "Not claimed yet"} · {brand.ideaCount}{" "}
            {brand.ideaCount === 1 ? "idea" : "ideas"} · {brand.voteCount}{" "}
            {brand.voteCount === 1 ? "vote" : "votes"} ·{" "}
            {brand.responseRate === null ? "no ideas answered yet" : `responds to ${brand.responseRate}% of ideas`}
          </p>
        </>
      }
      maxWidth={560}
    >
      <SubmitForm brandSlug={brand.slug} brandName={brand.name} />
    </PageShell>
  );
}
