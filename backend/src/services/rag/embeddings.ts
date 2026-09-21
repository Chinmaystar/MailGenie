import { config } from "../../config.js";
import type { Chunk, RetrievedChunk, Retriever } from "./types.js";

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function isOfficialOpenAI(): boolean {
  return !config.llmBaseUrl || config.llmBaseUrl.includes("api.openai.com");
}

async function fetchEmbeddings(inputs: string[]): Promise<number[][]> {
  const res = await fetch(config.llmBaseUrl + "/embeddings", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + config.llmApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.embeddingModel,
      input: inputs,
    }),
  });

  const data = await res.json() as {
    data?: Array<{ embedding: number[] }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    const msg = data.error?.message ?? JSON.stringify(data);
    throw new Error("Embedding request failed: " + msg);
  }
  return data.data?.map((d) => d.embedding) ?? [];
}

export class EmbeddingRetriever implements Retriever {
  readonly name = "embeddings";
  private chunks: Chunk[];
  private vectors: number[][] = [];
  private ready: Promise<void>;

  constructor(chunks: Chunk[]) {
    this.chunks = chunks;
    this.ready = this.build();
  }

  private async embed(inputs: string[]): Promise<number[][]> {
    if (isOfficialOpenAI()) {
      const { getOpenAIClient } = await import("../llm/openaiClient.js");
      const client = getOpenAIClient();
      const res = await client.embeddings.create({
        model: config.embeddingModel,
        input: inputs,
      });
      return res.data.map((d) => d.embedding as number[]);
    }
    return fetchEmbeddings(inputs);
  }

  private async build(): Promise<void> {
    if (this.chunks.length === 0) return;
    const inputs = this.chunks.map((c) => `${c.title}\n${c.content}`);
    const batchSize = 64;
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      const vectors = await this.embed(batch);
      this.vectors.push(...vectors);
    }
  }

  async retrieve(query: string, topK = 6): Promise<RetrievedChunk[]> {
    await this.ready;
    if (this.vectors.length === 0) return [];
    const [queryVector] = await this.embed([query]);
    return this.chunks
      .map((chunk, i) => ({ ...chunk, score: cosine(queryVector, this.vectors[i] ?? []) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}