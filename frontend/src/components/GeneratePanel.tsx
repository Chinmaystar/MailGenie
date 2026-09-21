import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { GenerationState } from "../types";

export function GeneratePanel({
  campaignId,
  pendingCount,
  onProgress,
  onComplete,
}: {
  campaignId: number;
  pendingCount: number;
  onProgress: (state: GenerationState | undefined) => void;
  onComplete: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<GenerationState | undefined>();
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll while running
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(async () => {
      try {
        const res = await api.getCampaign(campaignId);
        if (res.generationState) {
          setState(res.generationState);
          onProgress(res.generationState);
        }
      } catch {
        /* ignore */
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [running, campaignId, onProgress]);

  const handleGenerate = async () => {
    if (pendingCount === 0) return;
    setError(null);
    setSummary(null);
    setRunning(true);
    try {
      const res = await api.generate(campaignId);
      if (res.state && typeof res.state.running === "boolean") {
        setState(res.state);
        onProgress(res.state);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setRunning(false);
    }
  };

  // Stop polling and refresh the prospect list once generation finishes.
  useEffect(() => {
    if (state && typeof state.running === "boolean" && !state.running && running) {
      setRunning(false);
      setSummary(
        state.error && state.succeeded === 0
          ? `Generation failed: ${state.error}`
          : `Generated ${state.succeeded} email(s)${state.failed > 0 ? `, ${state.failed} failed` : ""}.`,
      );
      onComplete();
    }
  }, [state, running, onComplete]);

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Generate emails</h3>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          {pendingCount > 0 ? (
            <span>Ready to generate for {pendingCount} prospects</span>
          ) : (
            <span>No pending prospects</span>
          )}
        </div>
      </div>

      {summary && (
        <div
          className={`rounded-lg p-3 text-sm ${
            summary.startsWith("Generation failed")
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {summary}
        </div>
      )}

      {running && state && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Generating…</span>
            <span>
              {state.processed} / {state.total} ({state.succeeded} ok, {state.failed} failed)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${state.total > 0 ? (state.processed / state.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={running || pendingCount === 0}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {running ? "Generating…" : "Generate Emails"}
      </button>
    </div>
  );
}
