import fs from "node:fs";
import path from "node:path";
import { config } from "../../config.js";
import { getCampaign, updateCampaignStatus } from "../../db/repositories/campaigns.js";
import {
  countProspects,
  listProspects,
  updateProspect,
  type ProspectRow,
} from "../../db/repositories/prospects.js";
import type { CampaignRow } from "../../db/index.js";
import { getLLMProvider } from "../llm/OpenAIProvider.js";
import { getRetriever } from "../rag/retriever.js";
import type { RetrievedChunk } from "../rag/types.js";

export type GenerationState = {
  running: boolean;
  processed: number;
  total: number;
  succeeded: number;
  failed: number;
  error?: string;
  startedAt: string;
};

const states = new Map<number, GenerationState>();

export function getGenerationState(campaignId: number): GenerationState | undefined {
  return states.get(campaignId);
}

function emailStyle(): string {
  const file = path.join(config.knowledgeDir, "email-style.md");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  return "";
}

const SYSTEM_PROMPT = `You are a senior outbound sales copywriter for Kelvor, a web development company. You write concise, personal, human outreach emails that get replies.

Your only job: given a prospect, a project description, and retrieved knowledge about Kelvor, write ONE subject line and ONE email body.

STRICT RULES:
1. GROUND EVERYTHING. Only claim Kelvor facts (clients, projects, technologies, results, statistics, capabilities) that appear in the provided "Kelvor Knowledge" context. If the knowledge does not say it, do not claim it. Never invent clients, projects, case studies, numbers, or results.
2. Personalize naturally: use the prospect's name and reference their company and their stated requirement where available.
3. Keep the body under 150 words.
4. End with a clear but non-pushy call to action (e.g. happy to discuss requirements / send a short intro / quick call).
5. Tone: friendly, confident, concise, human. Plain text only (no markdown), short paragraphs.
6. FORBIDDEN filler and cliches: "I hope this email finds you well", "I'm reaching out to", "I wanted to reach out", "I hope you're doing well", "This email is to", "Just following up", generic buzz like "synergy", "cutting-edge", "leverage".
7. Only reference technologies/relevant capabilities if the prospect's project or the knowledge suggests they are relevant. Do not stuff unrelated skills.
8. Sign off with "Best,\nKelvor Team" (or "Thanks,\nKelvor Team").
9. If the prospect's name is unknown, omit the greeting and start with the first sentence.
10. Do not mention the prospect's email address.
11. Write like a personal one-to-one email, NOT a marketing campaign. Never include links, images, emojis, bullet lists, bold text, phone numbers, calendar links, or "PS" offers.
12. Subject line: 3-7 plain words, specific to their project or pain point, like a colleague wrote it. Never salesy: no "offer", "deal", "free", "exclusive", "opportunity", "proposal", "growth", no exclamation marks, no emojis, no clickbait or colon-stacked phrases.
13. Zero sales-pressure vocabulary anywhere: no "limited time", "act now", "don't miss", "guarantee", "boost your business", "10x", percentages or metrics as bait. Ask about their need; never pitch a package or price.`;

export function buildUserPrompt(prospect: ProspectRow, campaign: CampaignRow, chunks: RetrievedChunk[]): string {
  const prospectSub = prospect.project_description.trim();
  const project = prospectSub || campaign.project_description;

  const context = chunks
    .map((c) => `--- ${c.source} ${c.title ? `(${c.title})` : ""} ---\n${c.content}`)
    .join("\n\n");

  return `PROSPECT
Name: ${prospect.name || "(unknown)"}
Company: ${prospect.company || "(unknown)"}
Their stated project: ${prospectSub || "(none given)"}

CAMPAIGN PROJECT DESCRIPTION
${project || "(none provided)"}

KELVOR KNOWLEDGE (retrieved context - do not claim anything not present here)
${context || "(no knowledge retrieved)"}

KELVOR EMAIL STYLE GUIDE
${emailStyle()}

Respond with ONLY a valid JSON object and nothing else, in this exact shape:
{"subject": "subject line", "body": "email body"}`;
}

export function parseEmailJson(text: string): { subject: string; body: string } | null {
  const cleaned = text.trim().replace(/^```(?:json)?|```$/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    const subject = String(parsed.subject ?? "").trim();
    const body = String(parsed.body ?? "").trim();
    if (!subject || !body) return null;
    return { subject, body };
  } catch {
    return null;
  }
}

export async function generateForProspect(prospect: ProspectRow, campaign: CampaignRow): Promise<{ ok: true } | { ok: false; error: string }> {
  const MAX_RETRIES = 3;
  let lastError = "LLM returned an unparseable response";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const retriever = getRetriever();
      const query = [prospect.company, prospect.name, prospect.project_description, campaign.project_description]
        .filter(Boolean)
        .join(" · ");
      const chunks = await retriever.retrieve(query, 6);

      const provider = getLLMProvider();
      const output = await provider.generateText({
        system: SYSTEM_PROMPT,
        user: buildUserPrompt(prospect, campaign, chunks),
      });

      const parsed = parseEmailJson(output);
      if (parsed) {
        const res = updateProspect(prospect.id, {
          generated_subject: parsed.subject,
          generated_body: parsed.body,
          status: "generated",
        });
        if (!res.ok) return res;
        return { ok: true };
      }
      lastError = "LLM returned an unparseable response";
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  return { ok: false, error: lastError };
}

export async function runGeneration(campaignId: number): Promise<GenerationState> {
  const existing = states.get(campaignId);
  if (existing?.running) {
    throw new Error("Generation already in progress for this campaign");
  }

  const campaign = getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const total = countProspects(campaignId, "pending");
  if (total === 0) throw new Error("No pending prospects to generate");

  const state: GenerationState = {
    running: true,
    processed: 0,
    total,
    succeeded: 0,
    failed: 0,
    startedAt: new Date().toISOString(),
  };
  states.set(campaignId, state);

  updateCampaignStatus(campaignId, "generating");

  const prospects = listProspects(campaignId).filter((p) => p.status === "pending");

  // Kick off in the background so the HTTP request returns immediately.
  void (async () => {
    // Small concurrency keeps things simple but reasonable.
    const CONCURRENCY = 2;
    let index = 0;
    const worker = async () => {
      while (index < prospects.length) {
        const prospect = prospects[index++];
        const result = await generateForProspect(prospect, campaign);
        if (result.ok) state.succeeded += 1;
        else {
          state.failed += 1;
          updateProspect(prospect.id, { status: "failed", error: result.error });
        }
        state.processed += 1;
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    state.running = false;
    if (state.failed === 0) {
      updateCampaignStatus(campaignId, "ready");
    } else if (state.succeeded > 0) {
      updateCampaignStatus(campaignId, "ready");
    } else {
      updateCampaignStatus(campaignId, "draft");
      state.error = "All generations failed";
    }
    console.log(`[generate] campaign ${campaignId} done: ${state.succeeded} ok, ${state.failed} failed`);
  })();

  return state;
}