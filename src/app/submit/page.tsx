import { PageShell } from "@/components/PageShell";
import { BrandSearch } from "./BrandSearch";

export default function SubmitEntryPage() {
  return (
    <PageShell title="Go on, say it" maxWidth={480}>
      <BrandSearch />
    </PageShell>
  );
}
