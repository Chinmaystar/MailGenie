import type { Campaign } from "../types";
import { Stat } from "./ui";

export function CampaignCard({
  campaign,
  onOpen,
  onDelete,
}: {
  campaign: Campaign;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { total, generated, approved, sent } = campaign.counts;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold">{campaign.name}</h3>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
            {campaign.status}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-neutral-500">{campaign.project_description}</p>
        <p className="mt-0.5 text-xs text-neutral-400">
          Created {new Date(campaign.created_at + "Z").toLocaleString()}
        </p>
      </div>
      <div className="flex items-center gap-5">
        <Stat label="Prospects" value={total} />
        <Stat label="Generated" value={generated} />
        <Stat label="Approved" value={approved} />
        <Stat label="Sent" value={sent} />
        <div className="ml-2 flex items-center gap-2">
          <button
            onClick={onOpen}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Open
          </button>
          <button
            onClick={onDelete}
            title="Delete campaign"
            className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm text-neutral-400 transition hover:border-red-200 hover:text-red-600"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}