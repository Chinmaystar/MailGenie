import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { SendState } from "../types";

export function SendPanel({
  campaignId,
  approvedCount,
  failedCount,
  onSent,
  onProgress,
}: {
  campaignId: number;
  approvedCount: number;
  failedCount: number;
  onSent: () => void;
  onProgress: (state: SendState | undefined) => void;
}) {
  const [running, setRunning] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"send" | "retry" | null>(null);
  const [state, setState] = useState<SendState | undefined>();
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(async () => {
      try {
        const res = await api.getCampaign(campaignId);
        setState(res.sendState);
        onProgress(res.sendState);
      } catch {
        /* ignore */
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [running, campaignId, onProgress]);

  const startSend = async (retryFailed: boolean) => {
    setConfirmMode(null);
    setError(null);
    setRunning(true);
    try {
      const res = await api.send(campaignId, { retryFailed });
      if (res.state) setState(res.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
      setRunning(false);
    }
  };

  useEffect(() => {
    if (state && !state.running && running) {
      setRunning(false);
      const msg = `Campaign complete — Sent: ${state.sent}, Failed: ${state.failed}, Skipped: ${state.skipped}`;
      setSummary(msg);
      onSent();
    }
  }, [state, running, onSent]);

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Send approved emails</h3>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          {approvedCount > 0 ? (
            <span>{approvedCount} approved emails ready to send</span>
          ) : (
            <span>No approved emails</span>
          )}
        </div>
      </div>

      {summary && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{summary}</div>
      )}

      {running && state && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Sending…</span>
            <span>
              {state.sent} sent, {state.failed} failed, {state.skipped} skipped of {state.approvedTotal}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full bg-violet-600 transition-all"
              style={{
                width: `${state.approvedTotal > 0 ? ((state.sent + state.failed + state.skipped) / state.approvedTotal) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setConfirmMode("send")}
          disabled={running || approvedCount === 0}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {running ? "Sending…" : "Send Approved Emails"}
        </button>
        <button
          onClick={() => setConfirmMode("retry")}
          disabled={running || failedCount === 0}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Retry Failed ({failedCount})
        </button>
      </div>

      {confirmMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="rounded-xl bg-white p-6 shadow-xl w-full max-w-md">
            {confirmMode === "send" ? (
              <>
                <h4 className="mb-2 text-lg font-semibold">Send {approvedCount} emails?</h4>
                <p className="mb-4 text-sm text-neutral-600">
                  This will send all approved emails with a ~5 second delay between each.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmMode(null)}
                    className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => startSend(false)}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                  >
                    Send {approvedCount} Emails
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className="mb-2 text-lg font-semibold">Retry {failedCount} failed emails?</h4>
                <p className="mb-4 text-sm text-neutral-600">
                  This will re-send only the prospects whose last send failed.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmMode(null)}
                    className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => startSend(true)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Retry {failedCount} Emails
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
