import { config } from "../../config.js";
import { getCampaign, updateCampaignStatus } from "../../db/repositories/campaigns.js";
import {
  getProspect,
  listProspects,
  markSent,
  updateProspect,
} from "../../db/repositories/prospects.js";
import { getEmailProvider } from "../email/index.js";

export type SendState = {
  running: boolean;
  approvedTotal: number;
  sent: number;
  failed: number;
  skipped: number;
  error?: string;
  startedAt: string;
};

const states = new Map<number, SendState>();

export function getSendState(campaignId: number): SendState | undefined {
  return states.get(campaignId);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function runSend(
  campaignId: number,
  opts: { includeFailed?: boolean } = {},
): SendState {
  const existing = states.get(campaignId);
  if (existing?.running) throw new Error("Sending already in progress for this campaign");

  const campaign = getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const queue = listProspects(campaignId).filter(
    (p) =>
      p.approved === 1 &&
      p.status !== "sent" &&
      (opts.includeFailed || p.status !== "failed"),
  );
  if (opts.includeFailed && queue.length === 0) {
    throw new Error("No approved prospects to retry");
  }

  const state: SendState = {
    running: true,
    approvedTotal: queue.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    startedAt: new Date().toISOString(),
  };
  states.set(campaignId, state);

  if (queue.length === 0) {
    state.running = false;
    return state;
  }

  updateCampaignStatus(campaignId, "sending");

  void (async () => {
    const provider = getEmailProvider();

    for (const prospect of queue) {
      if (!prospect.generated_subject || !prospect.generated_body) {
        state.skipped += 1;
        updateProspect(prospect.id, { status: "generated", error: "No generated content" });
        continue;
      }

      updateProspect(prospect.id, { status: "approved" });

      const result = await provider.sendEmail({
        to: prospect.email,
        subject: prospect.generated_subject,
        text: prospect.generated_body,
      });

      if (result.success) {
        state.sent += 1;
        updateProspect(prospect.id, {
          status: "sent",
          error: null,
          approved: true,
        });
        markSent(prospect.id);
      } else {
        state.failed += 1;
        updateProspect(prospect.id, {
          status: "failed",
          error: result.error ?? "send failed",
        });
      }

      if (state.sent + state.failed + state.skipped < queue.length) {
        await sleep(config.sendDelayMs);
      }
    }

    state.running = false;
    const finalStatus =
      state.failed === 0 && state.skipped === 0 ? "completed" : "partial";
    updateCampaignStatus(campaignId, finalStatus);
    console.log(
      `[send] campaign ${campaignId} done: sent=${state.sent} failed=${state.failed} skipped=${state.skipped}`,
    );
  })();

  return state;
}

/** Synchronously re-send one prospect's email (used by the per-prospect retry button). */
export async function resendProspect(
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const prospect = getProspect(id);
  if (!prospect) return { ok: false, error: "prospect not found" };
  if (!prospect.generated_subject || !prospect.generated_body) {
    return { ok: false, error: "no generated content to send" };
  }
  if (prospect.approved !== 1) {
    return { ok: false, error: "prospect is not approved" };
  }

  const result = await getEmailProvider().sendEmail({
    to: prospect.email,
    subject: prospect.generated_subject,
    text: prospect.generated_body,
  });

  if (result.success) {
    updateProspect(id, { status: "sent", error: null, approved: true });
    markSent(id);
    return { ok: true };
  }
  updateProspect(id, { status: "failed", error: result.error ?? "send failed" });
  return { ok: false, error: result.error ?? "send failed" };
}