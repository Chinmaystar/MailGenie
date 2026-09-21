import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { CampaignDetail, GenerationState, SendState } from "../types";
import { StatsBar } from "../components/StatsBar";
import { ImportPanel } from "../components/ImportPanel";
import { GeneratePanel } from "../components/GeneratePanel";
import { SendPanel } from "../components/SendPanel";
import { ProspectCard } from "../components/ProspectCard";

export default function CampaignPage({
  id,
  onBack,
}: {
  id: number;
  onBack: () => void;
}) {
  const [data, setData] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.getCampaign(id);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleProgress = (genState: GenerationState | undefined, sendState: SendState | undefined) => {
    if (genState) setData((d) => (d ? { ...d, generationState: genState } : null));
    if (sendState) setData((d) => (d ? { ...d, sendState } : null));
  };

  const handleChange = () => load();

  if (loading) return <p className="mx-auto max-w-6xl px-6 py-12 text-center text-neutral-500">Loading…</p>;
  if (error || !data) return <p className="mx-auto max-w-6xl px-6 py-12 text-center text-red-600">{error ?? "Campaign not found"}</p>;

  const { campaign, prospects, sendState } = data;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          ← Back
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">{campaign.name}</h1>
          <p className="truncate text-sm text-neutral-500">{campaign.project_description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-600">
            {campaign.status}
          </span>
        </div>
      </div>

      <StatsBar counts={campaign.counts} />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <ImportPanel campaignId={id} onImported={handleChange} />

          <GeneratePanel
            campaignId={id}
            pendingCount={campaign.counts.pending}
            onProgress={(s) => handleProgress(s, undefined)}
            onComplete={handleChange}
          />

          <SendPanel
            campaignId={id}
            approvedCount={campaign.counts.approved}
            failedCount={campaign.counts.failed}
            onSent={handleChange}
            onProgress={(s) => handleProgress(undefined, s)}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Prospects ({prospects.length})</h2>
            {prospects.length === 0 ? (
              <p className="text-sm text-neutral-500">No prospects yet. Import or add some above.</p>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                {prospects.map((p) => (
                  <ProspectCard
                    key={p.id}
                    prospect={p}
                    onChanged={handleChange}
                    disabled={sendState?.running === true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}