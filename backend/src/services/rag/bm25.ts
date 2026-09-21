import type { Chunk, RetrievedChunk, Retriever } from "./types.js";

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has",
  "have", "he", "her", "his", "i", "in", "is", "it", "its", "of", "on", "or",
  "our", "she", "that", "the", "their", "them", "they", "this", "to", "was",
  "we", "were", "will", "with", "you", "your", "us", "can", "do", "does",
  "should", "would", "could", "about", "into", "over", "after", "before",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[-.]+|[-.]+$/g, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

const K1 = 1.5;
const B = 0.75;

/**
 * Lightweight in-memory BM25 index over knowledge chunks.
 * No network calls, no external vector database — ideal for a small internal
 * knowledge base. Swappable via the Retriever interface.
 */
export class Bm25Retriever implements Retriever {
  readonly name = "bm25";
  private chunks: Chunk[];
  private docTokens: string[][] = [];
  private docLengths: number[] = [];
  private avgLength = 0;
  private df = new Map<string, number>();

  constructor(chunks: Chunk[]) {
    this.chunks = chunks;
    this.build();
  }

  private build() {
    this.docTokens = this.chunks.map((c) => tokenize(`${c.title} ${c.source} ${c.content}`));
    this.docLengths = this.docTokens.map((t) => t.length);
    this.avgLength =
      this.docLengths.length > 0
        ? this.docLengths.reduce((a, b) => a + b, 0) / this.docLengths.length
        : 0;

    this.df.clear();
    for (const tokens of this.docTokens) {
      for (const token of new Set(tokens)) {
        this.df.set(token, (this.df.get(token) ?? 0) + 1);
      }
    }
  }

  async retrieve(query: string, topK = 6): Promise<RetrievedChunk[]> {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0 || this.chunks.length === 0) return [];

    const N = this.chunks.length;
    const scores = this.docTokens.map((tokens, i) => {
      const tf = new Map<string, number>();
      for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);

      let score = 0;
      for (const q of queryTokens) {
        const termFreq = tf.get(q);
        if (!termFreq) continue;
        const df = this.df.get(q) ?? 0;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        const dl = this.docLengths[i] || 1;
        const denom = termFreq + K1 * (1 - B + (B * dl) / (this.avgLength || 1));
        score += idf * ((termFreq * (K1 + 1)) / denom);
      }
      return score;
    });

    return this.chunks
      .map((chunk, i) => ({ ...chunk, score: scores[i] }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}