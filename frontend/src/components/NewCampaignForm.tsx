import { useState } from "react";
import { api } from "../api/client";

export default function NewCampaignForm({
  onCreate,
}: {
  onCreate: (id: number) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { campaign } = await api.createCampaign({
        name: name.trim(),
        project_description: description.trim(),
      });
      onCreate(campaign.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold">New campaign</h2>
      <div>
        <label htmlFor="campaign-name" className="mb-1 block text-sm font-medium text-neutral-600">
          Campaign name
        </label>
        <input
          id="campaign-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. ACME ecommerce outreach"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>
      <div>
        <label htmlFor="campaign-desc" className="mb-1 block text-sm font-medium text-neutral-600">
          Project description
        </label>
        <textarea
          id="campaign-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="e.g. ABC Fashion is looking for a Shopify ecommerce website with Razorpay payments, Shiprocket integration and a custom admin dashboard."
          className="w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !name.trim() || !description.trim()}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Creating…" : "Create campaign"}
      </button>
    </form>
  );
}