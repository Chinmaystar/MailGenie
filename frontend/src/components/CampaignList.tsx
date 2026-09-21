import type { Campaign } from "../types";
import { CampaignCard } from "./CampaignCard";

export default function CampaignList({
  campaigns,
  onOpen,
  onDelete,
}: {
  campaigns: Campaign[];
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (campaigns.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No campaigns yet. Create one to get started.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onOpen={() => onOpen(campaign.id)}
          onDelete={() => onDelete(campaign.id)}
        />
      ))}
    </div>
  );
}