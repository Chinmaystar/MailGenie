import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const dataDir = path.resolve(__dirname, "../../data");

export const config = {
  port: int(process.env.PORT, 3001),
  sendDelayMs: int(process.env.SEND_DELAY_MS, 5000),
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmModel: process.env.LLM_MODEL || "gpt-4o-mini",
  llmBaseUrl: process.env.LLM_BASE_URL || undefined,
  ragProvider: process.env.RAG_PROVIDER || "bm25",
  embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  fromEmail: process.env.FROM_EMAIL ?? "",
  fromName: process.env.FROM_NAME || "Kelvor",
  dataDir: path.resolve(__dirname, "../../data"),
  knowledgeDir: path.resolve(__dirname, "../../knowledge"),
};

export const dbFile = path.join(config.dataDir, "outreach.db");