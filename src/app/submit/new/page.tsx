import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { NewBrandSubmitForm } from "./NewBrandSubmitForm";

export default async function NewBrandSubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  if (!name?.trim()) redirect("/submit");

  return (
    <PageShell
      title={`Submit an idea for ${name}`}
      subtitle={`We don't have ${name} on How about yet — your idea will be reviewed before it goes live.`}
      maxWidth={560}
    >
      <NewBrandSubmitForm brandName={name} />
    </PageShell>
  );
}
