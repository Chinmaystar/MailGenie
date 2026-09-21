import { config } from "../../config.js";
import { loadKnowledge } from "./chunker.js";
import { Bm25Retriever } from "./bm25.js";
import { EmbeddingRetriever } from "./embeddings.js";
import type { Chunk, Retriever } from "./types.js";

let cached: Retriever | null = null;

function build(): Retriever {
  const chunks = loadKnowledge(config.knowledgeDir);
  console.log(`[rag] loaded ${chunks.length} knowledge chunks from ${config.knowledgeDir}`);
  if (config.ragProvider === "embeddings") {
    console.log(`[rag] using embeddings retriever (${config.embeddingModel})`);
    return new EmbeddingRetriever(chunks);
  }
  return new Bm25Retriever(chunks);
}

export function getRetriever(): Retriever {
  if (!cached) cached = build();
  return cached;
}

/** Force a rebuild — call after knowledge files change. */
export function reloadRetriever(): Retriever {
  cached = build();
  return cached;
}

export function getKnowledgeChunks(): Chunk[] {
  return loadKnowledge(config.knowledgeDir);
}