import { Router } from "express";
import multer from "multer";
import {
  createCampaign,
  deleteCampaign,
  getCampaignSummary,
  listCampaigns,
} from "../db/repositories/campaigns.js";
import { addProspect, listProspects } from "../db/repositories/prospects.js";
import { getKnowledgeChunks } from "../services/rag/retriever.js";
import { getGenerationState } from "../services/outreach/generation.js";
import { importProspectsFromCSV, importProspectsFromText } from "../services/outreach/importService.js";
import { runGeneration } from "../services/outreach/generation.js";
import { getSendState, runSend } from "../services/outreach/sendService.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const campaignsRouter = Router();

collectKnowledgeChunks();

function collectKnowledgeChunks(): number {
  // Warm up the chunk index so the first generate call is fast.
  const n = getKnowledgeChunks().length;
  if (n > 0) console.log(`[kb] ${n} knowledge chunks indexed`);
  return n;
}

campaignsRouter.get("/api/campaigns", (_req, res) => {
  res.json({ campaigns: listCampaigns() });
});

campaignsRouter.post("/api/campaigns", (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const projectDescription = String(req.body.project_description ?? req.body.projectDescription ?? "").trim();
  if (!name || !projectDescription) {
    res.status(400).json({ error: "name and project_description are required" });
    return;
  }
  const campaign = createCampaign(name, projectDescription);
  res.status(201).json({ campaign });
});

campaignsRouter.get("/api/campaigns/:id", (req, res) => {
  const id = Number(req.params.id);
  const summary = getCampaignSummary(id);
  if (!summary) {
    res.status(404).json({ error: "campaign not found" });
    return;
  }
  const prospects = listProspects(id);
  const generationState = getGenerationState(id);
  const sendState = getSendState(id);
  res.json({ campaign: summary, prospects, generationState, sendState });
});

campaignsRouter.post("/api/campaigns/:id/prospects/import", upload.single("file"), (req, res) => {
  const id = Number(req.params.id);
  const summary = getCampaignSummary(id);
  if (!summary) {
    res.status(404).json({ error: "campaign not found" });
    return;
  }

  const hasFile = Boolean(req.file);
  if (hasFile) {
    const csvText = req.file!.buffer.toString("utf8");
    const result = importProspectsFromCSV(id, csvText, summary.project_description);
    res.json(result);
    return;
  }

  const text = String(req.body.text ?? "").trim();
  if (!text) {
    res.status(400).json({ error: "provide either a CSV file or pasted text" });
    return;
  }
  const result = importProspectsFromText(id, text, summary.project_description);
  res.json(result);
});

campaignsRouter.post("/api/campaigns/:id/prospects", (req, res) => {
  const id = Number(req.params.id);
  const summary = getCampaignSummary(id);
  if (!summary) {
    res.status(404).json({ error: "campaign not found" });
    return;
  }
  const email = String(req.body.email ?? "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    res.status(400).json({ error: "a valid email is required" });
    return;
  }
  const result = addProspect({
    campaignId: id,
    email,
    name: String(req.body.name ?? "").trim(),
    company: String(req.body.company ?? "").trim(),
    project_description: String(req.body.project_description ?? "").trim() || summary.project_description,
  });
  if (!result.ok) {
    res.status(409).json({ error: result.error });
    return;
  }
  res.status(201).json({ id: result.id });
});

campaignsRouter.post("/api/campaigns/:id/generate", async (req, res) => {
  const id = Number(req.params.id);
  try {
    // runGeneration is async; without await the response would serialize the
    // Promise as an empty object and the UI would treat generation as done.
    const state = await runGeneration(id);
    res.status(202).json({ started: true, state });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

campaignsRouter.post("/api/campaigns/:id/send", (req, res) => {
  const id = Number(req.params.id);
  const confirmed = req.body.confirm === true;
  if (!confirmed) {
    res.status(400).json({ error: "you must confirm before sending (confirm: true)" });
    return;
  }
  try {
    const state = runSend(id, { includeFailed: req.body.retryFailed === true });
    res.status(202).json({ started: true, state });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

campaignsRouter.delete("/api/campaigns/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = getCampaignSummary(id);
  if (!existing) {
    res.status(404).json({ error: "campaign not found" });
    return;
  }
  deleteCampaign(id);
  res.json({ ok: true });
});