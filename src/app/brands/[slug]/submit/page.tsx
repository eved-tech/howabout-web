import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubmitForm } from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) notFound();

  return (
    <main className="mx-auto max-w-xl w-full px-4 py-8">
      <h1 className="font-medium text-lg mb-6">Submit an idea for {brand.name}</h1>
      <SubmitForm brandSlug={brand.slug} brandName={brand.name} />
    </main>
  );
}
