import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Campaign } from "../types";
import NewCampaignForm from "../components/NewCampaignForm";
import CampaignList from "../components/CampaignList";

export default function Dashboard({
  openCampaign,
}: {
  openCampaign: (id: number) => void;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const { campaigns } = await api.listCampaigns();
      setCampaigns(campaigns);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this campaign and all its prospects?")) return;
    await api.deleteCampaign(id);
    load();
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div>
          <NewCampaignForm
            onCreate={(id) => {
              load();
              openCampaign(id);
            }}
          />
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold">Campaigns</h2>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : (
            <CampaignList campaigns={campaigns} onOpen={openCampaign} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </main>
  );
}