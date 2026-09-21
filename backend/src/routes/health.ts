import { Router } from "express";
import { config } from "../config.js";
import { getRetriever } from "../services/rag/retriever.js";

export const healthRouter = Router();

healthRouter.get("/api/health", (_req, res) => {
  const retriever = getRetriever();
  res.json({
    ok: true,
    ragProvider: retriever.name,
    llmConfigured: Boolean(config.llmApiKey),
    emailConfigured: Boolean(config.resendApiKey && config.fromEmail),
    sendDelayMs: config.sendDelayMs,
  });
});