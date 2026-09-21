import type { CampaignCounts } from "../types";

export function StatsBar({ counts }: { counts: CampaignCounts }) {
  const items: { label: string; value: number; tone: string }[] = [
    { label: "Prospects", value: counts.total, tone: "bg-neutral-900" },
    { label: "Generated", value: counts.generated, tone: "bg-blue-600" },
    { label: "Approved", value: counts.approved, tone: "bg-green-600" },
    { label: "Sent", value: counts.sent, tone: "bg-violet-600" },
    { label: "Failed", value: counts.failed, tone: "bg-red-600" },
    { label: "Pending", value: counts.pending, tone: "bg-neutral-400" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold tabular-nums">{item.value}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
            <span className={`h-1.5 w-1.5 rounded-full ${item.tone}`} />
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}