const STYLES: Record<string, string> = {
  NEW: "bg-amber-100 text-amber-800",
  PLANNED: "bg-blue-100 text-blue-800",
  RESPONDED: "bg-green-100 text-green-800",
  DECLINED: "bg-neutral-100 text-neutral-600",
};

const LABELS: Record<string, string> = {
  NEW: "New",
  PLANNED: "Planned",
  RESPONDED: "Responded",
  DECLINED: "Declined",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-md font-medium ${STYLES[status] ?? STYLES.NEW}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
