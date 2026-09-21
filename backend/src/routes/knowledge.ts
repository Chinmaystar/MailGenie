import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { config } from "../config.js";
import { getKnowledgeChunks, reloadRetriever } from "../services/rag/retriever.js";

export const knowledgeRouter = Router();

knowledgeRouter.get("/api/knowledge", (_req, res) => {
  const docs: { file: string; size: number }[] = [];
  if (fs.existsSync(config.knowledgeDir)) {
    for (const f of fs.readdirSync(config.knowledgeDir)) {
      const full = path.join(config.knowledgeDir, f);
      const stat = fs.statSync(full);
      if (stat.isFile()) docs.push({ file: f, size: stat.size });
    }
  }
  res.json({ chunks: getKnowledgeChunks().length, docs });
});

knowledgeRouter.post("/api/knowledge/reload", (_req, res) => {
  reloadRetriever();
  res.json({ ok: true });
});