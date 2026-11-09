import { redirect } from "next/navigation";
import { NewBrandSubmitForm } from "./NewBrandSubmitForm";

export default async function NewBrandSubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  if (!name?.trim()) redirect("/submit");

  return (
    <main className="mx-auto max-w-xl w-full px-4 py-8">
      <h1 className="font-medium text-lg mb-1">Submit an idea for {name}</h1>
      <p className="text-sm text-neutral-500 mb-6">
        We don&apos;t have {name} on How about yet — your idea will be reviewed
        before it goes live.
      </p>
      <NewBrandSubmitForm brandName={name} />
    </main>
  );
}
